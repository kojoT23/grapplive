import { create } from "zustand";
import { persist } from "zustand/middleware";

type FollowingState = {
  sellerIds: string[];
  toggle: (sellerId: string) => void;
  isFollowing: (sellerId: string) => boolean;
};

export const useFollowingStore = create<FollowingState>()(
  persist(
    (set, get) => ({
      sellerIds: [],
      toggle: (sellerId) =>
        set((state) => ({
          sellerIds: state.sellerIds.includes(sellerId)
            ? state.sellerIds.filter((id) => id !== sellerId)
            : [...state.sellerIds, sellerId],
        })),
      isFollowing: (sellerId) => get().sellerIds.includes(sellerId),
    }),
    { name: "grapplelive-following" }
  )
);
