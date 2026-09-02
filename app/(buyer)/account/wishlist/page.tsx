"use client";

import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { getProductById } from "@/lib/mock-data/catalog";

export default function WishlistPage() {
  const productIds = useWishlistStore((s) => s.productIds);

  const products = productIds
    .map((id) => getProductById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/account" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">Wishlist</h1>
      </div>

      {products.length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center">
          <div className="text-[11px] text-gl-text-secondary mb-3">
            Nothing saved yet — tap the heart on any product to add it here.
          </div>
          <Link
            href="/home"
            className="inline-block bg-gl-brand text-white text-[11px] font-semibold px-4 py-2 rounded-lg active:opacity-80 transition-opacity"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
