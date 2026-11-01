import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import type { CashOut } from "@/lib/mock-data/cash";

// Per-rider working state, keyed by rider id (see useRiderIdentityStore):
// online/offline, and the rider's cash-out requests. (Earnings themselves
// are derived from completed deliveries, and COD cash lives in
// useCashLedgerStore.) A rider is offline until they switch themselves
// online — offers are only ever shown to, and accepted by, online riders.
type RiderState = {
  onlineByRider: Record<string, boolean>;
  cashOutsByRider: Record<string, CashOut[]>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setOnline: (riderId: string, online: boolean) => void;
  isOnline: (riderId: string) => boolean;
  // Low-level: records a cash-out. Callers go through requestCashOut
  // (lib/delivery/earnings.ts), which works out the amount.
  recordCashOut: (riderId: string, amountGHS: number) => void;
};

export const useRiderStore = create<RiderState>()(
  persist(
    (set, get) => ({
      onlineByRider: {},
      cashOutsByRider: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setOnline: (riderId, online) =>
        set((state) => ({ onlineByRider: { ...state.onlineByRider, [riderId]: online } })),
      isOnline: (riderId) => get().onlineByRider[riderId] === true,
      recordCashOut: (riderId, amountGHS) =>
        set((state) => {
          const existing = state.cashOutsByRider[riderId] ?? [];
          const cashOut: CashOut = {
            id: `co${Date.now()}-${existing.length + 1}`,
            riderId,
            amountGHS,
            requestedAt: Date.now(),
          };
          return { cashOutsByRider: { ...state.cashOutsByRider, [riderId]: [cashOut, ...existing] } };
        }),
    }),
    {
      name: "grapplive-rider-status",
      storage: safeJSONStorage,
      partialize: (state) => ({
        onlineByRider: state.onlineByRider,
        cashOutsByRider: state.cashOutsByRider,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
