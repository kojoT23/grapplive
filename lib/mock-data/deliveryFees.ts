import { estimateTrip } from "@/lib/mock-data/deliveries";
import type { PaymentMethod } from "@/lib/mock-data/orders";

// Who pays for delivery depends on how the buyer chooses to pay:
//   - the paid opt-in, Instant Confirm: the buyer already agrees to a service
//     charge, so GRAPPlive covers delivery;
//   - every no-fee option (Direct MoMo, cash on delivery, GrappStore): the
//     buyer pays the delivery fee.
// Either way the rider is paid the same delivery fee for the trip.
export type DeliveryFeePayer = "buyer" | "grapplive";

export function deliveryFeePayer(method: PaymentMethod): DeliveryFeePayer {
  return method === "instant_confirm" ? "grapplive" : "buyer";
}

// MOCK fee for a seller -> buyer-area trip, deterministic so checkout, the
// order and the rider all agree. A real backend replaces this with routing
// distance and a real fee schedule.
export function estimateDeliveryFeeGHS(sellerId: string, area: string | null): number {
  return estimateTrip(`${sellerId}|${area ?? ""}`).feeGHS;
}

export type DeliveryFee = {
  feeGHS: number; // what the delivery costs; what the rider is paid
  chargedToBuyerGHS: number; // the part the buyer pays (0 when GRAPPlive covers it)
  payer: DeliveryFeePayer;
};

export function deliveryFeeFor(method: PaymentMethod, sellerId: string, area: string | null): DeliveryFee {
  const feeGHS = estimateDeliveryFeeGHS(sellerId, area);
  const payer = deliveryFeePayer(method);
  return { feeGHS, chargedToBuyerGHS: payer === "buyer" ? feeGHS : 0, payer };
}
