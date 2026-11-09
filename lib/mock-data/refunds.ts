import type { PaymentMethod } from "@/lib/mock-data/orders";

// A refund owed to a buyer. No real money moves in the prototype (there's no
// payment rail yet): a refund is a RECORD of money someone owes the buyer,
// that its owner marks as paid once they've sent it.
//
// Who owes it depends on who is holding the buyer's money:
//   - Direct MoMo: the buyer paid the SELLER directly, so the seller refunds;
//   - Instant Confirm and GrappStore: GRAPPlive took the payment, so staff do.
export type RefundOwner = "seller" | "staff";
export type RefundStatus = "pending" | "paid";
export type RefundSource = "buyer_cancelled" | "seller_cancelled" | "dispute";

export const refundSourceLabels: Record<RefundSource, string> = {
  buyer_cancelled: "Order cancelled by the buyer",
  seller_cancelled: "Order cancelled by the seller",
  dispute: "Dispute resolved in the buyer's favour",
};

export type Refund = {
  id: string;
  orderGroupId: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  amountGHS: number;
  source: RefundSource;
  disputeId?: string; // set when source is "dispute"
  reason: string;
  owner: RefundOwner;
  status: RefundStatus;
  createdAt: number;
  paidAt?: number;
  paidBy?: "seller" | "staff";
  note?: string; // e.g. support's note when it marks a refund paid
};

export function refundOwnerFor(method: PaymentMethod, sellerId: string): RefundOwner {
  if (sellerId === "grapplive-official") return "staff";
  return method === "direct_momo" ? "seller" : "staff";
}
