"use client";

import Link from "next/link";
import { IconHeart, IconShieldCheck, IconPackage, IconStar } from "@tabler/icons-react";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import type { CatalogProduct, PremiumBadge } from "@/lib/mock-data/catalog";

const badgeConfig: Record<PremiumBadge, { label: string; icon: typeof IconShieldCheck }> = {
  verified_producer: { label: "Verified", icon: IconShieldCheck },
  trusted_import: { label: "Import", icon: IconPackage },
  top_seller: { label: "Top seller", icon: IconStar },
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const requireAuth = useAuthGate();

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => toggle(product.id));
  };

  const badge = product.premiumBadge ? badgeConfig[product.premiumBadge] : null;
  const BadgeIcon = badge?.icon;

  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-gl-bg-muted rounded-lg overflow-hidden transition-transform active:scale-[0.97] relative block"
    >
      <div className="h-[70px] md:h-[110px] gl-shimmer relative">
        {badge && BadgeIcon && (
          <span className="absolute top-1.5 left-1.5 bg-gl-brand-soft-bg text-gl-brand-soft-text text-[8px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <BadgeIcon size={9} />
            {badge.label}
          </span>
        )}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center active:scale-90 transition-transform"
        >
          <IconHeart
            size={13}
            className={isWishlisted ? "text-gl-brand fill-gl-brand" : "text-gl-text-secondary"}
          />
        </button>
      </div>
      <div className="px-2 py-1.5">
        <div className="text-[11px] font-semibold text-gl-text">GHS {product.priceGHS}</div>
        {product.discountPercent && (
          <div className="text-[9px] text-gl-brand-soft-text">-{product.discountPercent}%</div>
        )}
      </div>
    </Link>
  );
}
