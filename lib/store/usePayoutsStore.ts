import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import {
  availableBalanceGHS as demoBalanceGHS,
  momoDetails as demoMomoDetails,
  payoutHistory as demoPayoutHistory,
  type PayoutRecord,
  type MomoDetails,
} from "@/lib/mock-data/payouts";
import { DEMO_SELLER_ID } from "@/lib/store/useSellerIdentityStore";

// ROADMAP.md §1 ("still open from that audit"): this store used to hold ONE
// balance, ONE MoMo number and ONE history for the whole device, so a second
// seller would have seen — and could "withdraw" — the first seller's
// balance. It's now keyed by seller id, same idea as useStoreProfileStore.
// Components don't read this store directly: use useCurrentPayouts()
// (lib/hooks), which resolves to whichever seller is signed in.
export type SellerPayouts = {
  balanceGHS: number;
  momoDetails: MomoDetails;
  history: PayoutRecord[];
};

// What a seller's payouts look like before anything has happened: the demo
// seller starts from the static fixtures; a genuinely new seller starts
// empty (no balance, no history, no MoMo number yet).
export function seedPayoutsFor(sellerId: string): SellerPayouts {
  if (sellerId === DEMO_SELLER_ID) {
    return {
      balanceGHS: demoBalanceGHS,
      momoDetails: demoMomoDetails,
      history: demoPayoutHistory,
    };
  }
  return {
    balanceGHS: 0,
    momoDetails: { numberMasked: "", isVerified: false, pendingChange: null },
    history: [],
  };
}

type PayoutsState = {
  payoutsBySeller: Record<string, SellerPayouts>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  requestPayout: (sellerId: string) => void;
  updateMomoNumber: (sellerId: string, maskedNumber: string) => void;
};

let payoutCounter = 0;
function nextPayoutId() {
  payoutCounter += 1;
  return `po-req-${Date.now()}-${payoutCounter}`;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function patchPayouts(
  state: PayoutsState,
  sellerId: string,
  patch: Partial<SellerPayouts>
) {
  const current = state.payoutsBySeller[sellerId] ?? seedPayoutsFor(sellerId);
  return {
    payoutsBySeller: { ...state.payoutsBySeller, [sellerId]: { ...current, ...patch } },
  };
}

// Version 0 was the old flat, single-seller shape. Anyone with that data
// already saved on their device keeps it — it belonged to the demo seller,
// since that's the only seller the old shape could represent.
export function migratePayouts(persisted: unknown, version: number) {
  if (version >= 1) return persisted as Pick<PayoutsState, "payoutsBySeller">;
  const old = (persisted ?? {}) as Partial<SellerPayouts>;
  const hasOldData =
    old.balanceGHS !== undefined || old.momoDetails !== undefined || old.history !== undefined;
  if (!hasOldData) return { payoutsBySeller: {} };
  const seed = seedPayoutsFor(DEMO_SELLER_ID);
  return {
    payoutsBySeller: {
      [DEMO_SELLER_ID]: {
        balanceGHS: old.balanceGHS ?? seed.balanceGHS,
        momoDetails: old.momoDetails ?? seed.momoDetails,
        history: old.history ?? seed.history,
      },
    },
  };
}

// Same hasHydrated pattern as useCartStore — server has no localStorage, so
// balance/history are unknowably wrong until hydration completes. The
// payouts page should check hasHydrated before trusting the balance, same as
// cart badge counts do.
export const usePayoutsStore = create<PayoutsState>()(
  persist(
    (set, get) => ({
      payoutsBySeller: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      // No real bank rail exists — this logs a payout request into the
      // seller's history and zeroes their visible balance. It does not move
      // real money, and it only ever touches the seller it's called for.
      requestPayout: (sellerId) => {
        const current = get().payoutsBySeller[sellerId] ?? seedPayoutsFor(sellerId);
        if (current.balanceGHS <= 0) return;
        const record: PayoutRecord = {
          id: nextPayoutId(),
          amountGHS: current.balanceGHS,
          detail: `Requested · ${formatShortDate(new Date())}`,
          status: "pending_release",
        };
        set((state) =>
          patchPayouts(state, sellerId, {
            balanceGHS: 0,
            history: [record, ...current.history],
          })
        );
      },

      // Changing an existing number stages the new one behind the 24h
      // cooling-off window (matching the security copy on the payouts
      // page). A seller's FIRST number has nothing to cool off from, so it
      // is set directly — but unverified, since real verification needs a
      // backend.
      updateMomoNumber: (sellerId, maskedNumber) => {
        const current = get().payoutsBySeller[sellerId] ?? seedPayoutsFor(sellerId);
        const momoDetails: MomoDetails = current.momoDetails.numberMasked
          ? {
              ...current.momoDetails,
              pendingChange: {
                hoursRemaining: 24,
                minutesRemaining: 0,
                newNumberMasked: maskedNumber,
              },
            }
          : { numberMasked: maskedNumber, isVerified: false, pendingChange: null };
        set((state) => patchPayouts(state, sellerId, { momoDetails }));
      },
    }),
    {
      name: "grapplive-payouts",
      storage: safeJSONStorage,
      version: 1,
      migrate: migratePayouts,
      partialize: (state) => ({ payoutsBySeller: state.payoutsBySeller }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
