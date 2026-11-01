// Cash-on-delivery handling (AGENTS.md §17): when a rider collects cash from
// a buyer, that cash is tracked from collection until it reaches the seller,
// kept entirely separate from the rider's earnings.
//
//   held             rider has collected it and still has it
//   handover_pending rider says they handed it to the seller; waiting for the
//                    seller to confirm they received it
//   settled          seller confirmed — the cash trail is closed
export type CashEntryStatus = "held" | "handover_pending" | "settled";

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
