import { describe, it, expect, beforeEach } from "vitest";
import { useDeliveryStore } from "./useDeliveryStore";
import { useOrdersStore } from "./useOrdersStore";
import { useRiderStore } from "./useRiderStore";
import { useRiderIdentityStore } from "./useRiderIdentityStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";
import { etaTarget, minutesLeft, type Delivery } from "@/lib/mock-data/deliveries";
import type { Order } from "@/lib/mock-data/orders";

const BUYER = "+233501234567";
const store = () => useDeliveryStore.getState();

function order(id: string): Order {
  return {
    id,
    buyerPhone: BUYER,
    deliveryArea: "Accra",
    groups: [
      {
        id: `${id}-g1`,
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 1 }],
        paymentMethod: "instant_confirm",
        status: "ready_to_pack",
        history: [],
      },
    ],
  };
}

function riderId() {
  const id = useRiderIdentityStore
    .getState()
    .getOrCreateRiderId("+233509999999", { name: "Kwesi", vehicle: "motorbike", area: "Accra" });
  useRiderStore.getState().setOnline(id, true);
  return id;
}

// Runs one delivery for `orderId` to completion and returns its id.
function deliver(orderId: string, rider: string): string {
  requestDeliveryForGroup(`${orderId}-g1`);
  const d = store().deliveries.find((x) => x.orderGroupId === `${orderId}-g1`)!;
  store().acceptOffer(d.id, rider);
  store().advance(d.id, rider);
  store().advance(d.id, rider);
  store().advance(d.id, rider);
  store().completeDelivery(d.id, rider, d.otp);
  return d.id;
}

describe("rating a delivery", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [order("o1"), order("o2")], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
  });

  const rider = () => Object.values(useRiderIdentityStore.getState().identitiesByPhone)[0];

  it("saves the stars and note on the delivery and starts the rider's average", () => {
    const r = riderId();
    const id = deliver("o1", r);

    expect(store().rateDelivery(id, BUYER, 5, "  Fast and polite  ")).toBe("ok");
    expect(store().deliveries[0].rating?.stars).toBe(5);
    expect(store().deliveries[0].rating?.comment).toBe("Fast and polite");
    expect(rider().rating).toBe(5);
    expect(rider().ratingCount).toBe(1);
  });

  it("keeps a running average across deliveries", () => {
    const r = riderId();
    store().rateDelivery(deliver("o1", r), BUYER, 5);
    store().rateDelivery(deliver("o2", r), BUYER, 4);
    expect(rider().rating).toBe(4.5);
    expect(rider().ratingCount).toBe(2);
  });

  it("can only be rated once", () => {
    const r = riderId();
    const id = deliver("o1", r);
    store().rateDelivery(id, BUYER, 5);
    expect(store().rateDelivery(id, BUYER, 1)).toBe("already_rated");
    expect(rider().rating).toBe(5);
  });

  it("only the buyer who placed the order can rate it", () => {
    const r = riderId();
    const id = deliver("o1", r);
    expect(store().rateDelivery(id, "+233500000000", 1)).toBe("not_buyer");
    expect(store().deliveries[0].rating).toBeUndefined();
    expect(rider().rating).toBeNull();
  });

  it("only accepts whole stars from 1 to 5, and only after delivery", () => {
    const r = riderId();
    const id = deliver("o1", r);
    expect(store().rateDelivery(id, BUYER, 0)).toBe("invalid");
    expect(store().rateDelivery(id, BUYER, 6)).toBe("invalid");
    expect(store().rateDelivery(id, BUYER, 3.5)).toBe("invalid");

    requestDeliveryForGroup("o2-g1"); // offered, not delivered
    const pending = store().deliveries.find((d) => d.orderGroupId === "o2-g1")!;
    expect(store().rateDelivery(pending.id, BUYER, 5)).toBe("invalid");
  });
});

describe("estimated arrival", () => {
  const delivery = (acceptedAt: number | null): Delivery =>
    ({
      etaMinutes: 20,
      history: acceptedAt === null ? [{ status: "offered", at: 1 }] : [{ status: "heading_to_pickup", at: acceptedAt }],
    }) as Delivery;

  it("is the accept time plus the estimated trip", () => {
    expect(etaTarget(delivery(1_000_000))).toBe(1_000_000 + 20 * 60_000);
    expect(etaTarget(delivery(null))).toBeNull();
  });

  it("counts down in whole minutes and stops at zero", () => {
    const d = delivery(1_000_000);
    expect(minutesLeft(d, 1_000_000)).toBe(20);
    expect(minutesLeft(d, 1_000_000 + 5 * 60_000 + 1)).toBe(15);
    expect(minutesLeft(d, 1_000_000 + 25 * 60_000)).toBe(0);
  });

  it("shows nothing before there's an ETA or a real clock time", () => {
    expect(minutesLeft(delivery(null), 5_000_000)).toBeNull();
    expect(minutesLeft(delivery(1_000_000), 0)).toBeNull();
  });
});
