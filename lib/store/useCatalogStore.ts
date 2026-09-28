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
// Same "one seller's worth of data" prototype scope as the other stores
// in this build (useBuyerRequestsStore, useStoreProfileStore,
// useLiveSessionStore) — no real auth/session yet, so seller CRUD always
// happens as CURRENT_SELLER_ID ("s1"). Client-side-only, same honest
// "this device only" limitation as everything else here.
const CURRENT_SELLER_ID = "s1";

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
// origin/verifiedTier/sourceType) come from the seller's existing fixture
// record, the same way every other product in catalog.ts already carries
// them — there's no separate Seller table. Sourced from the immutable
// static fixtures (sellers.ts → catalog.ts), so it stays correct even if
// every one of the seller's reactive products gets deleted.
function sellerTemplate() {
  const seller = getSellerById(CURRENT_SELLER_ID);
  const first = seller?.products[0];
  return {
    sellerId: CURRENT_SELLER_ID,
    sellerName: seller?.name ?? "My Store",
    sellerOrdersCompleted: seller?.ordersCompleted ?? 0,
    sellerReplyTime: seller?.replyTime ?? "",
    origin: first?.origin ?? ("third_party_seller" as const),
    sellerSocials: first?.sellerSocials ?? {},
    verifiedTier: first?.verifiedTier ?? null,
    sourceType: first?.sourceType ?? ("marketplace" as const),
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
