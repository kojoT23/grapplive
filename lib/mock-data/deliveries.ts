// The delivery record (AGENTS.md §10): one per delivery attempt for an
// order group, separate from the order itself. The ORDER only carries the
// coarse buyer/seller-facing status (ready_for_pickup -> rider_assigned ->
// out_for_delivery -> delivered); the finer rider steps (heading to pickup,
// arrived, ...) live here.

export type DeliveryStatus =
  | "offered" // created, waiting for a rider to accept
  | "heading_to_pickup" // accepted; rider is going to the seller
  | "at_pickup" // rider has arrived at the seller
  | "out_for_delivery" // parcel picked up; rider is going to the customer
  | "at_dropoff" // rider has arrived at the customer; awaiting OTP
  | "delivered"
  | "failed"; // see failureReason

export const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  "heading_to_pickup",
  "at_pickup",
  "out_for_delivery",
  "at_dropoff",
];

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
  heading_to_pickup: "Rider is heading to the seller",
  at_pickup: "Rider is at the seller",
  out_for_delivery: "On the way to you",
  at_dropoff: "Rider has arrived",
  delivered: "Delivered",
  failed: "Delivery failed",
};

// How long a rider has to accept an offer once it's shown to them.
export const OFFER_SECONDS = 30;
// Wrong OTP attempts allowed before the code is locked.
export const OTP_MAX_ATTEMPTS = 5;

export type DeliveryHistoryEntry = { status: DeliveryStatus; at: number };

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
  pickupKm: number;
  dropoffKm: number;
  feeGHS: number;
  etaMinutes: number;
  // Cash the rider must collect from the customer; 0 when already paid.
  // The cash-handover ledger that tracks this is ROADMAP.md §11 step 3.
  codAmountGHS: number;
  status: DeliveryStatus;
  riderId: string | null;
  riderName: string | null;
  otp: string;
  otpAttempts: number;
  declinedBy: string[]; // rider ids who declined or let the offer expire
  offerSeenAt: Record<string, number>; // rider id -> when the offer was first shown
  failureReason?: FailureReason;
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
