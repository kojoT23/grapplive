// A buyer reporting a problem with an order that was delivered: the item isn't
// what was described, the wrong item came, it's damaged, or it never arrived.
// The seller can respond; GRAPPlive staff decide (refund or reject).
export type DisputeReason = "not_as_described" | "wrong_item" | "damaged" | "never_arrived";

export const disputeReasonLabels: Record<DisputeReason, string> = {
  not_as_described: "Not as described",
  wrong_item: "Wrong item",
  damaged: "Damaged",
  never_arrived: "Never arrived",
};

export type DisputeStatus = "open" | "refunded" | "rejected";

// How long after delivery a buyer can still report a problem.
export const DISPUTE_WINDOW_DAYS = 3;

export type Dispute = {
  id: string;
  orderGroupId: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  reason: DisputeReason;
  details?: string;
  status: DisputeStatus;
  createdAt: number;
  sellerResponse?: { text: string; at: number };
  resolvedAt?: number;
  resolution?: {
    outcome: "refunded" | "rejected";
    amountGHS?: number; // for a refund
    note?: string;
    refundId?: string;
  };
};
