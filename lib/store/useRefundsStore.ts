import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import { isStaffSession } from "@/lib/store/useAppStore";
import {
  refundOwnerFor,
  type Refund,
  type RefundSource,
} from "@/lib/mock-data/refunds";
import type { PaymentMethod } from "@/lib/mock-data/orders";

export type NewRefundInput = {
  orderGroupId: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  paymentMethod: PaymentMethod;
  amountGHS: number;
  source: RefundSource;
  disputeId?: string;
  reason: string;
};

type RefundsState = {
  refunds: Refund[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  // Creates a refund owed to the buyer. One per cancelled order (and one per
  // dispute), never for nothing; returns null when it wasn't created.
  createRefund: (input: NewRefundInput) => Refund | null;
  // The seller who owes a refund says they've sent it (Direct MoMo orders).
  markRefundedBySeller: (refundId: string, sellerId: string) => "ok" | "invalid" | "forbidden";
  // Support marks a refund as sent (GRAPPlive-held payments, or confirmed with
  // a seller who hasn't marked it themselves).
  markRefundedByStaff: (refundId: string, note?: string) => "ok" | "invalid" | "forbidden";
};

// ---- Selectors ----

export function refundsForGroup(refunds: Refund[], groupId: string): Refund[] {
  return refunds.filter((r) => r.orderGroupId === groupId).sort((a, b) => b.createdAt - a.createdAt);
}

// Refunds a seller still has to send.
export function pendingForSeller(refunds: Refund[], sellerId: string): Refund[] {
  return refunds
    .filter((r) => r.status === "pending" && r.owner === "seller" && r.sellerId === sellerId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function nextRefundId(existing: Refund[]): string {
  const max = existing.reduce((m, r) => {
    const match = r.id.match(/^rf(\d+)$/);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `rf${max + 1}`;
}

export const useRefundsStore = create<RefundsState>()(
  persist(
    (set, get) => ({
      refunds: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      createRefund: (input) => {
        const { refunds } = get();
        if (input.amountGHS <= 0 || !input.buyerPhone) return null;
        const duplicate = refunds.some(
          (r) =>
            r.orderGroupId === input.orderGroupId &&
            r.source === input.source &&
            r.disputeId === input.disputeId
        );
        if (duplicate) return null;

        const refund: Refund = {
          id: nextRefundId(refunds),
          orderGroupId: input.orderGroupId,
          buyerPhone: input.buyerPhone,
          sellerId: input.sellerId,
          sellerName: input.sellerName,
          amountGHS: input.amountGHS,
          source: input.source,
          ...(input.disputeId ? { disputeId: input.disputeId } : {}),
          reason: input.reason,
          owner: refundOwnerFor(input.paymentMethod, input.sellerId),
          status: "pending",
          createdAt: Date.now(),
        };
        set({ refunds: [...refunds, refund] });
        return refund;
      },

      markRefundedBySeller: (refundId, sellerId) => {
        const refund = get().refunds.find((r) => r.id === refundId);
        if (!refund || refund.status !== "pending") return "invalid";
        if (refund.owner !== "seller" || refund.sellerId !== sellerId) return "forbidden";
        set((state) => ({
          refunds: state.refunds.map((r) =>
            r.id === refundId ? { ...r, status: "paid", paidAt: Date.now(), paidBy: "seller" } : r
          ),
        }));
        return "ok";
      },

      markRefundedByStaff: (refundId, note) => {
        if (!isStaffSession()) return "forbidden";
        const refund = get().refunds.find((r) => r.id === refundId);
        if (!refund || refund.status !== "pending") return "invalid";
        set((state) => ({
          refunds: state.refunds.map((r) =>
            r.id === refundId
              ? { ...r, status: "paid", paidAt: Date.now(), paidBy: "staff", ...(note?.trim() ? { note: note.trim() } : {}) }
              : r
          ),
        }));
        return "ok";
      },
    }),
    {
      name: "grapplive-refunds",
      storage: safeJSONStorage,
      partialize: (state) => ({ refunds: state.refunds }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
