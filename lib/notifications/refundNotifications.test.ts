import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { startNotificationWiring } from "./wire";
import { notificationsFor, useNotificationsStore } from "@/lib/store/useNotificationsStore";
import { STAFF_RECIPIENT, buyerRecipient, sellerRecipient } from "@/lib/mock-data/notifications";
import { useRefundsStore } from "@/lib/store/useRefundsStore";
import { useDisputesStore } from "@/lib/store/useDisputesStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { ATTENTION, disputeAttention, refundAttention } from "@/lib/delivery/ops";
import type { Dispute } from "@/lib/mock-data/disputes";
import type { Refund } from "@/lib/mock-data/refunds";
import type { Order, OrderStatus, PaymentMethod } from "@/lib/mock-data/orders";

const BUYER = "+233501234567";
const G = "o1-g1";
const HOUR = 60 * 60 * 1000;
const NOW = new Date(2026, 10, 10, 12, 0).getTime();
const inbox = (r: string) => notificationsFor(useNotificationsStore.getState().items, r);
const titles = (r: string) => inbox(r).map((n) => n.title);
const asStaff = () => useAppStore.setState({ roles: ["grapplive_staff"] });

function order(payment: PaymentMethod = "direct_momo", status: OrderStatus = "ready_to_pack"): Order {
  return {
    id: "o1",
    buyerPhone: BUYER,
    deliveryArea: "Accra",
    groups: [
      {
        id: G,
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
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

describe("refund and dispute notifications", () => {
  let stop: () => void = () => {};

  beforeEach(() => {
    useNotificationsStore.setState({ items: [], hasHydrated: true });
    useOrdersStore.setState({ orders: [order()], hasHydrated: true });
    useRefundsStore.setState({ refunds: [], hasHydrated: true });
    useDisputesStore.setState({ disputes: [], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useAppStore.setState({ phone: BUYER, isVerified: true, roles: [], activeRole: null });
    stop = startNotificationWiring();
  });

  afterEach(() => stop());

  it("a buyer cancelling a paid order tells the seller, who owes the refund (Direct MoMo)", () => {
    useOrdersStore.getState().cancelByBuyer(G, BUYER);
    expect(titles(sellerRecipient("s1"))).toEqual(expect.arrayContaining(["Order cancelled", "Refund to send"]));
    expect(titles(buyerRecipient(BUYER))).toEqual(["Refund on the way"]);
    expect(inbox(buyerRecipient(BUYER))[0].body).toContain("GHS 215");
    expect(inbox(buyerRecipient(BUYER))[0].body).toContain("Ama's Fashion House");
  });

  it("goes to staff when GRAPPlive owes the refund", () => {
    useOrdersStore.setState({ orders: [order("instant_confirm")] });
    useOrdersStore.getState().cancelByBuyer(G, BUYER);
    expect(titles(STAFF_RECIPIENT)).toContain("Refund to process");
    expect(titles(sellerRecipient("s1"))).not.toContain("Refund to send");
    expect(inbox(buyerRecipient(BUYER))[0].body).toContain("GRAPPlive");
  });

  it("a seller cancelling tells the buyer, with the reason and that they'll be refunded", () => {
    useOrdersStore.getState().cancelBySeller(G, "s1", "Out of stock");
    const buyer = inbox(buyerRecipient(BUYER));
    expect(buyer.map((n) => n.title)).toEqual(expect.arrayContaining(["Order cancelled by the seller", "Refund on the way"]));
    const cancelled = buyer.find((n) => n.title === "Order cancelled by the seller")!;
    expect(cancelled.body).toContain("Out of stock");
    expect(cancelled.body).toContain("refunded");
    expect(titles(sellerRecipient("s1"))).not.toContain("Order cancelled");
  });

  it("a cash on delivery cancel says nothing was charged and creates no refund notices", () => {
    useOrdersStore.setState({ orders: [order("cash_on_delivery")] });
    useOrdersStore.getState().cancelBySeller(G, "s1", "Out of stock");
    expect(inbox(buyerRecipient(BUYER))[0].body).toContain("Nothing was charged");
    expect(titles(buyerRecipient(BUYER))).not.toContain("Refund on the way");
  });

  it("marking a refund sent tells the buyer", () => {
    useOrdersStore.getState().cancelByBuyer(G, BUYER);
    useRefundsStore.getState().markRefundedBySeller(useRefundsStore.getState().refunds[0].id, "s1");
    expect(titles(buyerRecipient(BUYER))[0]).toBe("Refund sent");
  });

  describe("disputes", () => {
    beforeEach(() => {
      useOrdersStore.setState({ orders: [order("direct_momo", "delivered")] });
      useDisputesStore.getState().openDispute({ orderGroupId: G, buyerPhone: BUYER, reason: "damaged", details: "Cracked" });
    });

    it("opening one tells the seller and staff", () => {
      expect(titles(sellerRecipient("s1"))).toEqual(["A buyer reported a problem"]);
      expect(inbox(sellerRecipient("s1"))[0].body).toContain("Damaged");
      expect(titles(STAFF_RECIPIENT)).toEqual(["New dispute"]);
    });

    it("the seller's response tells staff", () => {
      useDisputesStore.getState().respondToDispute("dp1", "s1", "It was fine when it left");
      expect(titles(STAFF_RECIPIENT)[0]).toBe("Seller responded to a dispute");
    });

    it("a refund decision tells the buyer and seller and creates the refund notices", () => {
      asStaff();
      useDisputesStore.getState().staffResolve("dp1", "refunded", { note: "Photos show damage" });
      expect(titles(buyerRecipient(BUYER))).toEqual(expect.arrayContaining(["Your report was upheld", "Refund on the way"]));
      expect(titles(sellerRecipient("s1"))).toEqual(expect.arrayContaining(["Dispute resolved: refund", "Refund to send"]));
    });

    it("a rejection tells the buyer and seller, with no refund", () => {
      asStaff();
      useDisputesStore.getState().staffResolve("dp1", "rejected", { note: "Delivered with the code" });
      // (the setup moving the order to "delivered" also told the buyer it was delivered)
      expect(titles(buyerRecipient(BUYER))).toContain("Your report was reviewed");
      expect(titles(buyerRecipient(BUYER))).not.toContain("Refund on the way");
      expect(inbox(buyerRecipient(BUYER))[0].body).toContain("Delivered with the code");
      expect(titles(sellerRecipient("s1"))).toContain("Dispute resolved: no refund");
    });
  });
});

describe("what needs support's attention", () => {
  const refund = (over: Partial<Refund>): Refund =>
    ({ id: "rf1", sellerName: "Ama's", amountGHS: 100, owner: "staff", status: "pending", createdAt: NOW, ...over }) as Refund;
  const dispute = (over: Partial<Dispute>): Dispute =>
    ({ id: "dp1", reason: "damaged", status: "open", createdAt: NOW, ...over }) as Dispute;

  it("a refund GRAPPlive owes always needs support; a seller's only once it's late", () => {
    expect(refundAttention(refund({}), NOW)[0]).toMatch(/GRAPPlive owes the buyer a refund of GHS 100/);
    expect(refundAttention(refund({ owner: "seller" }), NOW)).toEqual([]);
    expect(
      refundAttention(refund({ owner: "seller", createdAt: NOW - ATTENTION.sellerRefundHours * HOUR }), NOW)[0]
    ).toMatch(/hasn't sent/);
  });

  it("a paid refund needs nothing, and nothing is said without a real clock", () => {
    expect(refundAttention(refund({ status: "paid" }), NOW)).toEqual([]);
    expect(refundAttention(refund({}), 0)).toEqual([]);
  });

  it("an open dispute needs a decision, flagged louder once it's been a day", () => {
    expect(disputeAttention(dispute({}), NOW)).toEqual(["Buyer reported: Damaged"]);
    expect(disputeAttention(dispute({ createdAt: NOW - ATTENTION.disputeOpenHours * HOUR }), NOW)).toHaveLength(2);
    expect(disputeAttention(dispute({ status: "rejected" }), NOW)).toEqual([]);
  });
});
