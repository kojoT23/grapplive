import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  availableBalanceGHS as initialBalanceGHS,
  momoDetails as initialMomoDetails,
  payoutHistory as initialPayoutHistory,
  type PayoutRecord,
  type MomoDetails,
} from "@/lib/mock-data/payouts";

type PayoutsState = {
  balanceGHS: number;
  momoDetails: MomoDetails;
  history: PayoutRecord[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  requestPayout: () => void;
  updateMomoNumber: (maskedNumber: string) => void;
};

let payoutCounter = 0;
function nextPayoutId() {
  payoutCounter += 1;
  return `po-req-${Date.now()}-${payoutCounter}`;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Same hasHydrated pattern as useCartStore — server has no localStorage, so
// balance/history are unknowably wrong until hydration completes. The
// payouts page should check hasHydrated before trusting balanceGHS, same as
// cart badge counts do.
export const usePayoutsStore = create<PayoutsState>()(
  persist(
    (set, get) => ({
      balanceGHS: initialBalanceGHS,
      momoDetails: initialMomoDetails,
      history: initialPayoutHistory,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      // No real bank rail exists — this logs a payout request into history
      // and zeroes the visible balance. It does not move real money.
      requestPayout: () => {
        const { balanceGHS } = get();
        if (balanceGHS <= 0) return;
        const record: PayoutRecord = {
          id: nextPayoutId(),
          amountGHS: balanceGHS,
          detail: `Requested · ${formatShortDate(new Date())}`,
          status: "pending_release",
        };
        set((state) => ({
          balanceGHS: 0,
          history: [record, ...state.history],
        }));
      },

      // Stages the new number behind the existing 24h cooling-off window —
      // doesn't overwrite numberMasked immediately, matching the security
      // copy already on the payouts page.
      updateMomoNumber: (maskedNumber) => {
        set((state) => ({
          momoDetails: {
            ...state.momoDetails,
            pendingChange: {
              hoursRemaining: 24,
              minutesRemaining: 0,
              newNumberMasked: maskedNumber,
            },
          },
        }));
      },
    }),
    {
      name: "grapplive-payouts",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

