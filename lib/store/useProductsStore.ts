import { create } from "zustand";
import { persist } from "zustand/middleware";
import { initialProducts, type SellerProduct, type ProductStatus } from "@/lib/mock-data/products";

export type NewProductInput = {
  name: string;
  priceGHS: number;
  stock: number;
  status: ProductStatus;
  isResellerItem?: boolean;
  resellerMarkupGHS?: number;
  draftNote?: string;
  unitsSold?: number;
  originalPriceGHS?: number;
  discountPercent?: number;
  ratingAvg?: number;
  reviewCount?: number;
};

type ProductsState = {
  products: SellerProduct[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addProduct: (input: NewProductInput) => string;
  updateProduct: (id: string, input: NewProductInput) => void;
  deleteProduct: (id: string) => void;
};

let productCounter = 100;

function nextProductId(existing: SellerProduct[]): string {
  const maxSuffix = existing.reduce((max, p) => {
    const match = p.id.match(/^p(\d+)$/);
    if (!match) return max;
    return Math.max(max, parseInt(match[1], 10));
  }, productCounter);
  return `p${maxSuffix + 1}`;
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      addProduct: (input) => {
        const id = nextProductId(get().products);
        const newProduct: SellerProduct = { id, ...input };
        set((state) => ({ products: [newProduct, ...state.products] }));
        return id;
      },

      updateProduct: (id, input) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { id, ...input } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
    }),
    {
      name: "grapplelive-products",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

