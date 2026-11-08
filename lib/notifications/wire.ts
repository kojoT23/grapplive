import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useCashLedgerStore, heldTotal } from "@/lib/store/useCashLedgerStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { useRiderIdentityStore } from "@/lib/store/useRiderIdentityStore";
import { notifyBuyer, notifyRider, notifySeller, notifyStaff } from "@/lib/store/useNotificationsStore";
import { failureReasonLabels, type Delivery, type DeliveryHistoryEntry, type DeliveryStatus } from "@/lib/mock-data/deliveries";
import { slotLabel } from "@/lib/mock-data/deliverySlots";
import { paymentMethodLabel, type Order, type OrderStatus } from "@/lib/mock-data/orders";
import { CASH_HOLD_LIMIT_GHS, type CashEntry } from "@/lib/mock-data/cash";

// Who gets told what, in one place. Rather than sprinkling notify() calls
// through every action, this WATCHES the order, delivery, cash and rider stores
// and, whenever something changes, tells the people it concerns:
//   - a new delivery request    -> riders in the pickup area
//   - a rider accepts / sets off / arrives / delivers -> buyer and seller (and rider)
//   - a failed attempt, return, cancellation, reassignment -> everyone affected
//   - cash collected / handed over / disputed / resolved -> rider, seller, staff
//   - a suspension -> the rider
// It only reacts to changes made AFTER the stores have loaded from storage, so
// opening the app never replays old history as new notifications.
// (SMS / push / WhatsApp would hang off the same events once there's a backend.)

const ghs = (n: number) => `GHS ${n.toLocaleString("en-GH")}`;
const half = (fee: number) => Math.round(fee * 50) / 100;
const orderHref = (groupId: string) => `/account/orders/${groupId}`;

// ---- deliveries ----

function ridersInArea(area: string, onlineOnly: boolean) {
  const status = useRiderStore.getState();
  return Object.values(useRiderIdentityStore.getState().identitiesByPhone).filter(
    (r) => r.area === area && !status.isSuspended(r.id) && (!onlineOnly || status.isOnline(r.id))
  );
}

function announceToRiders(d: Delivery, titleOverride?: string) {
  const scheduled = d.slot !== undefined;
  // A same-day request is only worth interrupting riders who are online; a
  // scheduled job can be claimed by anyone, so everyone in the area hears.
  // Not riders who already declined it or were just taken off it.
  for (const rider of ridersInArea(d.pickupArea, !scheduled).filter((r) => !d.declinedBy.includes(r.id))) {
    notifyRider(rider.id, {
      kind: "delivery",
      title: titleOverride ?? (scheduled ? "New scheduled job to claim" : "New delivery request"),
      body: `${d.sellerName} → ${d.dropoffArea} · you earn ${ghs(d.feeGHS)}${d.slot ? ` · ${slotLabel(d.slot)}` : ""}`,
      href: "/rider",
    });
  }
}

function onDeliveryChange(d: Delivery, was: Delivery, entry: DeliveryHistoryEntry, from: DeliveryStatus | null) {
  const buyer = (title: string, body: string) =>
    notifyBuyer(d.customerPhone || undefined, { kind: "delivery", title, body, href: orderHref(d.orderGroupId) });
  const seller = (title: string, body: string) => notifySeller(d.sellerId, { kind: "delivery", title, body });
  const rider = (id: string | null | undefined, title: string, body: string, href?: string) =>
    notifyRider(id, { kind: "delivery", title, body, ...(href ? { href } : {}) });
  const name = d.riderName ?? was.riderName ?? "Your rider";
  const reason = d.failureReason ? failureReasonLabels[d.failureReason] : "";
  const note = entry.note ? ` (${entry.note})` : "";

  switch (entry.status) {
    case "offered":
      if (entry.by === "staff") {
        if (was.status === "offered") {
          announceToRiders(d, "Delivery request (sent again by support)");
        } else {
          rider(was.riderId, "Delivery reassigned", `GRAPPlive support took this delivery off you${note}.`);
          buyer("Finding you another rider", "GRAPPlive support is finding another rider for your order.");
          seller("Finding another rider", `GRAPPlive support is finding another rider${note}.`);
          announceToRiders(d);
        }
      } else if (entry.by === "rider") {
        seller("Rider handed the job back", `${name} can't make it. We're finding another rider.`);
        buyer("Finding you another rider", `${name} can't make it, so we're finding another rider.`);
        announceToRiders(d);
      }
      break;
    case "scheduled":
      buyer("A rider is booked", `${name} will deliver on ${d.slot ? slotLabel(d.slot) : "your delivery day"}.`);
      seller("A rider is booked", `${name} will collect it for ${d.slot ? slotLabel(d.slot) : "its delivery day"}.`);
      break;
    case "heading_to_pickup":
      if (from === "scheduled") {
        buyer("Your rider is on the way", `${name} is heading to the seller for today's delivery.`);
        seller("Rider on the way", `${name} is heading to you to collect today's delivery.`);
      } else {
        buyer("Rider assigned", `${name} accepted your delivery and is heading to the seller.`);
        seller("Rider accepted", `${name} is on the way to collect the order.`);
      }
      break;
    case "at_pickup":
      seller("Your rider has arrived", `${name} is at your shop to collect the order.`);
      break;
    case "out_for_delivery":
      buyer("Your order is on its way", `${name} has your order and is heading to you.`);
      break;
    case "at_dropoff":
      buyer("Your rider has arrived", "Have your delivery code ready to give them.");
      break;
    case "delivered":
      buyer("Delivered", "Your order has been delivered. How was it? You can rate your rider.");
      seller("Order delivered", "The customer has received the order.");
      rider(
        d.riderId,
        "Delivery complete",
        d.feePaidInCash
          ? `You earned ${ghs(d.feeGHS)} — keep it from the cash you collected.`
          : `You earned ${ghs(d.feeGHS)}.`,
        "/rider/earnings"
      );
      break;
    case "returning":
      buyer("Delivery attempt failed", `${reason}. Your rider is taking the order back to the seller.`);
      seller("Delivery attempt failed", `${reason}. ${name} is bringing the parcel back.`);
      break;
    case "failed":
      buyer("Delivery attempt failed", `${reason || "The rider couldn't collect the order"}. The seller will arrange next steps.`);
      seller("Rider couldn't collect the order", `${reason || "Pickup failed"}. You can request a rider again.`);
      rider(d.riderId, "Half fee paid", `You earned ${ghs(half(d.feeGHS))} for this trip.`, "/rider/earnings");
      break;
    case "returned":
      if (entry.by !== "staff") {
        seller("Parcel returned", `${name} says the parcel is back with you. Please confirm you have it.`);
      }
      break;
    case "cancelled":
      if (entry.by === "staff") {
        rider(was.riderId, "Delivery cancelled", `GRAPPlive support cancelled this delivery${note}.`);
        buyer("Delivery cancelled", `GRAPPlive support cancelled the delivery request${note}. The seller will arrange it again.`);
        seller("Delivery cancelled by support", `GRAPPlive support cancelled the delivery${note}.`);
      } else {
        rider(was.riderId, "Delivery cancelled", "The seller cancelled this delivery.");
        buyer("Delivery cancelled", "The seller cancelled the delivery request and will arrange it again.");
      }
      break;
  }
}

function onDeliveries(next: { deliveries: Delivery[]; hasHydrated: boolean }, prev: { deliveries: Delivery[]; hasHydrated: boolean }) {
  if (!prev.hasHydrated || !next.hasHydrated || next.deliveries === prev.deliveries) return;
  const before = new Map(prev.deliveries.map((d) => [d.id, d]));

  for (const d of next.deliveries) {
    const was = before.get(d.id);
    if (!was) {
      announceToRiders(d);
      continue;
    }
    for (let i = was.history.length; i < d.history.length; i++) {
      onDeliveryChange(d, was, d.history[i], d.history[i - 1]?.status ?? null);
    }
    if (was.returnConfirmedAt === undefined && d.returnConfirmedAt !== undefined) {
      notifyRider(d.riderId, {
        kind: "delivery",
        title: "Parcel confirmed back",
        body: `You earned ${ghs(half(d.feeGHS))} for this trip.`,
        href: "/rider/earnings",
      });
      if (d.history[d.history.length - 1]?.by === "staff") {
        notifySeller(d.sellerId, {
          kind: "delivery",
          title: "Support confirmed the parcel is back",
          body: "GRAPPlive support confirmed the returned parcel on your behalf.",
        });
      }
    }
    if (!was.rating && d.rating) {
      notifyRider(d.riderId, {
        kind: "account",
        title: `New rating: ${d.rating.stars} star${d.rating.stars > 1 ? "s" : ""}`,
        body: d.rating.comment ? `"${d.rating.comment}"` : "A customer rated your delivery.",
        href: "/rider",
      });
    }
  }
}

// ---- orders ----

const summarize = (items: { itemName: string; quantity: number }[]) =>
  items.map((i) => `${i.itemName} × ${i.quantity}`).join(", ");

function onOrderPlaced(order: Order) {
  for (const g of order.groups) {
    notifySeller(g.sellerId, {
      kind: "order",
      title: "New order",
      body: `${summarize(g.items)} · ${paymentMethodLabel(g.paymentMethod)}${
        g.paymentMethod === "direct_momo" ? " — confirm the payment when you see it" : ""
      }`,
    });
  }
  notifyBuyer(order.buyerPhone, {
    kind: "order",
    title: "Order placed",
    body: `${order.groups.length} order${order.groups.length > 1 ? "s" : ""} sent to ${order.groups
      .map((g) => g.sellerName)
      .join(", ")}.`,
    href: "/account/orders",
  });
}

function onOrderStatusChange(order: Order, groupId: string, sellerId: string, from: OrderStatus, to: OrderStatus) {
  if (from === "awaiting_confirmation" && (to === "ready_to_pack" || to === "preparing")) {
    notifyBuyer(order.buyerPhone, {
      kind: "order",
      title: "Payment confirmed",
      body: "The seller confirmed your payment and is getting your order ready.",
      href: orderHref(groupId),
    });
  }
  if (to === "cancelled") {
    notifySeller(sellerId, {
      kind: "order",
      title: "Order cancelled",
      body: "The buyer cancelled their cash-on-delivery order. There's nothing to pack.",
    });
  }
  // Older orders with no delivery record are marked delivered by the seller.
  if (to === "delivered" && !useDeliveryStore.getState().deliveries.some((d) => d.orderGroupId === groupId)) {
    notifyBuyer(order.buyerPhone, {
      kind: "order",
      title: "Delivered",
      body: "Your order has been marked as delivered.",
      href: orderHref(groupId),
    });
  }
}

function onOrders(next: { orders: Order[]; hasHydrated: boolean }, prev: { orders: Order[]; hasHydrated: boolean }) {
  if (!prev.hasHydrated || !next.hasHydrated || next.orders === prev.orders) return;
  const before = new Map(prev.orders.map((o) => [o.id, o]));
  for (const order of next.orders) {
    const was = before.get(order.id);
    if (!was) {
      onOrderPlaced(order);
      continue;
    }
    for (const g of order.groups) {
      const wasGroup = was.groups.find((x) => x.id === g.id);
      if (wasGroup && wasGroup.status !== g.status) onOrderStatusChange(order, g.id, g.sellerId, wasGroup.status, g.status);
    }
  }
}

// ---- cash ----

function onCashChange(e: CashEntry, was: CashEntry | undefined) {
  const amount = ghs(e.amountGHS);
  const rider = (title: string, body: string) =>
    notifyRider(e.riderId, { kind: "cash", title, body, href: "/rider/earnings" });
  const seller = (title: string, body: string) => notifySeller(e.sellerId, { kind: "cash", title, body });

  if (!was) {
    rider("Cash to hand over", `You collected ${amount} for ${e.sellerName}. Hand it over and mark it on the Earnings tab.`);
    return;
  }
  if (was.status === e.status) return;

  if (e.status === "handover_pending") {
    seller("Cash handed over", `${e.riderName} says they handed you ${amount}. Please confirm you received it.`);
  } else if (e.status === "settled") {
    rider("Cash settled", `${e.sellerName} confirmed the ${amount}. You're all clear.${e.staffNote ? ` (${e.staffNote})` : ""}`);
    if (was.status === "disputed") seller("Cash dispute closed", `Support settled the ${amount} from ${e.riderName} as received.`);
  } else if (e.status === "disputed") {
    rider("Cash disputed", `${e.sellerName} says they didn't receive ${amount}. Hand it over again or contact support.`);
    notifyStaff({ kind: "cash", title: "Cash dispute opened", body: `${e.riderName} → ${e.sellerName}, ${amount}.` });
  } else if (e.status === "rider_liable") {
    rider("You're responsible for this cash", `Support found you responsible for ${amount} (${e.sellerName}). Contact support to repay.`);
    seller("Cash dispute resolved", `Support held ${e.riderName} responsible for the ${amount}.`);
  }
}

function onCash(next: { entries: CashEntry[]; hasHydrated: boolean }, prev: { entries: CashEntry[]; hasHydrated: boolean }) {
  if (!prev.hasHydrated || !next.hasHydrated || next.entries === prev.entries) return;
  const before = new Map(prev.entries.map((e) => [e.id, e]));
  for (const e of next.entries) {
    const was = before.get(e.id);
    onCashChange(e, was);
    if (!was) {
      // Crossing the cash limit stops the rider taking new jobs — tell them why.
      const after = heldTotal(next.entries, e.riderId);
      if (after >= CASH_HOLD_LIMIT_GHS && after - e.amountGHS < CASH_HOLD_LIMIT_GHS) {
        notifyRider(e.riderId, {
          kind: "cash",
          title: "Cash limit reached",
          body: `You're holding ${ghs(after)}. Hand some over before you take new jobs.`,
          href: "/rider/earnings",
        });
      }
    }
  }
}

// ---- riders ----

function onRiders(
  next: { suspendedByRider: Record<string, boolean>; hasHydrated: boolean },
  prev: { suspendedByRider: Record<string, boolean>; hasHydrated: boolean }
) {
  if (!prev.hasHydrated || !next.hasHydrated || next.suspendedByRider === prev.suspendedByRider) return;
  for (const [id, suspended] of Object.entries(next.suspendedByRider)) {
    if ((prev.suspendedByRider[id] ?? false) === suspended) continue;
    notifyRider(id, {
      kind: "account",
      title: suspended ? "Your account was suspended" : "Your account is active again",
      body: suspended
        ? "You can't go online or take new jobs. Contact GRAPPlive support."
        : "You can go online and take jobs again.",
    });
  }
}

// Starts watching. Returns a function that stops. The app calls this once, at
// startup (components/notifications/NotificationWiring.tsx).
export function startNotificationWiring(): () => void {
  const stops = [
    useDeliveryStore.subscribe(onDeliveries),
    useOrdersStore.subscribe(onOrders),
    useCashLedgerStore.subscribe(onCash),
    useRiderStore.subscribe(onRiders),
  ];
  return () => stops.forEach((stop) => stop());
}
