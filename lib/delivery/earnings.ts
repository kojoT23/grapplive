import { FAILED_DELIVERY_FEE_SHARE, type Delivery } from "@/lib/mock-data/deliveries";
import type { CashOut } from "@/lib/mock-data/cash";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useRiderStore } from "@/lib/store/useRiderStore";

// Rider earnings are the delivery fees of their deliveries — the full fee for a
// completed one, half for a failed one that wasn't the rider's fault
// (FAILED_DELIVERY_FEE_SHARE) — minus what they've already cashed out. They are
// deliberately separate from COD cash (useCashLedgerStore): cash a rider
// collects is never theirs.

export function deliveredAt(d: Delivery): number | null {
  return d.history.find((h) => h.status === "delivered")?.at ?? null;
}

export function completedFor(deliveries: Delivery[], riderId: string): Delivery[] {
  return deliveries.filter((d) => d.riderId === riderId && d.status === "delivered");
}

// Half a delivery fee (what a failed delivery that wasn't the rider's fault pays).
export function halfFeeGHS(feeGHS: number): number {
  return Math.round(feeGHS * FAILED_DELIVERY_FEE_SHARE * 100) / 100;
}

// What the rider has earned from one delivery, in GHS.
//   delivered                          the full fee
//   returned (and the seller confirmed the parcel is back) / failed at pickup
//                                      half the fee
//   anything else (still in progress, cancelled, handed back)  nothing yet
export function earnedFeeGHS(d: Delivery): number {
  if (d.status === "delivered") return d.feeGHS;
  const half = halfFeeGHS(d.feeGHS);
  if (d.status === "returned" && d.returnConfirmedAt !== undefined) return half;
  if (d.status === "failed") return half;
  return 0;
}

// When that money was earned (for "today" / "7 days"): when it was delivered,
// when the seller confirmed the parcel back, or when the pickup failed.
export function earnedAt(d: Delivery): number | null {
  if (d.status === "delivered") return deliveredAt(d);
  if (d.status === "returned") return d.returnConfirmedAt ?? null;
  if (d.status === "failed") return d.history.find((h) => h.status === "failed")?.at ?? null;
  return null;
}

function earningDeliveries(deliveries: Delivery[], riderId: string): Delivery[] {
  return deliveries.filter((d) => d.riderId === riderId && earnedFeeGHS(d) > 0);
}

export function totalEarned(deliveries: Delivery[], riderId: string): number {
  return earningDeliveries(deliveries, riderId).reduce((sum, d) => sum + earnedFeeGHS(d), 0);
}

export function earnedSince(deliveries: Delivery[], riderId: string, sinceMs: number): number {
  return earningDeliveries(deliveries, riderId)
    .filter((d) => (earnedAt(d) ?? 0) >= sinceMs)
    .reduce((sum, d) => sum + earnedFeeGHS(d), 0);
}

// Midnight (local time) at the start of the day containing `nowMs`.
export function startOfDay(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Fees the rider already took from cash they collected (cash on delivery
// where the buyer pays delivery): earned, but not paid out again.
export function keptFromCash(deliveries: Delivery[], riderId: string): number {
  return completedFor(deliveries, riderId)
    .filter((d) => d.feePaidInCash)
    .reduce((sum, d) => sum + d.feeGHS, 0);
}

export function availableToCashOut(
  deliveries: Delivery[],
  cashOuts: CashOut[],
  riderId: string
): number {
  const cashedOut = cashOuts.reduce((sum, c) => sum + c.amountGHS, 0);
  return Math.max(0, totalEarned(deliveries, riderId) - keptFromCash(deliveries, riderId) - cashedOut);
}

// Cash out everything currently available. Returns the amount, or 0 when
// there was nothing to cash out.
export function requestCashOut(riderId: string): number {
  const deliveries = useDeliveryStore.getState().deliveries;
  const cashOuts = useRiderStore.getState().cashOutsByRider[riderId] ?? [];
  const amount = availableToCashOut(deliveries, cashOuts, riderId);
  if (amount <= 0) return 0;
  useRiderStore.getState().recordCashOut(riderId, amount);
  return amount;
}
