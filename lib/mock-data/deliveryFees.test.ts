import { describe, it, expect, beforeEach } from "vitest";
import { deliveryFeeFor, deliveryFeePayer } from "./deliveryFees";
import { groupPayable, groupTotal, type PaymentMethod } from "./orders";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useCashLedgerStore } from "@/lib/store/useCashLedgerStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { useRiderIdentityStore } from "@/lib/store/useRiderIdentityStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { useLocationStore } from "@/lib/store/useLocationStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";
import { availableToCashOut, keptFromCash, totalEarned } from "@/lib/delivery/earnings";

const item = { productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 2 }; // GHS 200 of items
const input = (paymentMethod: PaymentMethod, sellerId = "s1") => ({
  sellerId,
  sellerName: "Shop",
  items: [item],
  paymentMethod,
});

describe("who pays for delivery", () => {
  it("GRAPPlive covers it for the paid opt-in; the buyer pays with every no-fee option", () => {
    expect(deliveryFeePayer("instant_confirm")).toBe("grapplive");
    expect(deliveryFeePayer("direct_momo")).toBe("buyer");
    expect(deliveryFeePayer("cash_on_delivery")).toBe("buyer");
    expect(deliveryFeePayer("grapplive_fulfilled")).toBe("buyer");
  });

  it("charges the buyer the full fee, or nothing when GRAPPlive covers it", () => {
    const buyerPays = deliveryFeeFor("direct_momo", "s1", "Accra");
    expect(buyerPays.feeGHS).toBeGreaterThan(0);
    expect(buyerPays.chargedToBuyerGHS).toBe(buyerPays.feeGHS);

    const covered = deliveryFeeFor("instant_confirm", "s1", "Accra");
    expect(covered.feeGHS).toBe(buyerPays.feeGHS); // the trip costs the same
    expect(covered.chargedToBuyerGHS).toBe(0);
  });

  it("is the same every time for the same seller and area (checkout matches the order)", () => {
    expect(deliveryFeeFor("direct_momo", "s1", "Accra")).toEqual(deliveryFeeFor("direct_momo", "s1", "Accra"));
  });
});

describe("delivery fees on orders, deliveries and earnings", () => {
  const store = () => useDeliveryStore.getState();
  const ledger = () => useCashLedgerStore.getState();
  const groupAt = (i: number) => useOrdersStore.getState().orders[0].groups[i];

  beforeEach(() => {
    useOrdersStore.setState({ orders: [], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useCashLedgerStore.setState({ entries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
    useAppStore.setState({ phone: "+233501234567", isVerified: true, roles: [], activeRole: null });
    useLocationStore.setState({ areaName: "Accra" });
  });

  function riderOnline() {
    const id = useRiderIdentityStore
      .getState()
      .getOrCreateRiderId("+233509999999", { name: "Kwesi", vehicle: "motorbike", area: "Accra" });
    useRiderStore.getState().setOnline(id, true);
    return id;
  }

  function deliverFirstOrder(rider: string) {
    requestDeliveryForGroup(groupAt(0).id);
    const d = store().deliveries[0];
    store().acceptOffer(d.id, rider);
    store().advance(d.id, rider);
    store().advance(d.id, rider);
    store().advance(d.id, rider);
    store().completeDelivery(d.id, rider, d.otp);
    return store().deliveries[0];
  }

  it("placeOrder records the fee and what the buyer is charged, per seller", () => {
    useOrdersStore.getState().placeOrder([input("direct_momo", "s1"), input("direct_momo", "s2")]);
    const [a, b] = useOrdersStore.getState().orders[0].groups;
    expect(a.deliveryFeeGHS).toBe(deliveryFeeFor("direct_momo", "s1", "Accra").feeGHS);
    expect(b.deliveryFeeGHS).toBe(deliveryFeeFor("direct_momo", "s2", "Accra").feeGHS);
    expect(a.deliveryFeeChargedGHS).toBe(a.deliveryFeeGHS);
    expect(groupPayable(a)).toBe(groupTotal(a) + a.deliveryFeeGHS!);
  });

  it("with Instant Confirm the buyer is charged no delivery, but the rider is still paid", () => {
    useOrdersStore.getState().placeOrder([input("instant_confirm")]);
    const g = groupAt(0);
    expect(g.deliveryFeeChargedGHS).toBe(0);
    expect(groupPayable(g)).toBe(groupTotal(g));

    const rider = riderOnline();
    const d = deliverFirstOrder(rider);
    expect(d.feeGHS).toBe(g.deliveryFeeGHS); // the rider's pay is the delivery fee
    expect(availableToCashOut(store().deliveries, [], rider)).toBe(g.deliveryFeeGHS);
  });

  it("an order from before delivery fees existed still works (nothing charged)", () => {
    useOrdersStore.getState().placeOrder([input("direct_momo")]);
    const old = { ...groupAt(0), deliveryFeeGHS: undefined, deliveryFeeChargedGHS: undefined };
    expect(groupPayable(old)).toBe(groupTotal(old));
  });

  it("cash on delivery collects items + delivery; the rider keeps the fee and owes only the items", () => {
    useOrdersStore.getState().placeOrder([input("cash_on_delivery")]);
    const g = groupAt(0);
    const rider = riderOnline();
    requestDeliveryForGroup(g.id);

    const offered = store().deliveries[0];
    expect(offered.codAmountGHS).toBe(200 + g.deliveryFeeGHS!);
    expect(offered.feePaidInCash).toBe(true);

    const d = deliverFirstOrder(rider);
    expect(d.status).toBe("delivered");
    expect(ledger().entries[0].amountGHS).toBe(200); // only the items go to the seller
  });

  it("a fee kept from cash is earned but not paid out a second time", () => {
    useOrdersStore.getState().placeOrder([input("cash_on_delivery")]);
    const g = groupAt(0);
    const rider = riderOnline();
    deliverFirstOrder(rider);

    expect(totalEarned(store().deliveries, rider)).toBe(g.deliveryFeeGHS);
    expect(keptFromCash(store().deliveries, rider)).toBe(g.deliveryFeeGHS);
    expect(availableToCashOut(store().deliveries, [], rider)).toBe(0);
  });

  it("a prepaid order (Direct MoMo) collects no cash and pays the rider through earnings", () => {
    useOrdersStore.getState().placeOrder([input("direct_momo")]);
    const g = groupAt(0);
    useOrdersStore.setState({
      orders: [{ ...useOrdersStore.getState().orders[0], groups: [{ ...g, status: "ready_to_pack" }] }],
    });
    const rider = riderOnline();
    const d = deliverFirstOrder(rider);

    expect(d.codAmountGHS).toBe(0);
    expect(d.feePaidInCash).toBeFalsy();
    expect(ledger().entries).toHaveLength(0);
    expect(availableToCashOut(store().deliveries, [], rider)).toBe(g.deliveryFeeGHS);
  });
});
