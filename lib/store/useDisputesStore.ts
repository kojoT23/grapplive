import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import { isStaffSession } from "@/lib/store/useAppStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useDeliveryStore, latestDeliveryForGroup } from "@/lib/store/useDeliveryStore";
import { useRefundsStore } from "@/lib/store/useRefundsStore";
import { groupPayable } from "@/lib/mock-data/orders";
import {
  DISPUTE_WINDOW_DAYS,
  type Dispute,
  type DisputeReason,
} from "@/lib/mock-data/disputes";

export type OpenDisputeResult = "ok" | "invalid" | "not_buyer" | "not_delivered" | "already_open" | "window_closed";
export type DisputeActionResult = "ok" | "invalid" | "forbidden";

type DisputesState = {
  disputes: Dispute[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  // The buyer reports a problem with a delivered order (once per order, within
  // DISPUTE_WINDOW_DAYS of delivery).
  openDispute: (input: {
    orderGroupId: string;
    buyerPhone: string;
    reason: DisputeReason;
    details?: string;
  }) => OpenDisputeResult;
  // The seller answers, once, while it's open.
  respondToDispute: (disputeId: string, sellerId: string, text: string) => DisputeActionResult;
  // Support decides: refund the buyer (the full amount, or less), or reject.
  staffResolve: (
    disputeId: string,
    outcome: "refunded" | "rejected",
    options?: { amountGHS?: number; note?: string }
  ) => DisputeActionResult;
};

// ---- Selectors ----

export function disputeForGroup(disputes: Dispute[], groupId: string): Dispute | undefined {
  return disputes.find((d) => d.orderGroupId === groupId);
}

// Open disputes a seller can respond to.
export function openForSeller(disputes: Dispute[], sellerId: string): Dispute[] {
  return disputes
    .filter((d) => d.status === "open" && d.sellerId === sellerId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function nextDisputeId(existing: Dispute[]): string {
  const max = existing.reduce((m, d) => {
    const match = d.id.match(/^dp(\d+)$/);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `dp${max + 1}`;
}

function findGroup(groupId: string) {
  const order = useOrdersStore.getState().orders.find((o) => o.groups.some((g) => g.id === groupId));
  const group = order?.groups.find((g) => g.id === groupId);
  return order && group ? { order, group } : undefined;
}

export const useDisputesStore = create<DisputesState>()(
  persist(
    (set, get) => ({
      disputes: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      openDispute: ({ orderGroupId, buyerPhone, reason, details }) => {
        const found = findGroup(orderGroupId);
        if (!found) return "invalid";
        const { order, group } = found;
        if (order.buyerPhone && order.buyerPhone !== buyerPhone) return "not_buyer";
        if (group.status !== "delivered") return "not_delivered";
        if (get().disputes.some((d) => d.orderGroupId === orderGroupId)) return "already_open";

        // The window runs from when the rider completed the delivery. Older
        // orders with no delivery record have no timestamp, so they're allowed.
        const delivery = latestDeliveryForGroup(useDeliveryStore.getState().deliveries, orderGroupId);
        const deliveredAt = delivery?.history.find((h) => h.status === "delivered")?.at;
        if (deliveredAt !== undefined && Date.now() - deliveredAt > DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
          return "window_closed";
        }

        const trimmed = details?.trim().slice(0, 500);
        const dispute: Dispute = {
          id: nextDisputeId(get().disputes),
          orderGroupId,
          buyerPhone,
          sellerId: group.sellerId,
          sellerName: group.sellerName,
          reason,
          ...(trimmed ? { details: trimmed } : {}),
          status: "open",
          createdAt: Date.now(),
        };
        set((state) => ({ disputes: [...state.disputes, dispute] }));
        return "ok";
      },

      respondToDispute: (disputeId, sellerId, text) => {
        const dispute = get().disputes.find((d) => d.id === disputeId);
        const trimmed = text.trim().slice(0, 500);
        if (!dispute || dispute.status !== "open" || dispute.sellerResponse || !trimmed) return "invalid";
        if (dispute.sellerId !== sellerId) return "forbidden";
        set((state) => ({
          disputes: state.disputes.map((d) =>
            d.id === disputeId ? { ...d, sellerResponse: { text: trimmed, at: Date.now() } } : d
          ),
        }));
        return "ok";
      },

      staffResolve: (disputeId, outcome, options) => {
        if (!isStaffSession()) return "forbidden";
        const dispute = get().disputes.find((d) => d.id === disputeId);
        if (!dispute || dispute.status !== "open") return "invalid";
        const note = options?.note?.trim() || undefined;

        if (outcome === "rejected") {
          set((state) => ({
            disputes: state.disputes.map((d) =>
              d.id === disputeId
                ? { ...d, status: "rejected", resolvedAt: Date.now(), resolution: { outcome, ...(note ? { note } : {}) } }
                : d
            ),
          }));
          return "ok";
        }

        // Refund: up to what the buyer paid for this order.
        const found = findGroup(dispute.orderGroupId);
        if (!found) return "invalid";
        const maxAmount = groupPayable(found.group);
        const amount = options?.amountGHS ?? maxAmount;
        if (!Number.isFinite(amount) || amount <= 0 || amount > maxAmount) return "invalid";

        const refund = useRefundsStore.getState().createRefund({
          orderGroupId: dispute.orderGroupId,
          buyerPhone: dispute.buyerPhone,
          sellerId: dispute.sellerId,
          sellerName: dispute.sellerName,
          paymentMethod: found.group.paymentMethod,
          amountGHS: amount,
          source: "dispute",
          disputeId: dispute.id,
          reason: `Dispute: ${dispute.reason}`,
        });
        if (!refund) return "invalid";

        set((state) => ({
          disputes: state.disputes.map((d) =>
            d.id === disputeId
              ? {
                  ...d,
                  status: "refunded",
                  resolvedAt: Date.now(),
                  resolution: { outcome, amountGHS: amount, ...(note ? { note } : {}), refundId: refund.id },
                }
              : d
          ),
        }));
        return "ok";
      },
    }),
    {
      name: "grapplive-disputes",
      storage: safeJSONStorage,
      partialize: (state) => ({ disputes: state.disputes }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
