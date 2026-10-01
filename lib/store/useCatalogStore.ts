import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import {
  catalogProducts,
  type CatalogProduct,
  type ProductCategory,
  type ProductStatus,
} from "@/lib/mock-data/catalog";
import { getSellerById } from "@/lib/mock-data/sellers";
import { getCurrentSellerIdSync, useSellerIdentityStore, DEMO_SELLER_ID } from "@/lib/store/useSellerIdentityStore";

// Replaces useProductsStore (lib/store/useProductsStore.ts, now deleted).
// That store held a disconnected shadow copy of a seller's inventory
// (SellerProduct, in lib/mock-data/products.ts, now deleted) that never
// touched catalog.ts — the real, buyer-facing product data used across
// ~20+ files. A seller adding a product via /products/new used to update
// only that shadow copy, so it never appeared anywhere a buyer could see
// it. This store fixes that by making CatalogProduct itself reactive:
// seeded from the same static `catalogProducts` fixtures every other
// buyer-facing page reads, then mutated in place via addProduct /
// updateProduct / deleteProduct. Seller CRUD pages and buyer-facing pages
// both read from here now, so there's exactly one source of truth.
//
// ROADMAP.md §1.1: which seller a product belongs to now resolves
// dynamically via getCurrentSellerIdSync (see
// lib/store/useSellerIdentityStore.ts), not a hardcoded constant —
// whoever is actually signed in as "Sell" owns the products they add.

export type NewCatalogProductInput = {
  name: string;
  priceGHS: number;
  stockCount: number;
  status: ProductStatus;
  category: ProductCategory;
  isResellerItem?: boolean;
  resellerMarkupGHS?: number;
  draftNote?: string;
  unitsSold?: number;
  originalPriceGHS?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  images?: string[];
};

type CatalogState = {
  products: CatalogProduct[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addProduct: (input: NewCatalogProductInput) => string;
  updateProduct: (id: string, input: NewCatalogProductInput) => void;
  deleteProduct: (id: string) => void;
};

const productCounter = 100;

function nextProductId(existing: CatalogProduct[]): string {
  const maxSuffix = existing.reduce((max, p) => {
    const match = p.id.match(/^p(\d+)$/);
    if (!match) return max;
    return Math.max(max, parseInt(match[1], 10));
  }, productCounter);
  return `p${maxSuffix + 1}`;
}

// Denormalized seller fields (name, orders completed, reply time, socials,
// origin/verifiedTier/sourceType) get stamped onto every product, the
// same way every fixture product in catalog.ts already carries them —
// there's no separate Seller table (see ROADMAP.md §1.2, not yet fixed).
// name/ordersCompleted/replyTime come from useSellerIdentityStore — the
// real identity created at signup, correct for both the demo seller and
// a genuinely new one. origin/sellerSocials/verifiedTier/sourceType
// aren't part of that lightweight identity record; those still come from
// the demo seller's fixture product when sellerId is the demo seller
// ("s1"), and use sensible new-seller defaults otherwise.
function sellerTemplate() {
  const sellerId = getCurrentSellerIdSync();
  const identity = Object.values(useSellerIdentityStore.getState().identitiesByPhone).find(
    (i) => i.id === sellerId
  );
  const demoFirstProduct =
    sellerId === DEMO_SELLER_ID ? getSellerById(DEMO_SELLER_ID)?.products[0] : undefined;

  return {
    sellerId,
    sellerName: identity?.name ?? "My Store",
    sellerOrdersCompleted: identity?.ordersCompleted ?? 0,
    sellerReplyTime: identity?.replyTime ?? "Usually within a day",
    origin: demoFirstProduct?.origin ?? ("third_party_seller" as const),
    sellerSocials: demoFirstProduct?.sellerSocials ?? {},
    verifiedTier: demoFirstProduct?.verifiedTier ?? null,
    sourceType: demoFirstProduct?.sourceType ?? ("marketplace" as const),
  };
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: catalogProducts,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      addProduct: (input) => {
        const id = nextProductId(get().products);
        const newProduct: CatalogProduct = { id, ...sellerTemplate(), ...input };
        set((state) => ({ products: [newProduct, ...state.products] }));
        return id;
      },

      updateProduct: (id, input) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...input } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
    }),
    {
      name: "grapplive-catalog",
      storage: safeJSONStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
