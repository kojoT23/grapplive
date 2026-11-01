import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";

// Per-rider working state, keyed by rider id (see useRiderIdentityStore).
// Today that's just online/offline; earnings and the cash ledger join it in
// ROADMAP.md §11 step 3. A rider is offline until they switch themselves
// online — offers are only ever shown to, and accepted by, online riders.
type RiderState = {
  onlineByRider: Record<string, boolean>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setOnline: (riderId: string, online: boolean) => void;
  isOnline: (riderId: string) => boolean;
};

export const useRiderStore = create<RiderState>()(
  persist(
    (set, get) => ({
      onlineByRider: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setOnline: (riderId, online) =>
        set((state) => ({ onlineByRider: { ...state.onlineByRider, [riderId]: online } })),
      isOnline: (riderId) => get().onlineByRider[riderId] === true,
    }),
    {
      name: "grapplive-rider-status",
      storage: safeJSONStorage,
      partialize: (state) => ({ onlineByRider: state.onlineByRider }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
