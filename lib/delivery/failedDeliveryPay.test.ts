import { describe, it, expect, beforeEach } from "vitest";
import {
  availableToCashOut,
  earnedAt,
  earnedFeeGHS,
  earnedSince,
  halfFeeGHS,
  keptFromCash,
  totalEarned,
} from "./earnings";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { useRiderIdentityStore } from "@/lib/store/useRiderIdentityStore";
import { useCashLedgerStore } from "@/lib/store/useCashLedgerStore";
import { requestDeliveryForGroup } from "./dispatch";
import type { Order, PaymentMethod } from "@/lib/mock-data/orders";

const G = "o1-g1";
const store = () => useDeliveryStore.getState();

function order(payment: PaymentMethod = "direct_momo"): Order {
  return {
    id: "o1",
    buyerPhone: "+233501234567",
    deliveryArea: "Accra",
    groups: [
      {
        id: G,
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 1 }],
        paymentMethod: payment,
        status: "ready_to_pack",
        deliveryFeeGHS: 15,
        deliveryFeeChargedGHS: payment === "instant_confirm" ? 0 : 15,
        history: [],
      },
    ],
  };
}

function riderOnline() {
  const id = useRiderIdentityStore
    .getState()
    .getOrCreateRiderId("+233509999999", { name: "Kwesi", vehicle: "motorbike", area: "Accra" });
  useRiderStore.getState().setOnline(id, true);
  return id;
}

// Takes a delivery `steps` steps along: 1 accepted, 2 at pickup, 3 picked up, 4 at the door.
function run(rider: string, steps: number) {
  requestDeliveryForGroup(G);
  const id = store().deliveries[store().deliveries.length - 1].id;
  store().acceptOffer(id, rider);
  for (let i = 2; i <= steps; i++) store().advance(id, rider);
  return id;
}

describe("what a rider is paid when a delivery fails", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [order()], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useCashLedgerStore.setState({ entries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
  });

  it("is half the fee, rounded to pesewas", () => {
    expect(halfFeeGHS(15)).toBe(7.5);
    expect(halfFeeGHS(13)).toBe(6.5);
    expect(halfFeeGHS(14)).toBe(7);
  });

  it("a completed delivery pays the full fee", () => {
    const rider = riderOnline();
    const id = run(rider, 4);
    store().completeDelivery(id, rider, store().deliveries[0].otp);
    expect(earnedFeeGHS(store().deliveries[0])).toBe(15);
  });

  it("a customer-side failure pays half only once the seller confirms the parcel is back", () => {
    const rider = riderOnline();
    const id = run(rider, 4);
    store().reportFailure(id, rider, "customer_unavailable");
    expect(earnedFeeGHS(store().deliveries[0])).toBe(0); // still returning

    store().confirmReturn(id, rider);
    expect(earnedFeeGHS(store().deliveries[0])).toBe(0); // rider says it's back; not confirmed

    store().confirmParcelReceived(id, "s1");
    expect(earnedFeeGHS(store().deliveries[0])).toBe(7.5);
    expect(totalEarned(store().deliveries, rider)).toBe(7.5);
    expect(availableToCashOut(store().deliveries, [], rider)).toBe(7.5);
  });

  it("a seller problem at pickup pays half straight away", () => {
    const rider = riderOnline();
    const id = run(rider, 2);
    store().reportFailure(id, rider, "seller_unavailable");
    expect(store().deliveries[0].status).toBe("failed");
    expect(earnedFeeGHS(store().deliveries[0])).toBe(7.5);
  });

  it("pays nothing when the seller cancels or the rider hands the job back", () => {
    const rider = riderOnline();
    const first = run(rider, 2);
    store().cancelDelivery(first, "s1");
    expect(earnedFeeGHS(store().deliveries[0])).toBe(0);

    useOrdersStore.setState({ orders: [order()] });
    useDeliveryStore.setState({ deliveries: [] });
    const second = run(rider, 2);
    store().releaseJob(second, rider);
    expect(totalEarned(store().deliveries, rider)).toBe(0);
  });

  it("a failed cash-on-delivery order pays the half fee through earnings (no cash was kept)", () => {
    useOrdersStore.setState({ orders: [order("cash_on_delivery")] });
    const rider = riderOnline();
    const id = run(rider, 4);
    store().reportFailure(id, rider, "customer_refused");
    store().confirmReturn(id, rider);
    store().confirmParcelReceived(id, "s1");

    expect(keptFromCash(store().deliveries, rider)).toBe(0);
    expect(availableToCashOut(store().deliveries, [], rider)).toBe(7.5);
    expect(useCashLedgerStore.getState().entries).toHaveLength(0); // nothing was collected
  });

  it("counts toward today/7 days from when it was earned", () => {
    const rider = riderOnline();
    const id = run(rider, 4);
    store().reportFailure(id, rider, "wrong_address");
    store().confirmReturn(id, rider);
    store().confirmParcelReceived(id, "s1");

    const at = earnedAt(store().deliveries[0])!;
    expect(at).toBe(store().deliveries[0].returnConfirmedAt);
    expect(earnedSince(store().deliveries, rider, at - 1000)).toBe(7.5);
    expect(earnedSince(store().deliveries, rider, at + 1000)).toBe(0);
  });
});
