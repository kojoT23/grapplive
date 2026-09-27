"use client";

import { ProductCard } from "@/components/ui/ProductCard";
import { useCatalogStore } from "@/lib/store/useCatalogStore";
import type { CatalogProduct } from "@/lib/mock-data/catalog";

// getSellerById (server-side, static) can't see products added via
// /products/new after the page was rendered — that data now lives in
// useCatalogStore, a client-only reactive store. So the buyer-facing grid
// is split into this small client component (mirrors the SellerFollowButton
// / SellerLiveBanner pattern already used on this page) while the rest of
// the profile (name, stats, about) stays server-rendered from the static
// seller record, which is fine since that part isn't part of this bug.
//
// `initialProducts` is the server-rendered snapshot, shown until the store
// hydrates from localStorage, so there's no empty-grid flash on load.
export function SellerProductGrid({
  sellerId,
  initialProducts,
}: {
  sellerId: string;
  initialProducts: CatalogProduct[];
}) {
  const hasHydrated = useCatalogStore((s) => s.hasHydrated);
  const storeProducts = useCatalogStore((s) => s.products);

  // Buyers only ever see live products — drafts, paused and out-of-stock
  // listings stay visible to the seller (storefront, /products) but not here.
  const products = (hasHydrated ? storeProducts : initialProducts).filter(
    (p) => p.sellerId === sellerId && p.status === "live"
  );

  if (products.length === 0) {
    return (
      <p className="px-3 md:px-5 text-[11px] text-gl-text-secondary">
        No products live yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
