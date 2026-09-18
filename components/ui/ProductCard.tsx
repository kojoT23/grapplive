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

type BadgeInfo = { label: string; icon: typeof IconShieldCheck; bgClass: string; textClass: string };

const badgeConfig: Record<VerifiedTier, BadgeInfo> = {
  verified_producer: {
    label: "Verified",
    icon: IconShieldCheck,
    bgClass: "bg-gl-green-soft-bg",
    textClass: "text-gl-green-soft-text",
  },
  trusted_import: {
    label: "Import",
    icon: IconPackage,
    bgClass: "bg-gl-navy/10",
    textClass: "text-gl-navy",
  },
  top_seller: {
    label: "Top seller",
    icon: IconStar,
    bgClass: "bg-gl-amber-soft-bg",
    textClass: "text-gl-amber-soft-text",
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

  const imageBlock = (
    <div className={`h-[100px] md:h-[140px] relative overflow-hidden ${imageSrc ? "bg-white" : "gl-shimmer"}`}>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="200px"
          className="object-cover transition-transform duration-400 ease-out group-hover:scale-110"
          unoptimized
        />
      ) : null}
      {badge && BadgeIcon ? (
        <span
          className={`absolute top-1.5 left-1.5 ${badge.bgClass} ${badge.textClass} text-[8px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5`}
        >
          <BadgeIcon size={9} />
          {badge.label}
        </span>
      ) : null}
      {product.discountPercent ? (
        <span className="absolute top-1.5 right-1.5 bg-gl-red text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-md">
          -{product.discountPercent}%
        </span>
      ) : null}
      {soldToday ? (
        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[8px] font-medium px-1.5 py-0.5 rounded-md">
          {soldToday} sold today
        </span>
      ) : null}
      <button
        onClick={handleToggleWishlist}
        className="absolute bottom-1.5 right-1.5 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-150 ease-out hover:scale-110 active:scale-90"
        aria-label="Toggle wishlist"
      >
        <IconHeart
          size={16}
          className={isWishlisted ? "text-gl-brand fill-gl-brand" : "text-gl-text-secondary"}
        />
      </button>
    </div>
  );

  const detailsBlock = (
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
          <div className="text-[14px] font-bold text-gl-text">GHS {product.priceGHS}</div>
          {product.originalPriceGHS ? (
            <div className="text-[9px] text-gl-text-muted line-through">
              GHS {product.originalPriceGHS}
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
        className="group block [perspective:1000px] h-[215px]"
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
