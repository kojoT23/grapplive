// The delivery record (AGENTS.md §10): one per delivery attempt for an
// order group, separate from the order itself. The ORDER only carries the
// coarse buyer/seller-facing status (ready_for_pickup -> rider_assigned ->
// out_for_delivery -> delivered); the finer rider steps (heading to pickup,
// arrived, ...) live here.

import type { DeliveryPin } from "@/lib/mock-data/deliveryDetails";
import type { DeliverySlot } from "@/lib/mock-data/deliverySlots";

export type DeliveryStatus =
  | "offered" // created, waiting for a rider to accept (or, if it has a slot, to claim)
  | "scheduled" // a rider claimed it for its delivery day; not started yet
  | "heading_to_pickup" // accepted; rider is going to the seller
  | "at_pickup" // rider has arrived at the seller
  | "out_for_delivery" // parcel picked up; rider is going to the customer
  | "at_dropoff" // rider has arrived at the customer; awaiting OTP
  | "delivered"
  | "failed" // never got the parcel (seller problem at pickup); see failureReason
  | "returning" // customer-side failure: the rider still has the parcel and is taking it back
  | "returned" // the rider says the parcel is back with the seller (seller confirms)
  | "cancelled"; // called off by the seller before the parcel was picked up

export const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  "heading_to_pickup",
  "at_pickup",
  "out_for_delivery",
  "at_dropoff",
  "returning",
];

// The seller can call off a delivery up to the moment the parcel is picked up.
export const CANCELLABLE_BY_SELLER: DeliveryStatus[] = [
  "offered",
  "scheduled",
  "heading_to_pickup",
  "at_pickup",
];

// A rider can hand a job back until they have the parcel.
export const RELEASABLE_BY_RIDER: DeliveryStatus[] = ["scheduled", "heading_to_pickup", "at_pickup"];

// Failures that happen at the customer's door leave the rider holding the
// parcel, so they must bring it back; a seller problem at pickup doesn't.
export function mustReturnParcel(reason: FailureReason): boolean {
  return reason !== "seller_unavailable";
}

export type FailureReason =
  | "seller_unavailable"
  | "customer_unavailable"
  | "wrong_address"
  | "customer_refused";

export const failureReasonLabels: Record<FailureReason, string> = {
  seller_unavailable: "Seller not available",
  customer_unavailable: "Customer not available",
  wrong_address: "Wrong address",
  customer_refused: "Customer refused the order",
};

// Which failures a rider can report from where: a seller problem can only
// happen at pickup, customer problems only once the rider has the parcel.
export function failureReasonsFor(status: DeliveryStatus): FailureReason[] {
  if (status === "at_pickup") return ["seller_unavailable"];
  if (status === "out_for_delivery" || status === "at_dropoff") {
    return ["customer_unavailable", "wrong_address", "customer_refused"];
  }
  return [];
}

// The only rider-driven step changes. at_dropoff -> delivered is NOT here:
// delivery can only be completed by entering the customer's OTP.
// Statuses never change arbitrarily from the client (AGENTS.md §9).
export const NEXT_STEP: Partial<
  Record<DeliveryStatus, { to: DeliveryStatus; buttonLabel: string }>
> = {
  heading_to_pickup: { to: "at_pickup", buttonLabel: "I've arrived at pickup" },
  at_pickup: { to: "out_for_delivery", buttonLabel: "Picked up — start delivery" },
  out_for_delivery: { to: "at_dropoff", buttonLabel: "I've arrived at the customer" },
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  offered: "Waiting for a rider",
  scheduled: "A rider is booked for your delivery day",
  heading_to_pickup: "Rider is heading to the seller",
  at_pickup: "Rider is at the seller",
  out_for_delivery: "On the way to you",
  at_dropoff: "Rider has arrived",
  delivered: "Delivered",
  failed: "Delivery failed",
  returning: "Rider is returning your order to the seller",
  returned: "Order returned to the seller",
  cancelled: "Delivery cancelled",
};

// What a rider is paid when a delivery fails through no fault of their own:
// half the delivery fee, because they still made the trip. This applies when
// the customer causes it (not there, wrong address, refused) AND the parcel is
// back with the seller and confirmed, or when the seller causes it at pickup
// (never got the parcel). Nothing is paid when the seller cancels, or the rider
// hands the job back. (The cost of a failed trip — the customer's or the
// seller's — isn't charged to anyone yet: that needs real payments.)
export const FAILED_DELIVERY_FEE_SHARE = 0.5;

// How long a rider has to accept an offer once it's shown to them.
export const OFFER_SECONDS = 30;
// Wrong OTP attempts allowed before the code is locked.
export const OTP_MAX_ATTEMPTS = 5;

export type DeliveryHistoryEntry = { status: DeliveryStatus; at: number };

// A buyer's rating of the rider, left once after the delivery is done.
export type DeliveryRating = {
  stars: number; // 1–5
  comment?: string;
  at: number;
};

export type Delivery = {
  id: string;
  orderGroupId: string;
  sellerId: string;
  sellerName: string;
  pickupArea: string;
  dropoffArea: string;
  customerPhone: string; // "" when the order never captured one
  // Who to deliver to and how to find them, copied from the order at the
  // time of the request. Optional: older deliveries predate checkout
  // collecting them.
  customerName?: string;
  digitalAddress?: string;
  landmark?: string;
  pin?: DeliveryPin; // the buyer's shared location, if they shared one
  // Set for scheduled delivery: the day and window the buyer picked. A delivery
  // with a slot is claimed by a rider ahead of time (no 30-second offer) and
  // started on the day.
  slot?: DeliverySlot;
  pickupKm: number;
  dropoffKm: number;
  feeGHS: number;
  etaMinutes: number;
  // Cash the rider must collect from the customer; 0 when already paid.
  // The cash-handover ledger that tracks this is ROADMAP.md §11 step 3.
  codAmountGHS: number;
  // True when the buyer pays the delivery fee in cash on delivery: the rider
  // keeps their fee out of the cash they collect, so it is already paid and
  // must not be paid out again from earnings.
  feePaidInCash?: boolean;
  status: DeliveryStatus;
  riderId: string | null;
  riderName: string | null;
  otp: string;
  otpAttempts: number;
  declinedBy: string[]; // rider ids who declined or let the offer expire
  offerSeenAt: Record<string, number>; // rider id -> when the offer was first shown
  failureReason?: FailureReason;
  returnConfirmedAt?: number; // the seller confirmed the returned parcel arrived
  rating?: DeliveryRating;
  createdAt: number;
  history: DeliveryHistoryEntry[];
};

// MOCK trip estimate, deterministic from a seed so the same order always
// gets the same numbers. A real backend replaces this with routing
// distance/time and a real fee schedule.
export function estimateTrip(seed: string): {
  pickupKm: number;
  dropoffKm: number;
  feeGHS: number;
  etaMinutes: number;
} {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  const pickupKm = Math.round((0.5 + (hash % 30) / 10) * 10) / 10; // 0.5 – 3.4
  const dropoffKm = Math.round((1.5 + ((hash >> 3) % 80) / 10) * 10) / 10; // 1.5 – 9.4
  const feeGHS = 8 + Math.round(dropoffKm * 1.5);
  const etaMinutes = 10 + Math.round((pickupKm + dropoffKm) * 3);
  return { pickupKm, dropoffKm, feeGHS, etaMinutes };
}

// When the buyer can expect the rider, as a point in time: when the rider
// accepted plus the estimated trip time. It is an ESTIMATE counted down on
// the buyer's screen, not live tracking (that needs the backend).
export function etaTarget(d: Delivery): number | null {
  // The latest one: a job handed back and taken again, or a scheduled job
  // started on its day, counts from when this rider set off.
  const acceptedAt = [...d.history].reverse().find((h) => h.status === "heading_to_pickup")?.at;
  return acceptedAt === undefined ? null : acceptedAt + d.etaMinutes * 60_000;
}

// Whole minutes left until the ETA (0 once it has passed). null when there's
// no ETA yet or `nowMs` isn't a real time (the server-side placeholder).
export function minutesLeft(d: Delivery, nowMs: number): number | null {
  const target = etaTarget(d);
  if (target === null || nowMs <= 0) return null;
  return Math.max(0, Math.ceil((target - nowMs) / 60_000));
}

// A delivery the seller has to do something about: a failed or returned one
// sends the order back to them (confirm the parcel, or request a rider again).
export function deliveryNeedsSeller(d: Delivery | undefined): boolean {
  return d !== undefined && (d.status === "failed" || d.status === "returned");
}

// Can the seller send a rider again? Not while a returned parcel is still
// unconfirmed — it has to be physically back first.
export function canRequestAgain(d: Delivery | undefined): boolean {
  if (!d) return true;
  if (d.status === "returned") return d.returnConfirmedAt !== undefined;
  return d.status === "failed" || d.status === "cancelled";
}
