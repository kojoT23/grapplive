import type { Delivery } from "@/lib/mock-data/deliveries";
import type { CashOut } from "@/lib/mock-data/cash";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useRiderStore } from "@/lib/store/useRiderStore";

// Rider earnings are the delivery fees of completed deliveries, minus what
// the rider has already cashed out. They are deliberately separate from COD
// cash (useCashLedgerStore): cash a rider collects is never theirs.

export function deliveredAt(d: Delivery): number | null {
  return d.history.find((h) => h.status === "delivered")?.at ?? null;
}

export function completedFor(deliveries: Delivery[], riderId: string): Delivery[] {
  return deliveries.filter((d) => d.riderId === riderId && d.status === "delivered");
}

export function totalEarned(deliveries: Delivery[], riderId: string): number {
  return completedFor(deliveries, riderId).reduce((sum, d) => sum + d.feeGHS, 0);
}

export function earnedSince(deliveries: Delivery[], riderId: string, sinceMs: number): number {
  return completedFor(deliveries, riderId)
    .filter((d) => (deliveredAt(d) ?? 0) >= sinceMs)
    .reduce((sum, d) => sum + d.feeGHS, 0);
}

// Midnight (local time) at the start of the day containing `nowMs`.
export function startOfDay(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function availableToCashOut(
  deliveries: Delivery[],
  cashOuts: CashOut[],
  riderId: string
): number {
  const cashedOut = cashOuts.reduce((sum, c) => sum + c.amountGHS, 0);
  return Math.max(0, totalEarned(deliveries, riderId) - cashedOut);
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
