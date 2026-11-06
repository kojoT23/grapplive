// Cash-on-delivery handling (AGENTS.md §17): when a rider collects cash from
// a buyer, that cash is tracked from collection until it reaches the seller,
// kept entirely separate from the rider's earnings.
//
//   held             rider has collected it and still has it
//   handover_pending rider says they handed it to the seller; waiting for the
//                    seller to confirm they received it
//   settled          seller confirmed — the cash trail is closed
//   disputed         the seller says they did NOT receive it; the rider is
//                    still responsible for the cash and can hand it over again
//   rider_liable     support looked into a dispute and held the rider
//                    responsible: they owe the money until support marks it repaid
export type CashEntryStatus = "held" | "handover_pending" | "settled" | "disputed" | "rider_liable";

export type CashEntry = {
  id: string;
  deliveryId: string;
  orderGroupId: string;
  riderId: string;
  riderName: string;
  sellerId: string;
  sellerName: string;
  amountGHS: number;
  status: CashEntryStatus;
  collectedAt: number;
  handedOverAt?: number;
  settledAt?: number;
  disputedAt?: number;
  resolvedAt?: number; // when support resolved a dispute or recorded a repayment
  staffNote?: string; // support's reason, for the audit trail
};

// A rider holding this much (or more) unhanded cash can't accept new jobs
// until they hand some over — limits how much cash is ever exposed to loss.
export const CASH_HOLD_LIMIT_GHS = 500;

// A rider's request to withdraw earnings. Like the seller payouts page,
// this does not move real money (no payment rail exists yet).
export type CashOut = {
  id: string;
  riderId: string;
  amountGHS: number;
  requestedAt: number;
};
