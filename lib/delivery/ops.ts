import type { Delivery, DeliveryActor, DeliveryStatus } from "@/lib/mock-data/deliveries";
import type { CashEntry } from "@/lib/mock-data/cash";
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/mock-data/deliveries";
import { toDateKey } from "@/lib/mock-data/deliverySlots";

// What GRAPPlive support sees: which deliveries and cash trails are stuck,
// what happened on a delivery and who did it (AGENTS.md §33 — every important
// event has a timestamp, actor, event, previous and new state). All pure, so
// the same rules drive the screens and the tests.

// How long before something counts as stuck. Plain numbers to tune later.
export const ATTENTION = {
  offerWaitMinutes: 10, // a same-day request nobody has accepted
  pickupStallMinutes: 60, // a rider has accepted but hasn't got to / collected from the seller
  returnStallMinutes: 120, // a rider still hasn't brought a failed parcel back
  returnConfirmHours: 24, // the seller hasn't confirmed a returned parcel
  handoverConfirmHours: 48, // the seller hasn't answered a cash handover
};

const MIN = 60_000;
const HOUR = 60 * MIN;

function lastEventAt(d: Delivery): number {
  return d.history[d.history.length - 1]?.at ?? d.createdAt;
}

function minutesSince(at: number, nowMs: number): number {
  return Math.floor((nowMs - at) / MIN);
}

// Reasons a delivery needs support's attention, as short sentences. Empty when
// it's fine. Needs a real clock time.
export function deliveryAttention(d: Delivery, nowMs: number): string[] {
  if (nowMs <= 0) return [];
  const reasons: string[] = [];
  const today = toDateKey(nowMs);

  if (d.status === "offered" && !d.slot) {
    const waited = minutesSince(d.createdAt, nowMs);
    if (waited >= ATTENTION.offerWaitMinutes) reasons.push(`No rider has accepted for ${waited} min`);
  }
  if (d.status === "offered" && d.slot && d.slot.date <= today) {
    reasons.push(
      d.slot.date === today
        ? "Delivery day is today and no rider has claimed it"
        : "Delivery day has passed and no rider claimed it"
    );
  }
  if (d.status === "scheduled" && d.slot && d.slot.date < today) {
    reasons.push("Delivery day has passed and the stop was never started");
  }
  if (d.status === "heading_to_pickup" || d.status === "at_pickup") {
    const stalled = minutesSince(lastEventAt(d), nowMs);
    if (stalled >= ATTENTION.pickupStallMinutes) reasons.push(`Rider hasn't moved on in ${stalled} min`);
  }
  if (d.status === "returning") {
    const stalled = minutesSince(lastEventAt(d), nowMs);
    if (stalled >= ATTENTION.returnStallMinutes) reasons.push(`Parcel still not returned after ${stalled} min`);
  }
  if (d.status === "returned" && d.returnConfirmedAt === undefined) {
    const waited = nowMs - lastEventAt(d);
    if (waited >= ATTENTION.returnConfirmHours * HOUR) {
      reasons.push(`Seller hasn't confirmed the returned parcel in ${Math.floor(waited / HOUR)} h`);
    }
  }
  return reasons;
}

// Reasons a cash entry needs support's attention.
export function cashAttention(e: CashEntry, nowMs: number): string[] {
  if (nowMs <= 0) return [];
  const reasons: string[] = [];
  if (e.status === "disputed") reasons.push("Seller says the cash never arrived");
  if (e.status === "rider_liable") reasons.push(`Rider owes GHS ${e.amountGHS.toLocaleString("en-GH")} until repaid`);
  if (e.status === "handover_pending" && e.handedOverAt !== undefined) {
    const waited = nowMs - e.handedOverAt;
    if (waited >= ATTENTION.handoverConfirmHours * HOUR) {
      reasons.push(`Seller hasn't answered the handover in ${Math.floor(waited / HOUR)} h`);
    }
  }
  return reasons;
}

// Staff-facing status names (the buyer-facing ones live in deliveryStatusLabels).
export const opsStatusLabels: Record<DeliveryStatus, string> = {
  offered: "Open",
  scheduled: "Claimed (scheduled)",
  heading_to_pickup: "Heading to seller",
  at_pickup: "At seller",
  out_for_delivery: "Out for delivery",
  at_dropoff: "At customer",
  delivered: "Delivered",
  failed: "Failed at pickup",
  returning: "Returning parcel",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const actorLabels: Record<DeliveryActor | "unknown", string> = {
  buyer: "Buyer",
  seller: "Seller",
  rider: "Rider",
  staff: "Support",
  system: "System",
  unknown: "Unrecorded",
};

export type TimelineEvent = {
  at: number;
  from: DeliveryStatus | null; // the previous state; null for the first event
  to: DeliveryStatus;
  by: DeliveryActor | "unknown";
  note?: string;
};

// A delivery's history as a timeline: when, who, from what state to what.
export function deliveryTimeline(d: Delivery): TimelineEvent[] {
  return d.history.map((h, i) => ({
    at: h.at,
    from: i === 0 ? null : d.history[i - 1].status,
    to: h.status,
    by: h.by ?? "unknown",
    ...(h.note ? { note: h.note } : {}),
  }));
}

export type OpsSummary = {
  needAttention: number; // deliveries + cash entries that need support
  openRequests: number; // same-day requests waiting for a rider
  inProgress: number; // deliveries a rider is working right now
  scheduled: number; // booked for a future day (claimed or not)
  cashDisputes: number;
  cashOwedByRidersGHS: number; // held against riders by support
};

export function opsSummary(deliveries: Delivery[], entries: CashEntry[], nowMs: number): OpsSummary {
  return {
    needAttention:
      deliveries.filter((d) => deliveryAttention(d, nowMs).length > 0).length +
      entries.filter((e) => cashAttention(e, nowMs).length > 0).length,
    openRequests: deliveries.filter((d) => d.status === "offered" && !d.slot).length,
    inProgress: deliveries.filter((d) => ACTIVE_DELIVERY_STATUSES.includes(d.status)).length,
    scheduled: deliveries.filter((d) => d.slot !== undefined && (d.status === "offered" || d.status === "scheduled")).length,
    cashDisputes: entries.filter((e) => e.status === "disputed").length,
    cashOwedByRidersGHS: entries
      .filter((e) => e.status === "rider_liable")
      .reduce((sum, e) => sum + e.amountGHS, 0),
  };
}
