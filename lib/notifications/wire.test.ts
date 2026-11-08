import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { startNotificationWiring } from "./wire";
import {
  useNotificationsStore,
  notificationsFor,
  unreadCount,
  notifyBuyer,
  notifySeller,
} from "@/lib/store/useNotificationsStore";
import {
  MAX_PER_RECIPIENT,
  STAFF_RECIPIENT,
  buyerRecipient,
  riderRecipient,
  sellerRecipient,
} from "@/lib/mock-data/notifications";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { useRiderIdentityStore } from "@/lib/store/useRiderIdentityStore";
import { useCashLedgerStore } from "@/lib/store/useCashLedgerStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { useLocationStore } from "@/lib/store/useLocationStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";
import { CASH_HOLD_LIMIT_GHS } from "@/lib/mock-data/cash";
import type { Order, PaymentMethod } from "@/lib/mock-data/orders";
import type { DeliverySlot } from "@/lib/mock-data/deliverySlots";

const BUYER = "+233501234567";
const G = "o1-g1";
const SLOT: DeliverySlot = { date: "2026-11-11", window: "morning" };
const store = () => useDeliveryStore.getState();
const inbox = (recipient: string) => notificationsFor(useNotificationsStore.getState().items, recipient);
const titles = (recipient: string) => inbox(recipient).map((n) => n.title);

function order(payment: PaymentMethod = "direct_momo", slot?: DeliverySlot): Order {
  return {
    id: "o1",
    buyerPhone: BUYER,
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

function makeRider(phone = "+233501111111", name = "Kwesi", opts: { area?: string; online?: boolean } = {}) {
  const id = useRiderIdentityStore
    .getState()
    .getOrCreateRiderId(phone, { name, vehicle: "motorbike", area: opts.area ?? "Accra" });
  useRiderStore.getState().setOnline(id, opts.online ?? true);
  return id;
}

describe("notifications", () => {
  let stop: () => void = () => {};

  beforeEach(() => {
    useNotificationsStore.setState({ items: [], hasHydrated: true });
    useOrdersStore.setState({ orders: [order()], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useCashLedgerStore.setState({ entries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, cashOutsByRider: {}, suspendedByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
    useAppStore.setState({ phone: "+233509999999", isVerified: true, roles: [], activeRole: null });
    useLocationStore.setState({ areaName: "Accra" });
    stop = startNotificationWiring();
  });

  afterEach(() => stop());

  describe("the inbox", () => {
    it("keeps each person's notifications separate, newest first", () => {
      const n = useNotificationsStore.getState();
      n.notify("rider:r1", { kind: "delivery", title: "first", body: "" });
      n.notify("rider:r2", { kind: "delivery", title: "other person", body: "" });
      n.notify("rider:r1", { kind: "delivery", title: "second", body: "" });
      expect(titles("rider:r1")).toEqual(["second", "first"]);
      expect(titles("rider:r2")).toEqual(["other person"]);
    });

    it("only the recipient can mark theirs read", () => {
      useNotificationsStore.getState().notify("rider:r1", { kind: "delivery", title: "a", body: "" });
      const id = inbox("rider:r1")[0].id;
      useNotificationsStore.getState().markRead(id, "rider:someone-else");
      expect(unreadCount(useNotificationsStore.getState().items, "rider:r1")).toBe(1);
      useNotificationsStore.getState().markRead(id, "rider:r1");
      expect(unreadCount(useNotificationsStore.getState().items, "rider:r1")).toBe(0);
    });

    it("can mark everything read at once, for one person only", () => {
      const n = useNotificationsStore.getState();
      n.notify("rider:r1", { kind: "delivery", title: "a", body: "" });
      n.notify("rider:r1", { kind: "delivery", title: "b", body: "" });
      n.notify("rider:r2", { kind: "delivery", title: "c", body: "" });
      n.markAllRead("rider:r1");
      expect(unreadCount(useNotificationsStore.getState().items, "rider:r1")).toBe(0);
      expect(unreadCount(useNotificationsStore.getState().items, "rider:r2")).toBe(1);
    });

    it("keeps only the newest notifications per person", () => {
      const n = useNotificationsStore.getState();
      for (let i = 0; i < MAX_PER_RECIPIENT + 5; i++) {
        n.notify("rider:r1", { kind: "delivery", title: `n${i}`, body: "" });
      }
      n.notify("rider:r2", { kind: "delivery", title: "other", body: "" });
      expect(inbox("rider:r1")).toHaveLength(MAX_PER_RECIPIENT);
      expect(titles("rider:r2")).toEqual(["other"]);
    });

    it("sends GrappStore's to staff, a seller's to that seller, and ignores a missing phone", () => {
      notifySeller("grapplive-official", { kind: "order", title: "gs", body: "" });
      notifySeller("s1", { kind: "order", title: "s1", body: "" });
      notifyBuyer(undefined, { kind: "order", title: "nobody", body: "", href: "/x" });
      expect(titles(STAFF_RECIPIENT)).toEqual(["gs"]);
      expect(inbox(STAFF_RECIPIENT)[0].href).toBe("/grappstore/fulfillment");
      expect(titles(sellerRecipient("s1"))).toEqual(["s1"]);
      expect(useNotificationsStore.getState().items).toHaveLength(2);
    });
  });

  describe("orders", () => {
    it("tells the seller about a new order and the buyer it was placed", () => {
      useOrdersStore.setState({ orders: [] });
      useOrdersStore.getState().placeOrder([
        {
          sellerId: "s1",
          sellerName: "Ama's",
          items: [{ productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 2 }],
          paymentMethod: "direct_momo",
        },
      ]);
      useAppStore.setState({ phone: BUYER });
      expect(titles(sellerRecipient("s1"))).toEqual(["New order"]);
      expect(inbox(sellerRecipient("s1"))[0].body).toContain("Dress × 2");
      expect(inbox(sellerRecipient("s1"))[0].body).toMatch(/confirm the payment/);
    });

    it("tells the buyer when the seller confirms their payment", () => {
      useOrdersStore.setState({
        orders: [{ ...order(), groups: [{ ...order().groups[0], status: "awaiting_confirmation" }] }],
      });
      useOrdersStore.getState().confirmPayment(G);
      expect(titles(buyerRecipient(BUYER))).toEqual(["Payment confirmed"]);
      expect(inbox(buyerRecipient(BUYER))[0].href).toBe(`/account/orders/${G}`);
    });

    it("tells the seller when a buyer cancels", () => {
      useOrdersStore.setState({ orders: [order("cash_on_delivery")] });
      useOrdersStore.getState().cancelByBuyer(G, BUYER);
      expect(titles(sellerRecipient("s1"))).toEqual(["Order cancelled"]);
    });
  });

  describe("a delivery from request to done", () => {
    it("tells each person what they need at each step", () => {
      const rider = makeRider();
      requestDeliveryForGroup(G);
      expect(titles(riderRecipient(rider))).toEqual(["New delivery request"]);

      const d = store().deliveries[0];
      store().acceptOffer(d.id, rider);
      expect(titles(buyerRecipient(BUYER))).toEqual(["Rider assigned"]);
      expect(titles(sellerRecipient("s1"))).toEqual(["Rider accepted"]);

      store().advance(d.id, rider); // at pickup
      expect(titles(sellerRecipient("s1"))[0]).toBe("Your rider has arrived");
      store().advance(d.id, rider); // picked up
      expect(titles(buyerRecipient(BUYER))[0]).toBe("Your order is on its way");
      store().advance(d.id, rider); // at the door
      expect(titles(buyerRecipient(BUYER))[0]).toBe("Your rider has arrived");

      store().completeDelivery(d.id, rider, d.otp);
      expect(titles(buyerRecipient(BUYER))[0]).toBe("Delivered");
      expect(titles(sellerRecipient("s1"))[0]).toBe("Order delivered");
      expect(titles(riderRecipient(rider))[0]).toBe("Delivery complete");
      expect(inbox(riderRecipient(rider))[0].body).toContain("GHS 15");
    });

    it("a same-day request only interrupts online, active riders in the pickup area", () => {
      const online = makeRider("+233501111111", "A");
      const offline = makeRider("+233502222222", "B", { online: false });
      const elsewhere = makeRider("+233503333333", "C", { area: "Kumasi" });
      const suspended = makeRider("+233504444444", "D");
      useRiderStore.setState({ suspendedByRider: { [suspended]: true } });

      requestDeliveryForGroup(G);
      expect(titles(riderRecipient(online))).toEqual(["New delivery request"]);
      expect(inbox(riderRecipient(offline))).toHaveLength(0);
      expect(inbox(riderRecipient(elsewhere))).toHaveLength(0);
      // (the suspension itself is a notification; they just aren't offered the job)
      expect(titles(riderRecipient(suspended))).not.toContain("New delivery request");
    });

    it("a scheduled job tells every rider in the area, online or not", () => {
      useOrdersStore.setState({ orders: [order("direct_momo", SLOT)] });
      const offline = makeRider("+233502222222", "B", { online: false });
      requestDeliveryForGroup(G);
      expect(titles(riderRecipient(offline))).toEqual(["New scheduled job to claim"]);
      expect(inbox(riderRecipient(offline))[0].body).toMatch(/Morning/);
    });

    it("booking and starting a scheduled stop tell the buyer and seller", () => {
      useOrdersStore.setState({ orders: [order("direct_momo", SLOT)] });
      const rider = makeRider("+233501111111", "Kwesi", { online: false });
      requestDeliveryForGroup(G);
      const d = store().deliveries[0];
      store().claimScheduled(d.id, rider);
      expect(titles(buyerRecipient(BUYER))).toEqual(["A rider is booked"]);

      store().startScheduledStop(d.id, rider, new Date(2026, 10, 11, 9, 0).getTime());
      expect(titles(buyerRecipient(BUYER))[0]).toBe("Your rider is on the way");
      expect(titles(sellerRecipient("s1"))[0]).toBe("Rider on the way");
    });

    it("failures, returns and cancellations reach everyone affected", () => {
      const rider = makeRider();
      requestDeliveryForGroup(G);
      const d = store().deliveries[0];
      store().acceptOffer(d.id, rider);
      for (let i = 0; i < 3; i++) store().advance(d.id, rider);

      store().reportFailure(d.id, rider, "customer_unavailable");
      expect(titles(buyerRecipient(BUYER))[0]).toBe("Delivery attempt failed");
      expect(inbox(buyerRecipient(BUYER))[0].body).toMatch(/not available/i);
      expect(titles(sellerRecipient("s1"))[0]).toBe("Delivery attempt failed");

      store().confirmReturn(d.id, rider);
      expect(titles(sellerRecipient("s1"))[0]).toBe("Parcel returned");

      store().confirmParcelReceived(d.id, "s1");
      expect(titles(riderRecipient(rider))[0]).toBe("Parcel confirmed back");
      expect(inbox(riderRecipient(rider))[0].body).toContain("GHS 7.5");
    });

    it("a seller cancelling tells the assigned rider and the buyer", () => {
      const rider = makeRider();
      requestDeliveryForGroup(G);
      const d = store().deliveries[0];
      store().acceptOffer(d.id, rider);
      store().cancelDelivery(d.id, "s1");
      expect(titles(riderRecipient(rider))[0]).toBe("Delivery cancelled");
      expect(titles(buyerRecipient(BUYER))[0]).toBe("Delivery cancelled");
    });

    it("a rider handing a job back tells the seller and buyer, and re-announces it", () => {
      const rider = makeRider("+233501111111", "Kwesi");
      const other = makeRider("+233502222222", "Yaw");
      requestDeliveryForGroup(G);
      const d = store().deliveries[0];
      store().acceptOffer(d.id, rider);
      store().releaseJob(d.id, rider);

      expect(titles(sellerRecipient("s1"))[0]).toBe("Rider handed the job back");
      expect(titles(buyerRecipient(BUYER))[0]).toBe("Finding you another rider");
      expect(titles(riderRecipient(other))).toContain("New delivery request");
    });

    it("a rating tells the rider", () => {
      const rider = makeRider();
      requestDeliveryForGroup(G);
      const d = store().deliveries[0];
      store().acceptOffer(d.id, rider);
      for (let i = 0; i < 3; i++) store().advance(d.id, rider);
      store().completeDelivery(d.id, rider, d.otp);
      store().rateDelivery(d.id, BUYER, 5, "Great");
      expect(titles(riderRecipient(rider))[0]).toBe("New rating: 5 stars");
    });
  });

  describe("support actions", () => {
    it("tell the rider taken off a job, and the buyer and seller", () => {
      const rider = makeRider();
      requestDeliveryForGroup(G);
      const d = store().deliveries[0];
      store().acceptOffer(d.id, rider);
      useAppStore.setState({ roles: ["grapplive_staff"] });
      store().staffReassign(d.id, "Phone off");

      expect(titles(riderRecipient(rider))[0]).toBe("Delivery reassigned");
      expect(inbox(riderRecipient(rider))[0].body).toContain("Phone off");
      expect(titles(buyerRecipient(BUYER))[0]).toBe("Finding you another rider");
    });

    it("suspending and reinstating a rider tells them", () => {
      const rider = makeRider();
      useAppStore.setState({ roles: ["grapplive_staff"] });
      useRiderStore.getState().staffSetSuspended(rider, true);
      useRiderStore.getState().staffSetSuspended(rider, false);
      expect(titles(riderRecipient(rider))).toEqual(["Your account is active again", "Your account was suspended"]);
    });
  });

  describe("cash", () => {
    function collect(amount: number) {
      useOrdersStore.setState({ orders: [order("cash_on_delivery")] });
      const rider = makeRider();
      useCashLedgerStore.getState().recordCollection({
        deliveryId: "dx", orderGroupId: G, riderId: rider, riderName: "Kwesi",
        sellerId: "s1", sellerName: "Ama's", amountGHS: amount,
      });
      return { rider, entry: useCashLedgerStore.getState().entries[0] };
    }

    it("walks rider and seller through the handover", () => {
      const { rider, entry } = collect(250);
      expect(titles(riderRecipient(rider))).toEqual(["Cash to hand over"]);

      useCashLedgerStore.getState().handOver(entry.id, rider);
      expect(titles(sellerRecipient("s1"))).toEqual(["Cash handed over"]);

      useCashLedgerStore.getState().confirmReceived(entry.id, "s1");
      expect(titles(riderRecipient(rider))[0]).toBe("Cash settled");
    });

    it("a dispute tells the rider and staff; support's decision tells rider and seller", () => {
      const { rider, entry } = collect(250);
      useCashLedgerStore.getState().handOver(entry.id, rider);
      useCashLedgerStore.getState().disputeReceived(entry.id, "s1");
      expect(titles(riderRecipient(rider))[0]).toBe("Cash disputed");
      expect(titles(STAFF_RECIPIENT)).toEqual(["Cash dispute opened"]);

      useAppStore.setState({ roles: ["grapplive_staff"] });
      useCashLedgerStore.getState().staffResolveDispute(entry.id, "rider_liable");
      expect(titles(riderRecipient(rider))[0]).toBe("You're responsible for this cash");
      expect(titles(sellerRecipient("s1"))[0]).toBe("Cash dispute resolved");
    });

    it("warns a rider when they reach the cash limit", () => {
      const { rider } = collect(CASH_HOLD_LIMIT_GHS);
      expect(titles(riderRecipient(rider))).toContain("Cash limit reached");
    });
  });

  describe("not replaying history", () => {
    it("loading stores from storage doesn't create notifications", () => {
      stop();
      // Simulate the app opening: stores start un-hydrated, then load saved data.
      useDeliveryStore.setState({ deliveries: [], hasHydrated: false });
      useOrdersStore.setState({ orders: [], hasHydrated: false });
      stop = startNotificationWiring();

      useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
      useOrdersStore.setState({ orders: [order()], hasHydrated: true });
      expect(useNotificationsStore.getState().items).toHaveLength(0);
    });
  });
});
