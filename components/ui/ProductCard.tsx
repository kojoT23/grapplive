"use client";

import Image from "next/image";
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

type BadgeInfo = { label: string; icon: typeof IconShieldCheck; iconClass: string };

// Neutral white pill + a colored icon, not a colored chip — one quiet
// trust signal instead of a loud badge competing with the rest of the
// card. Colors still map to the same meaning (green = verified, navy =
// import, amber = top seller) but carried by the icon alone.
const badgeConfig: Record<VerifiedTier, BadgeInfo> = {
  verified_producer: {
    label: "Verified",
    icon: IconShieldCheck,
    iconClass: "text-gl-green",
  },
  trusted_import: {
    label: "Import",
    icon: IconPackage,
    iconClass: "text-gl-navy",
  },
  top_seller: {
    label: "Top seller",
    icon: IconStar,
    iconClass: "text-gl-amber",
  },
};

type ProductCardProps = {
  product: CatalogProduct;
  soldToday?: number;
  imageSrc?: string;
  flipOnHover?: boolean;
};

export function ProductCard({ product, soldToday, imageSrc, flipOnHover }: ProductCardProps) {
  const hasHydrated = useWishlistStore((s) => s.hasHydrated);
  const isWishlistedRaw = useWishlistStore((s) => s.isWishlisted(product.id));
  const isWishlisted = hasHydrated && isWishlistedRaw;

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
  // Unique per card so multiple cards on one page don't collide on the
  // SVG pattern id.
  const weaveId = `pc-weave-${product.id}`;

  const imageBlock = (
    <div className={`h-[120px] md:h-[160px] relative overflow-hidden ${imageSrc ? "bg-white" : "gl-shimmer"}`}>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="200px"
          className="object-cover transition-transform duration-400 ease-out group-hover:scale-110"
          unoptimized
        />
      ) : (
        // A quiet woven texture instead of a flat gray "loading" look —
        // a placeholder that still reads as this store's aesthetic
        // (ankara/kente-adjacent) rather than generic UI chrome.
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" preserveAspectRatio="none">
          <defs>
            <pattern id={weaveId} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="12" stroke="currentColor" strokeWidth="1.5" />
              <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${weaveId})`} className="text-gl-text" />
        </svg>
      )}
      {badge && BadgeIcon ? (
        <span className="absolute top-2 left-2 bg-white/95 text-gl-text text-[8px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <BadgeIcon size={9} className={badge.iconClass} />
          {badge.label}
        </span>
      ) : null}
      {soldToday ? (
        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[8px] font-medium px-1.5 py-0.5 rounded-md">
          {soldToday} sold today
        </span>
      ) : null}
      <button
        onClick={handleToggleWishlist}
        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-150 ease-out hover:scale-110 active:scale-90"
        aria-label="Toggle wishlist"
      >
        <IconHeart
          size={15}
          className={isWishlisted ? "text-gl-brand fill-gl-brand" : "text-gl-text-secondary"}
        />
      </button>
    </div>
  );

  const detailsBlock = (
    <div className="px-2.5 py-2.5">
      <div className="text-[11.5px] text-gl-text leading-snug line-clamp-2 mb-1.5 min-h-[28px]">
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
          <div className="text-[15px] font-bold text-gl-text tracking-tight">GHS {product.priceGHS}</div>
          {product.originalPriceGHS ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-gl-text-muted line-through">
                GHS {product.originalPriceGHS}
              </span>
              {product.discountPercent ? (
                <span className="text-[9px] font-semibold text-gl-green">
                  Save {product.discountPercent}%
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          onClick={handleQuickAdd}
          className="w-9 h-9 rounded-full bg-gl-brand flex items-center justify-center transition-transform duration-150 ease-out hover:scale-110 active:scale-90 shrink-0"
          aria-label="Add to cart"
        >
          <IconShoppingCartPlus size={16} className="text-white" />
        </button>
      </div>
    </div>
  );

  if (flipOnHover) {
    return (
      <Link
        href={`${linkBase}/${product.id}`}
        className="group block [perspective:1000px] h-[230px]"
      >
        <div className="relative w-full h-full transition-transform duration-500 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
          <div className="absolute inset-0 bg-white rounded-lg overflow-hidden border border-gl-border [backface-visibility:hidden]">
            {imageBlock}
            {detailsBlock}
          </div>
          <div className="absolute inset-0 bg-gl-brand rounded-lg p-3 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div>
              <div className="text-[12px] font-semibold text-white leading-snug line-clamp-3 mb-2">
                {product.name}
              </div>
              {product.rating != null ? (
                <div className="flex items-center gap-1 mb-1.5">
                  <IconStarFilled size={10} className="text-white" />
                  <span className="text-[9px] text-white/85">
                    {product.rating.toFixed(1)}
                    {product.reviewCount ? ` (${product.reviewCount})` : ""}
                  </span>
                </div>
              ) : null}
              <div className="text-[15px] font-bold text-white">GHS {product.priceGHS}</div>
              {product.originalPriceGHS ? (
                <div className="text-[10px] text-white/70 line-through">
                  GHS {product.originalPriceGHS}
                </div>
              ) : null}
            </div>
            <button
              onClick={handleQuickAdd}
              className="w-full bg-white text-gl-brand text-[11px] font-semibold py-2 rounded-md transition-transform duration-150 ease-out active:scale-95 flex items-center justify-center gap-1.5"
            >
              <IconShoppingCartPlus size={13} />
              Add to cart
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`${linkBase}/${product.id}`}
      className="group bg-white rounded-lg overflow-hidden border border-gl-border relative block transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] active:translate-y-0"
    >
      {imageBlock}
      {detailsBlock}
    </Link>
  );
}

