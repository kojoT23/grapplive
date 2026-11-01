import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import type { CashEntry } from "@/lib/mock-data/cash";

// The cash ledger for cash-on-delivery orders. Entries are only ever created
// by the delivery side when a COD delivery is completed with the customer's
// OTP, and only move forward: held -> handover_pending (rider) -> settled
// (the receiving seller). Each step checks WHO is acting, so a rider can't
// settle their own cash and a seller can't confirm someone else's.
export type NewCashEntryInput = {
  deliveryId: string;
  orderGroupId: string;
  riderId: string;
  riderName: string;
  sellerId: string;
  sellerName: string;
  amountGHS: number;
};

type CashLedgerState = {
  entries: CashEntry[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  // Idempotent per delivery: a delivery can only ever record its cash once.
  recordCollection: (input: NewCashEntryInput) => CashEntry | null;
  handOver: (entryId: string, riderId: string) => "ok" | "invalid";
  confirmReceived: (entryId: string, sellerId: string) => "ok" | "invalid";
};

// ---- Selectors ----

// Cash a rider has collected and not yet handed over.
export function heldTotal(entries: CashEntry[], riderId: string): number {
  return entries
    .filter((e) => e.riderId === riderId && e.status === "held")
    .reduce((sum, e) => sum + e.amountGHS, 0);
}

export function entriesForRider(entries: CashEntry[], riderId: string): CashEntry[] {
  return entries.filter((e) => e.riderId === riderId).sort((a, b) => b.collectedAt - a.collectedAt);
}

// Handovers a seller still needs to confirm.
export function pendingForSeller(entries: CashEntry[], sellerId: string): CashEntry[] {
  return entries
    .filter((e) => e.sellerId === sellerId && e.status === "handover_pending")
    .sort((a, b) => (a.handedOverAt ?? 0) - (b.handedOverAt ?? 0));
}

function nextEntryId(existing: CashEntry[]): string {
  const max = existing.reduce((m, e) => {
    const match = e.id.match(/^c(\d+)$/);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `c${max + 1}`;
}

export const useCashLedgerStore = create<CashLedgerState>()(
  persist(
    (set, get) => ({
      entries: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      recordCollection: (input) => {
        const { entries } = get();
        if (input.amountGHS <= 0 || entries.some((e) => e.deliveryId === input.deliveryId)) {
          return null;
        }
        const entry: CashEntry = {
          id: nextEntryId(entries),
          ...input,
          status: "held",
          collectedAt: Date.now(),
        };
        set({ entries: [...entries, entry] });
        return entry;
      },

      handOver: (entryId, riderId) => {
        const entry = get().entries.find((e) => e.id === entryId);
        if (!entry || entry.riderId !== riderId || entry.status !== "held") return "invalid";
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId ? { ...e, status: "handover_pending", handedOverAt: Date.now() } : e
          ),
        }));
        return "ok";
      },

      confirmReceived: (entryId, sellerId) => {
        const entry = get().entries.find((e) => e.id === entryId);
        if (!entry || entry.sellerId !== sellerId || entry.status !== "handover_pending") {
          return "invalid";
        }
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId ? { ...e, status: "settled", settledAt: Date.now() } : e
          ),
        }));
        return "ok";
      },
    }),
    {
      name: "grapplive-cash-ledger",
      storage: safeJSONStorage,
      partialize: (state) => ({ entries: state.entries }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
