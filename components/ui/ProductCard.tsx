"use client";

import Link from "next/link";
import {
  IconHeart,
  IconShieldCheck,
  IconPackage,
  IconStar,
  IconStarFilled,
  IconShoppingCartPlus,
} from "@tabler/icons-react";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { useGrappStoreCartStore } from "@/lib/store/useGrappStoreCartStore";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import type { CatalogProduct, VerifiedTier } from "@/lib/mock-data/catalog";

const badgeConfig: Record<VerifiedTier, { label: string; icon: typeof IconShieldCheck }> = {
  verified_producer: { label: "Verified", icon: IconShieldCheck },
  trusted_import: { label: "Import", icon: IconPackage },
  top_seller: { label: "Top seller", icon: IconStar },
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addToMarketplaceCart = useCartStore((s) => s.addItem);
  const addToGrappStoreCart = useGrappStoreCartStore((s) => s.addItem);
  const requireAuth = useAuthGate();

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => toggleWishlist(product.id));
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      if (product.sourceType === "grapplive") {
        addToGrappStoreCart(product.id, 1);
      } else {
        addToMarketplaceCart(product.id, 1);
      }
    });
  };

  const badge = product.verifiedTier ? badgeConfig[product.verifiedTier] : null;
  const BadgeIcon = badge?.icon;
  const linkBase = product.sourceType === "grapplive" ? "/grappstore/product" : "/product";

  return (
    <Link
      href={`${linkBase}/${product.id}`}
      className="bg-white rounded-lg overflow-hidden border border-gl-border transition-transform active:scale-[0.97] relative block"
    >
      <div className="h-[100px] md:h-[140px] gl-shimmer relative">
        {badge && BadgeIcon ? (
          <span className="absolute top-1.5 left-1.5 bg-gl-brand-soft-bg text-gl-brand-soft-text text-[8px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <BadgeIcon size={9} />
            {badge.label}
          </span>
        ) : null}
        {product.discountPercent ? (
          <span className="absolute top-1.5 right-1.5 bg-gl-red text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-md">
            -{product.discountPercent}%
          </span>
        ) : null}
        <button
          onClick={handleToggleWishlist}
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-white/85 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Toggle wishlist"
        >
          <IconHeart
            size={13}
            className={isWishlisted ? "text-gl-brand fill-gl-brand" : "text-gl-text-secondary"}
          />
        </button>
      </div>

      <div className="px-2 py-2">
        <div className="text-[11px] text-gl-text leading-snug line-clamp-2 mb-1 min-h-[28px]">
          {product.name}
        </div>

        {product.rating != null ? (
          <div className="flex items-center gap-1 mb-1.5">
            <IconStarFilled size={10} className="text-gl-amber" />
            <span className="text-[9px] text-gl-text-secondary">
              {product.rating.toFixed(1)}
              {product.reviewCount ? ` (${product.reviewCount})` : ""}
            </span>
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-1">
          <div>
            <div className="text-[12px] font-bold text-gl-text">GHS {product.priceGHS}</div>
            {product.originalPriceGHS ? (
              <div className="text-[9px] text-gl-text-muted line-through">
                GHS {product.originalPriceGHS}
              </div>
            ) : null}
          </div>
          <button
            onClick={handleQuickAdd}
            className="w-6 h-6 rounded-full bg-gl-brand flex items-center justify-center active:scale-90 transition-transform shrink-0"
            aria-label="Add to cart"
          >
            <IconShoppingCartPlus size={13} className="text-white" />
          </button>
        </div>
      </div>
    </Link>
  );
}
