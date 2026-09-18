"use client";

import Image from "next/image";
import Link from "next/link";
import { IconHeart, IconShoppingCartPlus } from "@tabler/icons-react";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { useGrappStoreCartStore } from "@/lib/store/useGrappStoreCartStore";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import type { CatalogProduct } from "@/lib/mock-data/catalog";

export function WatchAndShopCard({
  product,
  videoUrl,
  posterSrc,
}: {
  product: CatalogProduct;
  videoUrl?: string;
  posterSrc?: string;
}) {
  const hasHydrated = useWishlistStore((s) => s.hasHydrated);
  const isWishlistedRaw = useWishlistStore((s) => s.isWishlisted(product.id));
  const isWishlisted = hasHydrated && isWishlistedRaw;
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addToMarketplaceCart = useCartStore((s) => s.addItem);
  const addToGrappStoreCart = useGrappStoreCartStore((s) => s.addItem);
  const requireAuth = useAuthGate();

  const linkBase = product.sourceType === "grapplive" ? "/grappstore/product" : "/product";

  const handleToggleWishlist = () => {
    requireAuth(() => toggleWishlist(product.id));
  };

  const handleQuickAdd = () => {
    requireAuth(() => {
      if (product.sourceType === "grapplive") {
        addToGrappStoreCart(product.id, 1);
      } else {
        addToMarketplaceCart(product.id, 1);
      }
    });
  };

  return (
    <div
      className="w-[140px] shrink-0 snap-center rounded-lg overflow-hidden border border-gl-border bg-white transition-transform transition-opacity duration-200 ease-out"
      style={{ transform: "scale(0.9)", opacity: 0.65 }}
    >
      <Link href={`${linkBase}/${product.id}`} className="block relative w-full h-[130px] bg-black overflow-hidden">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={posterSrc}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : posterSrc ? (
          <Image src={posterSrc} alt={product.name} fill sizes="140px" className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 gl-shimmer" />
        )}
      </Link>

      <div className="p-2">
        <Link href={`${linkBase}/${product.id}`}>
          <div className="text-[10px] text-gl-text leading-snug line-clamp-2 mb-1.5">{product.name}</div>
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gl-text">GHS {product.priceGHS}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleWishlist}
              aria-label="Like"
              className="w-7 h-7 rounded-full bg-gl-bg-muted flex items-center justify-center active:scale-90 hover:scale-110 transition-transform"
            >
              <IconHeart
                size={13}
                className={isWishlisted ? "text-gl-brand fill-gl-brand" : "text-gl-text-secondary"}
              />
            </button>
            <button
              onClick={handleQuickAdd}
              aria-label="Add to cart"
              className="w-7 h-7 rounded-full bg-gl-brand flex items-center justify-center active:scale-90 hover:scale-110 transition-transform"
            >
              <IconShoppingCartPlus size={13} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
