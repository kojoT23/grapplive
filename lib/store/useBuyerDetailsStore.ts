import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import type { DeliveryDetails } from "@/lib/mock-data/deliveryDetails";

// A buyer's last-used delivery details, remembered per phone so checkout is
// pre-filled next time. Keyed by phone from the start, so two people on one
// device never see each other's address.
type BuyerDetailsState = {
  detailsByPhone: Record<string, DeliveryDetails>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  saveDetails: (phone: string, details: DeliveryDetails) => void;
};

export const useBuyerDetailsStore = create<BuyerDetailsState>()(
  persist(
    (set) => ({
      detailsByPhone: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      saveDetails: (phone, details) =>
        set((state) => ({ detailsByPhone: { ...state.detailsByPhone, [phone]: details } })),
    }),
    {
      name: "grapplive-buyer-details",
      storage: safeJSONStorage,
      partialize: (state) => ({ detailsByPhone: state.detailsByPhone }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
