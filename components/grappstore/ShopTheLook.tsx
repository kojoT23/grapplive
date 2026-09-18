"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconShoppingBag } from "@tabler/icons-react";
import { useGrappStoreCartStore } from "@/lib/store/useGrappStoreCartStore";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import { getLookProducts, getLookTotal, type GrappStoreLook } from "@/lib/mock-data/grappstoreLooks";
import { productIllustrationByProductId } from "@/lib/mock-data/productIllustrations";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export function ShopTheLook({ look }: { look: GrappStoreLook }) {
  const router = useRouter();
  const products = getLookProducts(look);
  const total = getLookTotal(look);
  const addItem = useGrappStoreCartStore((s) => s.addItem);
  const requireAuth = useAuthGate();
  const [isAdding, setIsAdding] = useState(false);

  if (products.length === 0) return null;

  const handleShopSet = () => {
    requireAuth(() => {
      setIsAdding(true);
      products.forEach((product) => addItem(product.id, 1));
      router.push("/grappstore/cart");
    });
  };

  return (
    <div className="mx-3 md:mx-5 mb-5 bg-white border border-gl-border rounded-xl p-3">
      <div className="flex gap-2 mb-3">
        {products.slice(0, 3).map((product) => {
          const imageSrc = productIllustrationByProductId[product.id];
          return (
            <div key={product.id} className="relative flex-1 aspect-square rounded-lg overflow-hidden bg-white">
              {imageSrc ? (
                <Image src={imageSrc} alt={product.name} fill sizes="120px" className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 gl-shimmer" />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-[14px] font-semibold text-gl-text mb-0.5">{look.title}</div>
      <div className="text-[11px] text-gl-text-secondary mb-3">
        {look.blurb} — {products.length} pieces
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-gl-text">{formatGHS(total)}</span>
        <button
          onClick={handleShopSet}
          disabled={isAdding}
          className="flex items-center gap-1.5 bg-gl-brand-soft-bg text-gl-brand-soft-text text-[11px] font-semibold px-3 py-1.5 rounded-md transition-transform duration-150 ease-out active:scale-95 disabled:opacity-60"
        >
          <IconShoppingBag size={13} />
          {isAdding ? "Added ✓" : "Shop set"}
        </button>
      </div>
    </div>
  );
}
