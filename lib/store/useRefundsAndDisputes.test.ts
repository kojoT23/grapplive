import { describe, it, expect, beforeEach } from "vitest";
import { useRefundsStore, pendingForSeller, refundsForGroup } from "./useRefundsStore";
import { useDisputesStore, disputeForGroup, openForSeller } from "./useDisputesStore";
import { useOrdersStore } from "./useOrdersStore";
import { useDeliveryStore } from "./useDeliveryStore";
import { useAppStore } from "./useAppStore";
import { DISPUTE_WINDOW_DAYS } from "@/lib/mock-data/disputes";
import { groupPayable, type Order, type OrderStatus, type PaymentMethod } from "@/lib/mock-data/orders";
import type { Delivery } from "@/lib/mock-data/deliveries";

const BUYER = "+233501234567";
const G = "o1-g1";
const refunds = () => useRefundsStore.getState();
const disputes = () => useDisputesStore.getState();
const orders = () => useOrdersStore.getState();
const group = () => orders().orders[0].groups[0];
const asStaff = () => useAppStore.setState({ roles: ["grapplive_staff"] });
const asNobody = () => useAppStore.setState({ roles: [] });

function order(payment: PaymentMethod = "direct_momo", status: OrderStatus = "ready_to_pack", sellerId = "s1"): Order {
  return {
    id: "o1",
    buyerPhone: BUYER,
    deliveryArea: "Accra",
    groups: [
      {
        id: G,
        sellerId,
        sellerName: sellerId === "grapplive-official" ? "GrappStore" : "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Dress", priceGHS: 200, quantity: 1 }],
        paymentMethod: payment,
        status,
        deliveryFeeGHS: 15,
        deliveryFeeChargedGHS: payment === "instant_confirm" ? 0 : 15,
        history: [{ status, label: "start", timestamp: "now" }],
      },
    ],
  };
}

function deliveredAgo(ms: number): Delivery {
  return {
    id: "d1", orderGroupId: G, status: "delivered", riderId: "r1", createdAt: Date.now() - ms,
    history: [{ status: "delivered", at: Date.now() - ms, by: "rider" }],
  } as Delivery;
}

describe("cancelling and refunds", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [order()], hasHydrated: true });
    useRefundsStore.setState({ refunds: [], hasHydrated: true });
    useDisputesStore.setState({ disputes: [], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useAppStore.setState({ phone: BUYER, isVerified: true, roles: [], activeRole: null });
  });

  describe("a buyer cancelling", () => {
    it("a paid order refunds the items and the delivery fee they paid, owed by the seller for Direct MoMo", () => {
      expect(orders().cancelByBuyer(G, BUYER)).toBe("ok");
      expect(group().status).toBe("cancelled");

      const r = refunds().refunds[0];
      expect(r.amountGHS).toBe(215); // 200 items + 15 delivery
      expect(r.amountGHS).toBe(groupPayable(group()));
      expect(r.owner).toBe("seller");
      expect(r.status).toBe("pending");
      expect(r.source).toBe("buyer_cancelled");
      expect(r.buyerPhone).toBe(BUYER);
    });

    it("GRAPPlive owes the refund when GRAPPlive took the payment (Instant Confirm, GrappStore)", () => {
      useOrdersStore.setState({ orders: [order("instant_confirm")] });
      orders().cancelByBuyer(G, BUYER);
      expect(refunds().refunds[0].owner).toBe("staff");
      expect(refunds().refunds[0].amountGHS).toBe(200); // delivery was covered by GRAPPlive

      useRefundsStore.setState({ refunds: [] });
      useOrdersStore.setState({ orders: [order("grapplive_fulfilled", "ready_to_pack", "grapplive-official")] });
      orders().cancelByBuyer(G, BUYER);
      expect(refunds().refunds[0].owner).toBe("staff");
    });

    it("cash on delivery owes nothing: no money was taken", () => {
      useOrdersStore.setState({ orders: [order("cash_on_delivery")] });
      expect(orders().cancelByBuyer(G, BUYER)).toBe("ok");
      expect(refunds().refunds).toHaveLength(0);
    });

    it("works from awaiting payment confirmation up to preparing, not after a rider is requested", () => {
      for (const status of ["awaiting_confirmation", "ready_to_pack", "preparing"] as OrderStatus[]) {
        useOrdersStore.setState({ orders: [order("direct_momo", status)] });
        useRefundsStore.setState({ refunds: [] });
        expect(orders().cancelByBuyer(G, BUYER)).toBe("ok");
      }
      for (const status of ["ready_for_pickup", "rider_assigned", "out_for_delivery", "delivered", "cancelled"] as OrderStatus[]) {
        useOrdersStore.setState({ orders: [order("direct_momo", status)] });
        expect(orders().cancelByBuyer(G, BUYER)).toBe("not_cancellable");
      }
    });

    it("only the buyer who placed it can cancel", () => {
      expect(orders().cancelByBuyer(G, "+233500000000")).toBe("not_buyer");
      expect(group().status).toBe("ready_to_pack");
      expect(refunds().refunds).toHaveLength(0);
    });
  });

  describe("a seller cancelling", () => {
    it("cancels with a reason and refunds a paid order", () => {
      expect(orders().cancelBySeller(G, "s1", "Out of stock")).toBe("ok");
      expect(group().status).toBe("cancelled");
      expect(group().history.at(-1)?.label).toBe("Cancelled by the seller — Out of stock");
      expect(refunds().refunds[0]).toMatchObject({ source: "seller_cancelled", amountGHS: 215, owner: "seller" });
      expect(refunds().refunds[0].reason).toContain("Out of stock");
    });

    it("only that order's own seller can, and only before a rider is requested", () => {
      expect(orders().cancelBySeller(G, "someone-else", "x")).toBe("not_seller");
      useOrdersStore.setState({ orders: [order("direct_momo", "ready_for_pickup")] });
      expect(orders().cancelBySeller(G, "s1", "x")).toBe("not_cancellable");
    });

    it("GrappStore orders can only be cancelled by staff", () => {
      useOrdersStore.setState({ orders: [order("grapplive_fulfilled", "ready_to_pack", "grapplive-official")] });
      expect(orders().cancelBySeller(G, "grapplive-official", "Stock error")).toBe("not_seller");
      asStaff();
      expect(orders().cancelBySeller(G, "grapplive-official", "Stock error")).toBe("ok");
      expect(refunds().refunds[0].owner).toBe("staff");
    });

    it("a reason is optional but recorded", () => {
      orders().cancelBySeller(G, "s1", "   ");
      expect(group().history.at(-1)?.label).toBe("Cancelled by the seller — No reason given");
    });
  });

  describe("paying a refund", () => {
    beforeEach(() => {
      orders().cancelByBuyer(G, BUYER);
    });

    it("the seller who owes it marks it sent; nobody else can", () => {
      const id = refunds().refunds[0].id;
      expect(pendingForSeller(refunds().refunds, "s1")).toHaveLength(1);
      expect(refunds().markRefundedBySeller(id, "someone-else")).toBe("forbidden");
      expect(refunds().markRefundedBySeller(id, "s1")).toBe("ok");
      expect(refunds().refunds[0]).toMatchObject({ status: "paid", paidBy: "seller" });
      expect(pendingForSeller(refunds().refunds, "s1")).toHaveLength(0);
      expect(refunds().markRefundedBySeller(id, "s1")).toBe("invalid"); // already paid
    });

    it("a seller can't mark a GRAPPlive-owed refund as sent", () => {
      useRefundsStore.setState({ refunds: [] });
      useOrdersStore.setState({ orders: [order("instant_confirm")] });
      orders().cancelByBuyer(G, BUYER);
      expect(refunds().markRefundedBySeller(refunds().refunds[0].id, "s1")).toBe("forbidden");
    });

    it("support can mark any refund sent, with a note; not anyone else", () => {
      const id = refunds().refunds[0].id;
      asNobody();
      expect(refunds().markRefundedByStaff(id)).toBe("forbidden");
      asStaff();
      expect(refunds().markRefundedByStaff(id, "Confirmed with the seller")).toBe("ok");
      expect(refunds().refunds[0]).toMatchObject({ status: "paid", paidBy: "staff", note: "Confirmed with the seller" });
    });

    it("one refund per cancelled order, and never for nothing", () => {
      const r = refunds().refunds[0];
      expect(refunds().createRefund({
        orderGroupId: r.orderGroupId, buyerPhone: BUYER, sellerId: "s1", sellerName: "x",
        paymentMethod: "direct_momo", amountGHS: 50, source: "buyer_cancelled", reason: "again",
      })).toBeNull();
      expect(refunds().createRefund({
        orderGroupId: "other", buyerPhone: BUYER, sellerId: "s1", sellerName: "x",
        paymentMethod: "direct_momo", amountGHS: 0, source: "buyer_cancelled", reason: "zero",
      })).toBeNull();
      expect(refundsForGroup(refunds().refunds, G)).toHaveLength(1);
    });
  });
});

describe("buyer disputes", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [order("direct_momo", "delivered")], hasHydrated: true });
    useRefundsStore.setState({ refunds: [], hasHydrated: true });
    useDisputesStore.setState({ disputes: [], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [deliveredAgo(60 * 60 * 1000)], hasHydrated: true });
    useAppStore.setState({ phone: BUYER, isVerified: true, roles: [], activeRole: null });
  });

  const open = (reason: "damaged" | "never_arrived" = "damaged", details = "Cracked") =>
    disputes().openDispute({ orderGroupId: G, buyerPhone: BUYER, reason, details });

  describe("reporting a problem", () => {
    it("opens a dispute against the order's seller", () => {
      expect(open("damaged", "  Cracked screen  ")).toBe("ok");
      expect(disputes().disputes[0]).toMatchObject({
        orderGroupId: G, sellerId: "s1", reason: "damaged", details: "Cracked screen", status: "open",
      });
      expect(disputeForGroup(disputes().disputes, G)?.id).toBe("dp1");
      expect(openForSeller(disputes().disputes, "s1")).toHaveLength(1);
      expect(openForSeller(disputes().disputes, "s2")).toHaveLength(0);
    });

    it("only for a delivered order, only by its buyer, and once", () => {
      expect(disputes().openDispute({ orderGroupId: G, buyerPhone: "+233500000000", reason: "damaged" })).toBe("not_buyer");
      expect(open()).toBe("ok");
      expect(open()).toBe("already_open");

      useDisputesStore.setState({ disputes: [] });
      useOrdersStore.setState({ orders: [order("direct_momo", "preparing")] });
      expect(open()).toBe("not_delivered");
      expect(disputes().openDispute({ orderGroupId: "nope", buyerPhone: BUYER, reason: "damaged" })).toBe("invalid");
    });

    it("only within the window after the rider delivered it", () => {
      useDeliveryStore.setState({ deliveries: [deliveredAgo((DISPUTE_WINDOW_DAYS * 24 + 1) * 60 * 60 * 1000)] });
      expect(open()).toBe("window_closed");
      useDeliveryStore.setState({ deliveries: [deliveredAgo((DISPUTE_WINDOW_DAYS * 24 - 1) * 60 * 60 * 1000)] });
      expect(open()).toBe("ok");
    });
  });

  describe("the seller's side", () => {
    it("the seller can respond once; nobody else can", () => {
      open();
      const id = disputes().disputes[0].id;
      expect(disputes().respondToDispute(id, "someone-else", "It was fine")).toBe("forbidden");
      expect(disputes().respondToDispute(id, "s1", "  ")).toBe("invalid");
      expect(disputes().respondToDispute(id, "s1", "It left here intact")).toBe("ok");
      expect(disputes().disputes[0].sellerResponse?.text).toBe("It left here intact");
      expect(disputes().respondToDispute(id, "s1", "again")).toBe("invalid");
    });
  });

  describe("support deciding", () => {
    it("refunds the buyer in full by default, creating a refund owed per the payment method", () => {
      open();
      asStaff();
      expect(disputes().staffResolve("dp1", "refunded", { note: "Photos show damage" })).toBe("ok");

      const d = disputes().disputes[0];
      expect(d.status).toBe("refunded");
      expect(d.resolution).toMatchObject({ outcome: "refunded", amountGHS: 215, note: "Photos show damage" });
      const r = refunds().refunds[0];
      expect(r).toMatchObject({ amountGHS: 215, source: "dispute", disputeId: "dp1", owner: "seller", status: "pending" });
      expect(d.resolution?.refundId).toBe(r.id);
    });

    it("can refund less than the full amount, but never more", () => {
      open();
      asStaff();
      expect(disputes().staffResolve("dp1", "refunded", { amountGHS: 216 })).toBe("invalid");
      expect(disputes().staffResolve("dp1", "refunded", { amountGHS: 0 })).toBe("invalid");
      expect(disputes().staffResolve("dp1", "refunded", { amountGHS: 100 })).toBe("ok");
      expect(refunds().refunds[0].amountGHS).toBe(100);
    });

    it("can reject it, with no refund", () => {
      open();
      asStaff();
      expect(disputes().staffResolve("dp1", "rejected", { note: "Delivered with the customer's code" })).toBe("ok");
      expect(disputes().disputes[0]).toMatchObject({ status: "rejected" });
      expect(refunds().refunds).toHaveLength(0);
    });

    it("is for staff only, and only once", () => {
      open();
      asNobody();
      expect(disputes().staffResolve("dp1", "refunded")).toBe("forbidden");
      asStaff();
      expect(disputes().staffResolve("dp1", "rejected")).toBe("ok");
      expect(disputes().staffResolve("dp1", "refunded")).toBe("invalid");
      expect(disputes().respondToDispute("dp1", "s1", "late")).toBe("invalid");
    });
  });
});
