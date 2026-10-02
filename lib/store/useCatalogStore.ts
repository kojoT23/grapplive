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

// ROADMAP.md §2.2: status and stockCount used to be two independent
// fields nothing kept in sync — a product could sit at stockCount: 0
// while still marked status: "live", shown to buyers as purchasable when
// it wasn't. This is the fix: "out of stock" is no longer something a
// seller manually declares, it's derived and enforced here, on every
// write, regardless of which form (or which future API) produced the
// input. A live product that runs out of stock is automatically flipped
// to out_of_stock; restocking it automatically flips it back to live.
// draft/paused are untouched — those stay fully seller-controlled
// regardless of stock level (e.g. pausing a listing you still have stock
// for). This is also why the add-product and edit-product forms'
// manually-selectable status options don't need to match each other on
// out_of_stock — it's never meant to be a manual choice either way.
function normalizeStatus(status: ProductStatus, stockCount: number | undefined): ProductStatus {
  const inStock = (stockCount ?? 0) > 0;
  if (status === "live" && !inStock) return "out_of_stock";
  if (status === "out_of_stock" && inStock) return "live";
  return status;
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
        const newProduct: CatalogProduct = {
          id,
          ...sellerTemplate(),
          ...input,
          status: normalizeStatus(input.status, input.stockCount),
        };
        set((state) => ({ products: [newProduct, ...state.products] }));
        return id;
      },

      updateProduct: (id, input) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, ...input, status: normalizeStatus(input.status, input.stockCount) }
              : p
          ),
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
