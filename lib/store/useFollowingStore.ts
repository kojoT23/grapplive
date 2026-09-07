import { create } from "zustand";
import { persist } from "zustand/middleware";

type FollowingState = {
  sellerIds: string[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  toggle: (sellerId: string) => void;
  isFollowing: (sellerId: string) => boolean;
};

// Same hasHydrated pattern as useAppStore/useWishlistStore — server has no
// localStorage, so sellerIds is unknowably empty until hydration completes.
export const useFollowingStore = create<FollowingState>()(
  persist(
    (set, get) => ({
      sellerIds: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      toggle: (sellerId) =>
        set((state) => ({
          sellerIds: state.sellerIds.includes(sellerId)
            ? state.sellerIds.filter((id) => id !== sellerId)
            : [...state.sellerIds, sellerId],
        })),
      isFollowing: (sellerId) => get().sellerIds.includes(sellerId),
    }),
    {
      name: "grapplelive-following",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
