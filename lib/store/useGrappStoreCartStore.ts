import { create } from "zustand";
import { persist } from "zustand/middleware";

// Deliberately separate from useCartStore (marketplace). GrappStore is a
// different merchant relationship — buyer confirmed this should not mix
// with seller carts/checkout (AGENTS.md §40.5).
export type GrappStoreCartItem = {
  productId: string;
  quantity: number;
};

type GrappStoreCartState = {
  items: GrappStoreCartItem[];
  addItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useGrappStoreCartStore = create<GrappStoreCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, quantity) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { productId, quantity }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.productId !== productId)
            : state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "grapplelive-grappstore-cart" }
  )
);
