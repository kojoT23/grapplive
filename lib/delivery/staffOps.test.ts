import { describe, it, expect, beforeEach } from "vitest";
import {
  ATTENTION,
  cashAttention,
  deliveryAttention,
  deliveryTimeline,
  opsSummary,
} from "./ops";
import {
  useDeliveryStore,
  activeDeliveryFor,
  openOffersFor,
  openScheduledFor,
} from "@/lib/store/useDeliveryStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { useRiderIdentityStore } from "@/lib/store/useRiderIdentityStore";
import { useCashLedgerStore, heldTotal } from "@/lib/store/useCashLedgerStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { requestDeliveryForGroup } from "./dispatch";
import { CASH_HOLD_LIMIT_GHS, type CashEntry } from "@/lib/mock-data/cash";
import type { Delivery } from "@/lib/mock-data/deliveries";
import type { DeliverySlot } from "@/lib/mock-data/deliverySlots";
import type { Order, PaymentMethod } from "@/lib/mock-data/orders";

const MIN = 60_000;
const HOUR = 60 * MIN;
const NOW = new Date(2026, 10, 10, 12, 0).getTime();
const G = "o1-g1";
const store = () => useDeliveryStore.getState();
const ledger = () => useCashLedgerStore.getState();
const group = () => useOrdersStore.getState().orders[0].groups[0];

function order(slot?: DeliverySlot, payment: PaymentMethod = "direct_momo"): Order {
  return {
    id: "o1",
    buyerPhone: "+233501234567",
    deliveryArea: "Accra",
    groups: [
      {
        id: G,
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Dress", priceGHS: 250, quantity: 1 }],
        paymentMethod: payment,
        status: "ready_to_pack",
        deliveryFeeGHS: 15,
        deliveryFeeChargedGHS: 15,
        deliverySlot: slot,
        history: [{ status: "ready_to_pack", label: "Order confirmed", timestamp: "now" }],
      },
    ],
  };
}

function rider(phone = "+233501111111", name = "Kwesi", online = true) {
  const id = useRiderIdentityStore
    .getState()
    .getOrCreateRiderId(phone, { name, vehicle: "motorbike", area: "Accra" });
  useRiderStore.getState().setOnline(id, online);
  return id;
}

const asStaff = () => useAppStore.setState({ roles: ["grapplive_staff"] });
const asNobody = () => useAppStore.setState({ roles: [] });

// A bare delivery for the pure rules, with only the fields they read.
const fake = (over: Partial<Delivery>): Delivery =>
  ({ id: "d1", createdAt: NOW, history: [], status: "offered", ...over }) as Delivery;

describe("what counts as stuck (the attention rules)", () => {
  it("flags a same-day request nobody accepted, after the wait", () => {
    const young = fake({ createdAt: NOW - (ATTENTION.offerWaitMinutes - 1) * MIN });
    const old = fake({ createdAt: NOW - ATTENTION.offerWaitMinutes * MIN });
    expect(deliveryAttention(young, NOW)).toEqual([]);
    expect(deliveryAttention(old, NOW)[0]).toMatch(/No rider has accepted/);
  });

  it("flags a scheduled job nobody claimed once its day arrives, and one never started", () => {
    const tomorrow = { date: "2026-11-11", window: "morning" as const };
    const today = { date: "2026-11-10", window: "morning" as const };
    const yesterday = { date: "2026-11-09", window: "morning" as const };
    expect(deliveryAttention(fake({ slot: tomorrow }), NOW)).toEqual([]);
    expect(deliveryAttention(fake({ slot: today }), NOW)[0]).toMatch(/today and no rider/);
    expect(deliveryAttention(fake({ slot: yesterday }), NOW)[0]).toMatch(/has passed/);
    expect(deliveryAttention(fake({ status: "scheduled", slot: yesterday }), NOW)[0]).toMatch(/never started/);
    expect(deliveryAttention(fake({ status: "scheduled", slot: today }), NOW)).toEqual([]);
  });

  it("flags a rider who stalls on the way to or at the seller", () => {
    const stalled = fake({
      status: "heading_to_pickup",
      history: [{ status: "heading_to_pickup", at: NOW - ATTENTION.pickupStallMinutes * MIN }],
    });
    const fine = fake({ status: "heading_to_pickup", history: [{ status: "heading_to_pickup", at: NOW - 5 * MIN }] });
    expect(deliveryAttention(stalled, NOW)[0]).toMatch(/hasn't moved on/);
    expect(deliveryAttention(fine, NOW)).toEqual([]);
  });

  it("flags a parcel not brought back, and a returned parcel the seller hasn't confirmed", () => {
    const returning = fake({
      status: "returning",
      history: [{ status: "returning", at: NOW - ATTENTION.returnStallMinutes * MIN }],
    });
    const returned = fake({
      status: "returned",
      history: [{ status: "returned", at: NOW - ATTENTION.returnConfirmHours * HOUR }],
    });
    expect(deliveryAttention(returning, NOW)[0]).toMatch(/not returned/);
    expect(deliveryAttention(returned, NOW)[0]).toMatch(/hasn't confirmed/);
    expect(deliveryAttention({ ...returned, returnConfirmedAt: NOW }, NOW)).toEqual([]);
  });

  it("says nothing without a real clock time", () => {
    expect(deliveryAttention(fake({ createdAt: 1 }), 0)).toEqual([]);
  });

  it("flags disputed cash, cash held against a rider, and a handover left unanswered", () => {
    const entry = (over: Partial<CashEntry>) =>
      ({ id: "c1", amountGHS: 100, status: "held", collectedAt: NOW, ...over }) as CashEntry;
    expect(cashAttention(entry({}), NOW)).toEqual([]);
    expect(cashAttention(entry({ status: "disputed" }), NOW)[0]).toMatch(/never arrived/);
    expect(cashAttention(entry({ status: "rider_liable" }), NOW)[0]).toMatch(/owes GHS 100/);
    expect(
      cashAttention(entry({ status: "handover_pending", handedOverAt: NOW - ATTENTION.handoverConfirmHours * HOUR }), NOW)[0]
    ).toMatch(/hasn't answered/);
    expect(cashAttention(entry({ status: "handover_pending", handedOverAt: NOW - HOUR }), NOW)).toEqual([]);
  });
});

describe("staff operations", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [order()], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useCashLedgerStore.setState({ entries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, suspendedByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
    useAppStore.setState({ phone: "+233509999999", isVerified: true, roles: [], activeRole: null });
  });

  describe("the delivery timeline (who did what)", () => {
    it("records the actor and the previous state for each event", () => {
      const r = rider();
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      store().acceptOffer(id, r);
      store().advance(id, r);
      asStaff();
      store().staffReassign(id, "Rider stopped answering");

      const t = deliveryTimeline(store().deliveries[0]);
      expect(t.map((e) => e.by)).toEqual(["seller", "rider", "rider", "staff"]);
      expect(t.map((e) => e.to)).toEqual(["offered", "heading_to_pickup", "at_pickup", "offered"]);
      expect(t[0].from).toBeNull();
      expect(t[2].from).toBe("heading_to_pickup");
      expect(t[3].note).toBe("Rider stopped answering");
    });
  });

  describe("support stepping in on a delivery", () => {
    it("refuses anyone who isn't staff", () => {
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      asNobody();
      expect(store().staffReassign(id)).toBe("forbidden");
      expect(store().staffCancel(id)).toBe("forbidden");
      expect(store().deliveries[0].status).toBe("offered");
    });

    it("sends an open request out again to every rider", () => {
      const a = rider();
      const b = rider("+233502222222", "Yaw");
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      store().declineOffer(id, a);
      store().declineOffer(id, b);
      asStaff();

      expect(store().staffReassign(id)).toBe("ok");
      expect(openOffersFor(store().deliveries, a, "Accra")).toHaveLength(1);
      expect(openOffersFor(store().deliveries, b, "Accra")).toHaveLength(1);
    });

    it("takes a delivery off a rider and puts it back out to others, not to them", () => {
      const stuck = rider();
      const other = rider("+233502222222", "Yaw");
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      store().acceptOffer(id, stuck);
      asStaff();

      expect(store().staffReassign(id, "Phone off")).toBe("ok");
      expect(store().deliveries[0].status).toBe("offered");
      expect(store().deliveries[0].riderId).toBeNull();
      expect(activeDeliveryFor(store().deliveries, stuck)).toBeUndefined();
      expect(group().status).toBe("ready_for_pickup");
      expect(group().riderName).toBeUndefined();
      expect(openOffersFor(store().deliveries, stuck, "Accra")).toHaveLength(0);
      expect(store().acceptOffer(id, other)).toBe("ok");
    });

    it("reassigns a scheduled job back into the scheduled pool", () => {
      useOrdersStore.setState({ orders: [order({ date: "2026-11-11", window: "morning" })] });
      const r = rider();
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      store().claimScheduled(id, r);
      asStaff();

      expect(store().staffReassign(id)).toBe("ok");
      expect(openScheduledFor(store().deliveries, r, "Accra")).toHaveLength(0);
      expect(openScheduledFor(store().deliveries, rider("+233502222222", "Yaw"), "Accra")).toHaveLength(1);
    });

    it("can't touch a delivery once the parcel is picked up", () => {
      const r = rider();
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      store().acceptOffer(id, r);
      store().advance(id, r);
      store().advance(id, r); // picked up
      asStaff();
      expect(store().staffReassign(id)).toBe("invalid");
      expect(store().staffCancel(id)).toBe("invalid");
    });

    it("cancels a delivery, freeing the rider and restoring the order for a new request", () => {
      const r = rider();
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      store().acceptOffer(id, r);
      asStaff();

      expect(store().staffCancel(id, "Seller closed")).toBe("ok");
      expect(store().deliveries[0].status).toBe("cancelled");
      expect(activeDeliveryFor(store().deliveries, r)).toBeUndefined();
      expect(group().status).toBe("ready_to_pack");
      expect(deliveryTimeline(store().deliveries[0]).at(-1)).toMatchObject({ by: "staff", note: "Seller closed" });
    });

    it("confirms a returned parcel on the seller's behalf, unblocking a new request", () => {
      const r = rider();
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      store().acceptOffer(id, r);
      for (let i = 0; i < 3; i++) store().advance(id, r);
      store().reportFailure(id, r, "customer_unavailable");
      store().confirmReturn(id, r);

      requestDeliveryForGroup(G);
      expect(store().deliveries).toHaveLength(1); // blocked until confirmed

      asNobody();
      expect(store().staffConfirmParcelReceived(id)).toBe("forbidden");
      asStaff();
      expect(store().staffConfirmParcelReceived(id)).toBe("ok");
      expect(store().deliveries[0].returnConfirmedAt).toBeDefined();
      expect(store().staffConfirmParcelReceived(id)).toBe("invalid"); // already confirmed

      requestDeliveryForGroup(G);
      expect(store().deliveries).toHaveLength(2);
    });
  });

  describe("resolving a cash dispute", () => {
    function disputedCash(amount = 250) {
      useOrdersStore.setState({ orders: [order(undefined, "cash_on_delivery")] });
      const r = rider();
      requestDeliveryForGroup(G);
      const d = store().deliveries[0];
      store().acceptOffer(d.id, r);
      for (let i = 0; i < 3; i++) store().advance(d.id, r);
      store().completeDelivery(d.id, r, d.otp);
      const entry = ledger().entries[0];
      ledger().handOver(entry.id, r);
      ledger().disputeReceived(entry.id, "s1");
      void amount;
      return { r, entry: ledger().entries[0] };
    }

    it("settles it when support finds the cash was in fact received", () => {
      const { r, entry } = disputedCash();
      asStaff();
      expect(ledger().staffResolveDispute(entry.id, "settled", "Seller confirmed on the phone")).toBe("ok");
      expect(ledger().entries[0].status).toBe("settled");
      expect(ledger().entries[0].staffNote).toBe("Seller confirmed on the phone");
      expect(heldTotal(ledger().entries, r)).toBe(0);
    });

    it("holds the rider responsible: they still owe it, and can't hand it over themselves", () => {
      const { r, entry } = disputedCash();
      asStaff();
      expect(ledger().staffResolveDispute(entry.id, "rider_liable")).toBe("ok");
      expect(ledger().entries[0].status).toBe("rider_liable");
      expect(heldTotal(ledger().entries, r)).toBe(entry.amountGHS);
      expect(ledger().handOver(entry.id, r)).toBe("invalid");
    });

    it("records the repayment, closing the trail", () => {
      const { r, entry } = disputedCash();
      asStaff();
      ledger().staffResolveDispute(entry.id, "rider_liable");
      expect(ledger().staffMarkRepaid(entry.id, "Paid in cash at the office")).toBe("ok");
      expect(ledger().entries[0].status).toBe("settled");
      expect(heldTotal(ledger().entries, r)).toBe(0);
    });

    it("is for staff only, and only for the right states", () => {
      const { entry } = disputedCash();
      asNobody();
      expect(ledger().staffResolveDispute(entry.id, "settled")).toBe("forbidden");
      expect(ledger().staffMarkRepaid(entry.id)).toBe("forbidden");
      asStaff();
      expect(ledger().staffMarkRepaid(entry.id)).toBe("invalid"); // not rider_liable
      ledger().staffResolveDispute(entry.id, "settled");
      expect(ledger().staffResolveDispute(entry.id, "rider_liable")).toBe("invalid"); // no longer disputed
    });

    it("cash held against a rider counts toward the cash limit", () => {
      const r = rider();
      ledger().recordCollection({
        deliveryId: "dx", orderGroupId: "ox-g1", riderId: r, riderName: "Kwesi",
        sellerId: "s1", sellerName: "Ama's", amountGHS: CASH_HOLD_LIMIT_GHS,
      });
      const id = ledger().entries[0].id;
      ledger().handOver(id, r);
      ledger().disputeReceived(id, "s1");
      asStaff();
      ledger().staffResolveDispute(id, "rider_liable");

      requestDeliveryForGroup(G);
      expect(store().acceptOffer(store().deliveries[0].id, r)).toBe("cash_limit");
    });
  });

  describe("suspending a rider", () => {
    it("takes them offline and stops them going online, accepting or claiming", () => {
      const r = rider();
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      asStaff();

      expect(useRiderStore.getState().staffSetSuspended(r, true)).toBe("ok");
      expect(useRiderStore.getState().isOnline(r)).toBe(false);

      useRiderStore.getState().setOnline(r, true);
      expect(useRiderStore.getState().isOnline(r)).toBe(false);
      expect(store().acceptOffer(id, r)).toBe("suspended");
      expect(store().claimScheduled(id, r)).toBe("suspended");
    });

    it("can be reversed", () => {
      const r = rider();
      asStaff();
      useRiderStore.getState().staffSetSuspended(r, true);
      expect(useRiderStore.getState().staffSetSuspended(r, false)).toBe("ok");
      useRiderStore.getState().setOnline(r, true);
      expect(useRiderStore.getState().isOnline(r)).toBe(true);
    });

    it("is for staff only", () => {
      const r = rider();
      asNobody();
      expect(useRiderStore.getState().staffSetSuspended(r, true)).toBe("forbidden");
      expect(useRiderStore.getState().isSuspended(r)).toBe(false);
    });

    it("doesn't take away a delivery already in progress", () => {
      const r = rider();
      requestDeliveryForGroup(G);
      const id = store().deliveries[0].id;
      store().acceptOffer(id, r);
      asStaff();
      useRiderStore.getState().staffSetSuspended(r, true);
      expect(activeDeliveryFor(store().deliveries, r)?.id).toBe(id);
      expect(store().advance(id, r)).toBe("ok");
    });
  });

  describe("the overview numbers", () => {
    it("counts what's open, in progress, scheduled and in dispute", () => {
      const disputed = { id: "c1", status: "disputed", amountGHS: 50, collectedAt: NOW } as CashEntry;
      const liable = { id: "c2", status: "rider_liable", amountGHS: 120, collectedAt: NOW } as CashEntry;
      const deliveries = [
        fake({ id: "a", status: "offered", createdAt: NOW - 30 * MIN }),
        fake({ id: "b", status: "heading_to_pickup", history: [{ status: "heading_to_pickup", at: NOW }] }),
        fake({ id: "c", status: "scheduled", slot: { date: "2026-11-12", window: "morning" } }),
      ];
      const s = opsSummary(deliveries, [disputed, liable], NOW);
      expect(s.openRequests).toBe(1);
      expect(s.inProgress).toBe(1);
      expect(s.scheduled).toBe(1);
      expect(s.cashDisputes).toBe(1);
      expect(s.cashOwedByRidersGHS).toBe(120);
      expect(s.needAttention).toBe(3); // stale request + disputed + rider liable
    });
  });
});
