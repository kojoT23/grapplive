import { describe, it, expect, beforeEach } from "vitest";
import {
  useDeliveryStore,
  activeDeliveryFor,
  claimedScheduledFor,
  openOffersFor,
  openScheduledFor,
} from "./useDeliveryStore";
import { useOrdersStore } from "./useOrdersStore";
import { useRiderStore } from "./useRiderStore";
import { useRiderIdentityStore } from "./useRiderIdentityStore";
import { useCashLedgerStore } from "./useCashLedgerStore";
import { useAppStore } from "./useAppStore";
import { useLocationStore } from "./useLocationStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";
import { totalEarned } from "@/lib/delivery/earnings";
import {
  compareSlots,
  isSlotToday,
  isValidSlot,
  slotDateOptions,
  slotLabel,
  toDateKey,
  type DeliverySlot,
} from "@/lib/mock-data/deliverySlots";
import { CASH_HOLD_LIMIT_GHS } from "@/lib/mock-data/cash";
import type { Order, PaymentMethod } from "@/lib/mock-data/orders";

// Mon 10 Nov 2026, 9:00 local. Tomorrow is "2026-11-11".
const TODAY = new Date(2026, 10, 10, 9, 0).getTime();
const TOMORROW = new Date(2026, 10, 11, 9, 0).getTime();
const SLOT: DeliverySlot = { date: "2026-11-11", window: "morning" };

const store = () => useDeliveryStore.getState();

function order(id: string, slot?: DeliverySlot, payment: PaymentMethod = "direct_momo"): Order {
  return {
    id,
    buyerPhone: "+233501234567",
    deliveryArea: "Accra",
    groups: [
      {
        id: `${id}-g1`,
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Wardrobe", priceGHS: 1200, quantity: 1 }],
        paymentMethod: payment,
        status: "ready_to_pack",
        deliveryFeeGHS: 20,
        deliveryFeeChargedGHS: 20,
        deliverySlot: slot,
        history: [{ status: "ready_to_pack", label: "Order confirmed", timestamp: "now" }],
      },
    ],
  };
}

function makeRider(phone = "+233501111111", name = "Kwesi", online = false) {
  const id = useRiderIdentityStore
    .getState()
    .getOrCreateRiderId(phone, { name, vehicle: "motorbike", area: "Accra" });
  useRiderStore.getState().setOnline(id, online);
  return id;
}

const groupOf = (orderId: string) =>
  useOrdersStore.getState().orders.find((o) => o.id === orderId)!.groups[0];

function request(orderId: string) {
  requestDeliveryForGroup(`${orderId}-g1`);
  return store().deliveries.find((d) => d.orderGroupId === `${orderId}-g1`)!;
}

// Takes a started stop through pickup to the customer's door.
function driveToDoor(id: string, rider: string) {
  store().advance(id, rider);
  store().advance(id, rider);
  store().advance(id, rider);
}

describe("delivery day helpers", () => {
  it("turns a time into the local calendar day", () => {
    expect(toDateKey(TODAY)).toBe("2026-11-10");
    expect(toDateKey(new Date(2026, 10, 10, 23, 59).getTime())).toBe("2026-11-10");
    expect(toDateKey(new Date(2026, 10, 11, 0, 1).getTime())).toBe("2026-11-11");
  });

  it("offers a week of days starting tomorrow, and nothing without a real clock", () => {
    const days = slotDateOptions(TODAY);
    expect(days).toHaveLength(7);
    expect(days[0].key).toBe("2026-11-11");
    expect(days[6].key).toBe("2026-11-17");
    expect(slotDateOptions(0)).toEqual([]);
  });

  it("knows what's today, orders slots earliest first, and labels them", () => {
    expect(isSlotToday(SLOT, TOMORROW)).toBe(true);
    expect(isSlotToday(SLOT, TODAY)).toBe(false);
    expect(isSlotToday(SLOT, 0)).toBe(false);

    const slots: DeliverySlot[] = [
      { date: "2026-11-12", window: "morning" },
      { date: "2026-11-11", window: "evening" },
      { date: "2026-11-11", window: "morning" },
    ];
    expect(slots.sort(compareSlots).map((s) => `${s.date} ${s.window}`)).toEqual([
      "2026-11-11 morning",
      "2026-11-11 evening",
      "2026-11-12 morning",
    ]);
    expect(slotLabel(SLOT)).toContain("Morning (8am – 12pm)");
  });

  it("rejects malformed slots", () => {
    expect(isValidSlot(SLOT)).toBe(true);
    expect(isValidSlot(undefined)).toBe(false);
    expect(isValidSlot({ date: "tomorrow", window: "morning" })).toBe(false);
    expect(isValidSlot({ date: "2026-11-11", window: "midnight" as never })).toBe(false);
  });
});

describe("scheduled delivery", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [order("o1", SLOT)], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useCashLedgerStore.setState({ entries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
    useAppStore.setState({ phone: "+233501234567", isVerified: true, roles: [], activeRole: null });
    useLocationStore.setState({ areaName: "Accra" });
  });

  describe("requesting it", () => {
    it("carries the day the buyer picked onto the delivery", () => {
      const d = request("o1");
      expect(d.slot).toEqual(SLOT);
      expect(d.status).toBe("offered");
    });

    it("is never shown as a same-day offer; it appears in the scheduled list instead", () => {
      const rider = makeRider("+233501111111", "Kwesi", true);
      request("o1");
      expect(openOffersFor(store().deliveries, rider, "Accra")).toHaveLength(0);
      expect(openScheduledFor(store().deliveries, rider, "Accra")).toHaveLength(1);
      expect(openScheduledFor(store().deliveries, rider, "Kumasi")).toHaveLength(0);
    });

    it("an ordinary order still gets a live offer", () => {
      useOrdersStore.setState({ orders: [order("o2")] });
      const rider = makeRider("+233501111111", "Kwesi", true);
      request("o2");
      expect(openOffersFor(store().deliveries, rider, "Accra")).toHaveLength(1);
      expect(openScheduledFor(store().deliveries, rider, "Accra")).toHaveLength(0);
    });

    it("cannot be accepted as a live offer", () => {
      const rider = makeRider("+233501111111", "Kwesi", true);
      const d = request("o1");
      expect(store().acceptOffer(d.id, rider)).toBe("gone");
    });
  });

  describe("claiming it", () => {
    it("books the rider for the day without starting anything, even when offline", () => {
      const rider = makeRider(); // offline
      const d = request("o1");

      expect(store().claimScheduled(d.id, rider)).toBe("ok");
      expect(store().deliveries[0].status).toBe("scheduled");
      expect(store().deliveries[0].riderId).toBe(rider);
      expect(activeDeliveryFor(store().deliveries, rider)).toBeUndefined();
      expect(claimedScheduledFor(store().deliveries, rider)).toHaveLength(1);
      expect(groupOf("o1").status).toBe("rider_assigned");
      expect(groupOf("o1").riderName).toBe("Kwesi");
    });

    it("only one rider can claim a job", () => {
      const a = makeRider("+233501111111", "Kwesi");
      const b = makeRider("+233502222222", "Yaw");
      const d = request("o1");
      expect(store().claimScheduled(d.id, a)).toBe("ok");
      expect(store().claimScheduled(d.id, b)).toBe("gone");
    });

    it("a rider can claim several stops for the same day", () => {
      useOrdersStore.setState({ orders: [order("o1", SLOT), order("o2", SLOT), order("o3", SLOT)] });
      const rider = makeRider();
      for (const id of ["o1", "o2", "o3"]) {
        expect(store().claimScheduled(request(id).id, rider)).toBe("ok");
      }
      expect(claimedScheduledFor(store().deliveries, rider)).toHaveLength(3);
    });

    it("is refused for a rider holding too much unhanded cash", () => {
      const rider = makeRider();
      useCashLedgerStore.getState().recordCollection({
        deliveryId: "dx", orderGroupId: "ox-g1", riderId: rider, riderName: "Kwesi",
        sellerId: "s1", sellerName: "Ama's", amountGHS: CASH_HOLD_LIMIT_GHS,
      });
      expect(store().claimScheduled(request("o1").id, rider)).toBe("cash_limit");
    });

    it("is refused for unknown riders and for ordinary (non-scheduled) deliveries", () => {
      expect(store().claimScheduled(request("o1").id, "nobody")).toBe("unknown_rider");

      useOrdersStore.setState({ orders: [order("o2")] });
      const rider = makeRider();
      expect(store().claimScheduled(request("o2").id, rider)).toBe("gone");
    });
  });

  describe("starting a stop on its day", () => {
    function claimed() {
      const rider = makeRider();
      const d = request("o1");
      store().claimScheduled(d.id, rider);
      return { rider, id: d.id };
    }

    it("is only possible on the chosen day", () => {
      const { rider, id } = claimed();
      expect(store().startScheduledStop(id, rider, TODAY)).toBe("not_today");
      expect(store().deliveries[0].status).toBe("scheduled");

      expect(store().startScheduledStop(id, rider, TOMORROW)).toBe("ok");
      expect(store().deliveries[0].status).toBe("heading_to_pickup");
    });

    it("only for the rider who claimed it", () => {
      const { id } = claimed();
      const other = makeRider("+233502222222", "Yaw");
      expect(store().startScheduledStop(id, other, TOMORROW)).toBe("invalid");
    });

    it("one stop at a time", () => {
      useOrdersStore.setState({ orders: [order("o1", SLOT), order("o2", SLOT)] });
      const rider = makeRider();
      const first = request("o1");
      const second = request("o2");
      store().claimScheduled(first.id, rider);
      store().claimScheduled(second.id, rider);

      expect(store().startScheduledStop(first.id, rider, TOMORROW)).toBe("ok");
      expect(store().startScheduledStop(second.id, rider, TOMORROW)).toBe("busy");

      driveToDoor(first.id, rider);
      store().completeDelivery(first.id, rider, store().deliveries.find((d) => d.id === first.id)!.otp);
      expect(store().startScheduledStop(second.id, rider, TOMORROW)).toBe("ok");
    });

    it("runs like any trip from here: pickup, door, customer code", () => {
      const { rider, id } = claimed();
      store().startScheduledStop(id, rider, TOMORROW);
      driveToDoor(id, rider);
      const otp = store().deliveries[0].otp;
      expect(store().completeDelivery(id, rider, otp)).toBe("ok");
      expect(groupOf("o1").status).toBe("delivered");
    });
  });

  describe("pay is per stop", () => {
    it("a delivered stop pays the full fee and a failed one half, summed over the day", () => {
      useOrdersStore.setState({ orders: [order("o1", SLOT), order("o2", SLOT)] });
      const rider = makeRider();
      const first = request("o1");
      const second = request("o2");
      store().claimScheduled(first.id, rider);
      store().claimScheduled(second.id, rider);

      // stop 1: delivered
      store().startScheduledStop(first.id, rider, TOMORROW);
      driveToDoor(first.id, rider);
      store().completeDelivery(first.id, rider, store().deliveries.find((d) => d.id === first.id)!.otp);

      // stop 2: customer not there, parcel goes back and the seller confirms
      store().startScheduledStop(second.id, rider, TOMORROW);
      driveToDoor(second.id, rider);
      store().reportFailure(second.id, rider, "customer_unavailable");
      store().confirmReturn(second.id, rider);
      store().confirmParcelReceived(second.id, "s1");

      expect(totalEarned(store().deliveries, rider)).toBe(20 + 10);
    });
  });

  describe("changing plans", () => {
    it("a rider can hand a claimed job back; it returns to the open list for others", () => {
      const rider = makeRider();
      const other = makeRider("+233502222222", "Yaw");
      const d = request("o1");
      store().claimScheduled(d.id, rider);

      expect(store().releaseJob(d.id, rider)).toBe("ok");
      expect(store().deliveries[0].status).toBe("offered");
      expect(openScheduledFor(store().deliveries, rider, "Accra")).toHaveLength(0);
      expect(openScheduledFor(store().deliveries, other, "Accra")).toHaveLength(1);
      expect(store().claimScheduled(d.id, other)).toBe("ok");
    });

    it("the seller can cancel a scheduled delivery before it starts, freeing the rider", () => {
      const rider = makeRider();
      const d = request("o1");
      store().claimScheduled(d.id, rider);

      expect(store().cancelDelivery(d.id, "s1")).toBe("ok");
      expect(store().deliveries[0].status).toBe("cancelled");
      expect(claimedScheduledFor(store().deliveries, rider)).toHaveLength(0);
      expect(groupOf("o1").status).toBe("ready_to_pack");
    });
  });

  describe("placing the order", () => {
    it("keeps the day the buyer picked on the order", () => {
      useOrdersStore.setState({ orders: [] });
      useOrdersStore.getState().placeOrder([
        {
          sellerId: "s1",
          sellerName: "Ama's",
          items: [{ productId: "p1", itemName: "Wardrobe", priceGHS: 1200, quantity: 1 }],
          paymentMethod: "direct_momo",
          deliverySlot: SLOT,
        },
        {
          sellerId: "s2",
          sellerName: "Kofi's",
          items: [{ productId: "p2", itemName: "Shoes", priceGHS: 80, quantity: 1 }],
          paymentMethod: "direct_momo",
        },
      ]);
      const [a, b] = useOrdersStore.getState().orders[0].groups;
      expect(a.deliverySlot).toEqual(SLOT);
      expect(b.deliverySlot).toBeUndefined();
    });
  });
});
