import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  productIds: string[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
};

// hasHydrated mirrors the pattern already used in useAppStore: on the
// server (and on first paint in the browser, before localStorage loads),
// there's no way to know the real wishlist yet. Components must treat
// "not hydrated" as "unknown, show the default state" — reading
// productIds before hydration causes a server/client render mismatch
// (confirmed by a real hydration warning on ProductCard's wishlist heart).
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      isWishlisted: (productId) => get().productIds.includes(productId),
    }),
    {
      name: "grapplelive-wishlist",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
