import { describe, it, expect, beforeEach } from "vitest";
import {
  useDeliveryStore,
  activeDeliveryFor,
  historyFor,
  openOffersFor,
} from "./useDeliveryStore";
import { useOrdersStore } from "./useOrdersStore";
import { useRiderStore } from "./useRiderStore";
import { useRiderIdentityStore } from "./useRiderIdentityStore";
import { useCashLedgerStore, heldTotal, pendingForSeller } from "./useCashLedgerStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";
import { canRequestAgain, deliveryNeedsSeller } from "@/lib/mock-data/deliveries";
import { CASH_HOLD_LIMIT_GHS } from "@/lib/mock-data/cash";
import type { Order, PaymentMethod, OrderStatus } from "@/lib/mock-data/orders";

const BUYER = "+233501234567";
const G = "o1-g1";
const store = () => useDeliveryStore.getState();
const ledger = () => useCashLedgerStore.getState();
const group = () => useOrdersStore.getState().orders[0].groups[0];

function order(payment: PaymentMethod = "instant_confirm", status: OrderStatus = "ready_to_pack", price = 100): Order {
  return {
    id: "o1",
    buyerPhone: BUYER,
    deliveryArea: "Accra",
    groups: [
      {
        id: G,
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Dress", priceGHS: price, quantity: 1 }],
        paymentMethod: payment,
        status,
        history: [{ status, label: "start", timestamp: "now" }],
      },
    ],
  };
}

function makeRider(phone = "+233501111111", name = "Kwesi") {
  const id = useRiderIdentityStore
    .getState()
    .getOrCreateRiderId(phone, { name, vehicle: "motorbike", area: "Accra" });
  useRiderStore.getState().setOnline(id, true);
  return id;
}

// Requests a delivery and takes it as far as `upTo` steps (1 = accepted,
// 2 = at pickup, 3 = out for delivery, 4 = at the customer).
function progress(rider: string, upTo: number) {
  requestDeliveryForGroup(G);
  const id = store().deliveries[store().deliveries.length - 1].id;
  store().acceptOffer(id, rider);
  for (let i = 2; i <= upTo; i++) store().advance(id, rider);
  return id;
}

describe("delivery lifecycle: cancelling, returns and disputes", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [order()], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useCashLedgerStore.setState({ entries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
  });

  describe("the seller cancelling a delivery", () => {
    it("works while the request is still waiting, restoring the order for a new request", () => {
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;

      expect(store().cancelDelivery(id, "s1")).toBe("ok");
      expect(store().deliveries[0].status).toBe("cancelled");
      expect(group().status).toBe("ready_to_pack"); // where it was before
      expect(canRequestAgain(store().deliveries[0])).toBe(true);

      requestDeliveryForGroup(G);
      expect(store().deliveries).toHaveLength(2);
    });

    it("frees an assigned rider, up to the moment the parcel is picked up", () => {
      const rider = makeRider();
      const id = progress(rider, 2); // at pickup

      expect(store().cancelDelivery(id, "s1")).toBe("ok");
      expect(activeDeliveryFor(store().deliveries, rider)).toBeUndefined();
      expect(historyFor(store().deliveries, rider)[0].status).toBe("cancelled");
      expect(group().riderName).toBeUndefined();
    });

    it("is not possible once the parcel is picked up, or by another seller", () => {
      const rider = makeRider();
      const id = progress(rider, 3); // out for delivery
      expect(store().cancelDelivery(id, "s1")).toBe("invalid");

      useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
      requestDeliveryForGroup(G);
      expect(store().cancelDelivery(store().deliveries[0].id, "someone-else")).toBe("invalid");
      expect(store().deliveries[0].status).toBe("offered");
    });
  });

  describe("a rider handing a job back", () => {
    it("sends it back out to other riders, but not to the same rider", () => {
      const rider = makeRider();
      const other = makeRider("+233502222222", "Yaw");
      const id = progress(rider, 2);

      expect(store().releaseJob(id, rider)).toBe("ok");
      expect(store().deliveries[0].status).toBe("offered");
      expect(store().deliveries[0].riderId).toBeNull();
      expect(group().status).toBe("ready_for_pickup");
      expect(group().riderName).toBeUndefined();
      expect(openOffersFor(store().deliveries, rider, "Accra")).toHaveLength(0);
      expect(openOffersFor(store().deliveries, other, "Accra")).toHaveLength(1);
      expect(store().acceptOffer(id, other)).toBe("ok");
    });

    it("is not possible once the rider has the parcel, or for someone else's job", () => {
      const rider = makeRider();
      const stranger = makeRider("+233502222222", "Yaw");
      const id = progress(rider, 2);
      expect(store().releaseJob(id, stranger)).toBe("invalid");

      store().advance(id, rider); // picked up
      expect(store().releaseJob(id, rider)).toBe("invalid");
    });
  });

  describe("returning the parcel after a failed delivery", () => {
    function failedAtDoor() {
      const rider = makeRider();
      const id = progress(rider, 4);
      store().reportFailure(id, rider, "wrong_address");
      return { rider, id };
    }

    it("is a trail: the rider says it's back, then the seller confirms", () => {
      const { rider, id } = failedAtDoor();

      expect(store().confirmReturn(id, rider)).toBe("ok");
      expect(store().deliveries[0].status).toBe("returned");
      expect(group().status).toBe("ready_for_pickup");
      expect(activeDeliveryFor(store().deliveries, rider)).toBeUndefined();
      expect(deliveryNeedsSeller(store().deliveries[0])).toBe(true);

      expect(store().confirmParcelReceived(id, "s1")).toBe("ok");
      expect(store().deliveries[0].returnConfirmedAt).toBeDefined();
    });

    it("can't be skipped, faked by someone else, or confirmed twice", () => {
      const { rider, id } = failedAtDoor();
      const stranger = makeRider("+233502222222", "Yaw");

      expect(store().confirmParcelReceived(id, "s1")).toBe("invalid"); // not returned yet
      expect(store().confirmReturn(id, stranger)).toBe("invalid");
      store().confirmReturn(id, rider);
      expect(store().confirmReturn(id, rider)).toBe("invalid");
      expect(store().confirmParcelReceived(id, "someone-else")).toBe("invalid");
      store().confirmParcelReceived(id, "s1");
      expect(store().confirmParcelReceived(id, "s1")).toBe("invalid");
    });

    it("blocks a new request until the seller has confirmed the parcel is back", () => {
      const { rider, id } = failedAtDoor();
      store().confirmReturn(id, rider);

      requestDeliveryForGroup(G);
      expect(store().deliveries).toHaveLength(1); // refused: parcel not confirmed yet
      expect(canRequestAgain(store().deliveries[0])).toBe(false);

      store().confirmParcelReceived(id, "s1");
      requestDeliveryForGroup(G);
      expect(store().deliveries).toHaveLength(2);
    });

    it("keeps the rider busy until they've brought it back, and records it in their history", () => {
      const { rider, id } = failedAtDoor();
      expect(activeDeliveryFor(store().deliveries, rider)?.status).toBe("returning");
      store().confirmReturn(id, rider);
      expect(historyFor(store().deliveries, rider)[0].status).toBe("returned");
    });
  });

  describe("a buyer cancelling an order", () => {
    it("works for a cash-on-delivery order that hasn't been dispatched", () => {
      useOrdersStore.setState({ orders: [order("cash_on_delivery")] });
      expect(useOrdersStore.getState().cancelByBuyer(G, BUYER)).toBe("ok");
      expect(group().status).toBe("cancelled");
      expect(group().history[group().history.length - 1].label).toMatch(/cancelled by the buyer/i);
    });

    it("is refused once a rider has been requested, and for other people", () => {
      useOrdersStore.setState({ orders: [order("cash_on_delivery")] });
      expect(useOrdersStore.getState().cancelByBuyer(G, "+233500000000")).toBe("not_buyer");

      requestDeliveryForGroup(G); // dispatched: ready_for_pickup
      expect(useOrdersStore.getState().cancelByBuyer(G, BUYER)).toBe("not_cancellable");
      expect(group().status).toBe("ready_for_pickup");
    });
  });

  describe("cash the seller says never arrived", () => {
    function handedOverCash() {
      useOrdersStore.setState({ orders: [order("cash_on_delivery", "ready_to_pack", 250)] });
      const rider = makeRider();
      const id = progress(rider, 4);
      store().completeDelivery(id, rider, store().deliveries[0].otp);
      const entry = ledger().entries[0];
      ledger().handOver(entry.id, rider);
      return { rider, entry };
    }

    it("is disputed by the seller, leaving the rider responsible for it", () => {
      const { rider, entry } = handedOverCash();
      expect(heldTotal(ledger().entries, rider)).toBe(0);

      expect(ledger().disputeReceived(entry.id, "s1")).toBe("ok");
      expect(ledger().entries[0].status).toBe("disputed");
      expect(pendingForSeller(ledger().entries, "s1")).toHaveLength(0);
      expect(heldTotal(ledger().entries, rider)).toBe(250);
    });

    it("only the receiving seller can dispute, and only a pending handover", () => {
      const { rider, entry } = handedOverCash();
      expect(ledger().disputeReceived(entry.id, "someone-else")).toBe("invalid");
      ledger().disputeReceived(entry.id, "s1");
      expect(ledger().disputeReceived(entry.id, "s1")).toBe("invalid"); // already disputed
      expect(ledger().confirmReceived(entry.id, "s1")).toBe("invalid"); // not pending any more
      void rider;
    });

    it("the rider can hand it over again, and the seller can then confirm it", () => {
      const { rider, entry } = handedOverCash();
      ledger().disputeReceived(entry.id, "s1");

      expect(ledger().handOver(entry.id, rider)).toBe("ok");
      expect(ledger().entries[0].status).toBe("handover_pending");
      expect(ledger().confirmReceived(entry.id, "s1")).toBe("ok");
      expect(ledger().entries[0].status).toBe("settled");
      expect(heldTotal(ledger().entries, rider)).toBe(0);
    });

    it("counts toward the cash limit while disputed", () => {
      useOrdersStore.setState({
        orders: [order("cash_on_delivery", "ready_to_pack", CASH_HOLD_LIMIT_GHS)],
      });
      const rider = makeRider();
      const id = progress(rider, 4);
      store().completeDelivery(id, rider, store().deliveries[0].otp);
      ledger().handOver(ledger().entries[0].id, rider);
      ledger().disputeReceived(ledger().entries[0].id, "s1");

      // a second job for the same rider is refused while the cash is disputed
      useOrdersStore.setState({
        orders: [
          useOrdersStore.getState().orders[0],
          { ...order("instant_confirm"), id: "o2", groups: [{ ...order().groups[0], id: "o2-g1" }] },
        ],
      });
      requestDeliveryForGroup("o2-g1");
      const second = store().deliveries.find((d) => d.orderGroupId === "o2-g1")!;
      expect(store().acceptOffer(second.id, rider)).toBe("cash_limit");
    });
  });
});

describe("skipped and re-sent offers", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [order()], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
  });

  it("a rider can bring back an offer they declined, with a fresh timer", () => {
    requestDeliveryForGroup(G);
    const rider = makeRider();
    const id = store().deliveries[0].id;
    store().markOfferSeen(id, rider, 1000);
    store().declineOffer(id, rider);
    expect(openOffersFor(store().deliveries, rider, "Accra")).toHaveLength(0);

    store().restoreOffer(id, rider);
    expect(openOffersFor(store().deliveries, rider, "Accra")).toHaveLength(1);
    expect(store().deliveries[0].offerSeenAt[rider]).toBeUndefined();
    expect(store().acceptOffer(id, rider)).toBe("ok");
  });

  it("restoring only affects that rider", () => {
    requestDeliveryForGroup(G);
    const a = makeRider();
    const b = makeRider("+233502222222", "Yaw");
    const id = store().deliveries[0].id;
    store().declineOffer(id, a);
    store().declineOffer(id, b);

    store().restoreOffer(id, a);
    expect(openOffersFor(store().deliveries, a, "Accra")).toHaveLength(1);
    expect(openOffersFor(store().deliveries, b, "Accra")).toHaveLength(0);
  });

  it("the seller can send a still-open request out again to everyone", () => {
    requestDeliveryForGroup(G);
    const a = makeRider();
    const b = makeRider("+233502222222", "Yaw");
    const id = store().deliveries[0].id;
    store().declineOffer(id, a);
    store().declineOffer(id, b);

    store().reofferDelivery(id);
    expect(openOffersFor(store().deliveries, a, "Accra")).toHaveLength(1);
    expect(openOffersFor(store().deliveries, b, "Accra")).toHaveLength(1);
  });

  it("neither does anything once a rider has taken the job", () => {
    requestDeliveryForGroup(G);
    const rider = makeRider();
    const id = store().deliveries[0].id;
    store().acceptOffer(id, rider);

    store().reofferDelivery(id);
    store().restoreOffer(id, rider);
    expect(store().deliveries[0].status).toBe("heading_to_pickup");
    expect(store().deliveries[0].riderId).toBe(rider);
  });
});
