import { describe, it, expect, beforeEach } from "vitest";
import {
  useCashLedgerStore,
  heldTotal,
  entriesForRider,
  pendingForSeller,
} from "./useCashLedgerStore";
import { useDeliveryStore } from "./useDeliveryStore";
import { useOrdersStore } from "./useOrdersStore";
import { useRiderStore } from "./useRiderStore";
import { useRiderIdentityStore } from "./useRiderIdentityStore";
import { useAppStore } from "./useAppStore";
import { useLocationStore } from "./useLocationStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";
import {
  availableToCashOut,
  completedFor,
  earnedSince,
  requestCashOut,
  startOfDay,
} from "@/lib/delivery/earnings";
import { CASH_HOLD_LIMIT_GHS } from "@/lib/mock-data/cash";
import type { Order, PaymentMethod } from "@/lib/mock-data/orders";

const ledger = () => useCashLedgerStore.getState();
const deliveries = () => useDeliveryStore.getState();

function orderFor(id: string, payment: PaymentMethod, price: number): Order {
  return {
    id,
    buyerPhone: "+233501234567",
    deliveryArea: "Accra",
    groups: [
      {
        id: `${id}-g1`,
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Dress", priceGHS: price, quantity: 1 }],
        paymentMethod: payment,
        status: "ready_to_pack",
        history: [],
      },
    ],
  };
}

function makeRider(phone: string, name: string) {
  const id = useRiderIdentityStore
    .getState()
    .getOrCreateRiderId(phone, { name, vehicle: "motorbike", area: "Accra" });
  useRiderStore.getState().setOnline(id, true);
  return id;
}

// Runs a delivery for `orderId` all the way through with the right OTP.
function deliver(orderId: string, rider: string) {
  requestDeliveryForGroup(`${orderId}-g1`);
  const d = deliveries().deliveries.find((x) => x.orderGroupId === `${orderId}-g1`)!;
  const accepted = deliveries().acceptOffer(d.id, rider);
  if (accepted !== "ok") return accepted;
  deliveries().advance(d.id, rider);
  deliveries().advance(d.id, rider);
  deliveries().advance(d.id, rider);
  return deliveries().completeDelivery(d.id, rider, d.otp);
}

describe("cash on delivery and the cash ledger", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useCashLedgerStore.setState({ entries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
    useAppStore.setState({ phone: "", isVerified: false, roles: [], activeRole: null });
    useLocationStore.setState({ areaName: null });
  });

  describe("placing a cash-on-delivery order", () => {
    it("is confirmed straight away, ready for the seller to pack", () => {
      useOrdersStore.getState().placeOrder([
        {
          sellerId: "s1",
          sellerName: "Ama's",
          items: [{ productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 2 }],
          paymentMethod: "cash_on_delivery",
        },
      ]);
      const g = useOrdersStore.getState().orders[0].groups[0];
      expect(g.status).toBe("ready_to_pack");
      expect(g.history[0].label).toMatch(/cash on delivery/i);
    });

    it("makes the delivery collect the item total in cash; prepaid orders collect nothing", () => {
      useOrdersStore.setState({
        orders: [orderFor("o1", "cash_on_delivery", 250), orderFor("o2", "instant_confirm", 250)],
      });
      requestDeliveryForGroup("o1-g1");
      requestDeliveryForGroup("o2-g1");
      const cod = deliveries().deliveries.find((d) => d.orderGroupId === "o1-g1")!;
      const paid = deliveries().deliveries.find((d) => d.orderGroupId === "o2-g1")!;
      expect(cod.codAmountGHS).toBe(250);
      expect(paid.codAmountGHS).toBe(0);
    });
  });

  describe("collecting cash", () => {
    it("is recorded in the ledger only when the OTP-confirmed delivery completes", () => {
      useOrdersStore.setState({ orders: [orderFor("o1", "cash_on_delivery", 250)] });
      const rider = makeRider("+233501111111", "Kwesi");
      requestDeliveryForGroup("o1-g1");
      const d = deliveries().deliveries[0];
      deliveries().acceptOffer(d.id, rider);
      deliveries().advance(d.id, rider);
      deliveries().advance(d.id, rider);
      deliveries().advance(d.id, rider);

      expect(ledger().entries).toHaveLength(0); // not yet delivered
      deliveries().completeDelivery(d.id, rider, d.otp);

      expect(ledger().entries).toHaveLength(1);
      const entry = ledger().entries[0];
      expect(entry.amountGHS).toBe(250);
      expect(entry.status).toBe("held");
      expect(entry.riderId).toBe(rider);
      expect(entry.sellerId).toBe("s1");
      expect(heldTotal(ledger().entries, rider)).toBe(250);
    });

    it("a prepaid delivery records no cash", () => {
      useOrdersStore.setState({ orders: [orderFor("o1", "instant_confirm", 250)] });
      const rider = makeRider("+233501111111", "Kwesi");
      expect(deliver("o1", rider)).toBe("ok");
      expect(ledger().entries).toHaveLength(0);
    });

    it("a delivery can only ever record its cash once", () => {
      const input = {
        deliveryId: "d1", orderGroupId: "o1-g1", riderId: "r1", riderName: "Kwesi",
        sellerId: "s1", sellerName: "Ama's", amountGHS: 100,
      };
      expect(ledger().recordCollection(input)).not.toBeNull();
      expect(ledger().recordCollection(input)).toBeNull();
      expect(ledger().entries).toHaveLength(1);
    });
  });

  describe("handing the cash over", () => {
    function withHeldCash() {
      useOrdersStore.setState({ orders: [orderFor("o1", "cash_on_delivery", 250)] });
      const rider = makeRider("+233501111111", "Kwesi");
      deliver("o1", rider);
      return { rider, entry: ledger().entries[0] };
    }

    it("goes held -> pending (rider) -> settled (the receiving seller)", () => {
      const { rider, entry } = withHeldCash();

      expect(ledger().handOver(entry.id, rider)).toBe("ok");
      expect(ledger().entries[0].status).toBe("handover_pending");
      expect(heldTotal(ledger().entries, rider)).toBe(0);
      expect(pendingForSeller(ledger().entries, "s1")).toHaveLength(1);

      expect(ledger().confirmReceived(entry.id, "s1")).toBe("ok");
      expect(ledger().entries[0].status).toBe("settled");
      expect(pendingForSeller(ledger().entries, "s1")).toHaveLength(0);
    });

    it("a rider can't settle their own cash, and a seller can't confirm before the handover", () => {
      const { rider, entry } = withHeldCash();

      expect(ledger().confirmReceived(entry.id, "s1")).toBe("invalid"); // still held
      expect(ledger().handOver(entry.id, "someone-else")).toBe("invalid");
      ledger().handOver(entry.id, rider);
      expect(ledger().handOver(entry.id, rider)).toBe("invalid"); // already pending
      expect(ledger().confirmReceived(entry.id, "s2")).toBe("invalid"); // wrong seller
      expect(ledger().entries[0].status).toBe("handover_pending");
    });

    it("each rider only sees their own cash", () => {
      const { rider } = withHeldCash();
      const other = makeRider("+233502222222", "Yaw");
      expect(entriesForRider(ledger().entries, rider)).toHaveLength(1);
      expect(entriesForRider(ledger().entries, other)).toHaveLength(0);
    });
  });

  describe("the cash limit", () => {
    it("stops a rider holding too much cash from accepting a new job, until they hand it over", () => {
      useOrdersStore.setState({
        orders: [orderFor("o1", "cash_on_delivery", CASH_HOLD_LIMIT_GHS), orderFor("o2", "instant_confirm", 50)],
      });
      const rider = makeRider("+233501111111", "Kwesi");
      expect(deliver("o1", rider)).toBe("ok");
      expect(heldTotal(ledger().entries, rider)).toBe(CASH_HOLD_LIMIT_GHS);

      expect(deliver("o2", rider)).toBe("cash_limit");

      ledger().handOver(ledger().entries[0].id, rider);
      const second = deliveries().deliveries.find((d) => d.orderGroupId === "o2-g1")!;
      expect(deliveries().acceptOffer(second.id, rider)).toBe("ok");
    });
  });

  describe("earnings", () => {
    it("are the fees of completed deliveries, separate from cash collected", () => {
      useOrdersStore.setState({ orders: [orderFor("o1", "cash_on_delivery", 250)] });
      const rider = makeRider("+233501111111", "Kwesi");
      deliver("o1", rider);

      const fee = deliveries().deliveries[0].feeGHS;
      expect(completedFor(deliveries().deliveries, rider)).toHaveLength(1);
      expect(availableToCashOut(deliveries().deliveries, [], rider)).toBe(fee); // not fee + 250
    });

    it("count by period, using the time the delivery was completed", () => {
      useOrdersStore.setState({ orders: [orderFor("o1", "instant_confirm", 50)] });
      const rider = makeRider("+233501111111", "Kwesi");
      deliver("o1", rider);
      const d = deliveries().deliveries[0];
      const deliveredAt = d.history.find((h) => h.status === "delivered")!.at;

      expect(earnedSince(deliveries().deliveries, rider, deliveredAt - 1000)).toBe(d.feeGHS);
      expect(earnedSince(deliveries().deliveries, rider, deliveredAt + 1000)).toBe(0);
      expect(startOfDay(deliveredAt)).toBeLessThanOrEqual(deliveredAt);
    });

    it("cash-out takes everything available once, then there is nothing left", () => {
      useOrdersStore.setState({ orders: [orderFor("o1", "instant_confirm", 50)] });
      const rider = makeRider("+233501111111", "Kwesi");
      deliver("o1", rider);
      const fee = deliveries().deliveries[0].feeGHS;

      expect(requestCashOut(rider)).toBe(fee);
      expect(useRiderStore.getState().cashOutsByRider[rider]).toHaveLength(1);
      expect(requestCashOut(rider)).toBe(0);
      expect(useRiderStore.getState().cashOutsByRider[rider]).toHaveLength(1);
    });

    it("a rider with no completed deliveries has nothing to cash out", () => {
      const rider = makeRider("+233501111111", "Kwesi");
      expect(requestCashOut(rider)).toBe(0);
    });
  });
});
