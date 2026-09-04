"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconMinus,
  IconPlus,
  IconTruckDelivery,
  IconRotateClockwise,
  IconShieldCheck,
  IconStarFilled,
} from "@tabler/icons-react";
import { getOfficialProductById } from "@/lib/mock-data/officialCatalog";
import { useGrappStoreCartStore } from "@/lib/store/useGrappStoreCartStore";
import { useAuthGate } from "@/lib/hooks/useAuthGate";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function GrappStoreProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const product = getOfficialProductById(params.id);
  const addItem = useGrappStoreCartStore((s) => s.addItem);
  const requireAuth = useAuthGate();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  if (!product) {
    return (
      <div className="px-3 md:px-5 pt-3.5">
        <Link href="/grappstore" className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-4 active:opacity-60 transition-opacity">
          <IconArrowLeft size={14} /> Back
        </Link>
        <div className="text-[12px] text-gl-text-secondary">Product not found.</div>
      </div>
    );
  }

  const imageCount = product.imageCount ?? 1;
  const images = Array.from({ length: imageCount }, (_, i) => i);

  const handleAddToCart = () => {
    requireAuth(() => {
      addItem(product.id, quantity);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    });
  };

  const handleBuyNow = () => {
    requireAuth(() => {
      addItem(product.id, quantity);
      router.push("/grappstore/cart");
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImage(index);
  };

  return (
    <div className="pb-32">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/grappstore" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
      </div>

      <div
        onScroll={handleScroll}
        className="w-full h-72 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {images.map((i) => (
          <div key={i} className="w-full h-full shrink-0 snap-center gl-shimmer" />
        ))}
      </div>
      {imageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {images.map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeImage ? "w-4 bg-gl-brand" : "w-1.5 bg-gl-border-strong"
              }`}
            />
          ))}
        </div>
      )}

      <div className="px-3 md:px-5 pt-3">
        <div className="text-[10px] font-semibold text-gl-brand mb-1">Sold by GrappStore</div>
        <h1 className="text-[15px] font-semibold text-gl-text mb-1.5">{product.name}</h1>

        {product.rating != null && (
          <div className="flex items-center gap-1 mb-2">
            <IconStarFilled size={12} className="text-gl-amber" />
            <span className="text-[11px] text-gl-text-secondary">
              {product.rating.toFixed(1)}
              {product.reviewCount ? ` (${product.reviewCount} reviews)` : ""}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[16px] font-bold text-gl-text">{formatGHS(product.priceGHS)}</span>
          {product.originalPriceGHS && (
            <span className="text-[11px] text-gl-text-muted line-through">
              {formatGHS(product.originalPriceGHS)}
            </span>
          )}
          {product.discountPercent && (
            <span className="text-[9px] font-semibold text-gl-brand-soft-text bg-gl-brand-soft-bg px-1.5 py-0.5 rounded">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        <div className="border border-gl-border rounded-lg divide-y divide-gl-bg-muted mb-5">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <IconTruckDelivery size={16} className="text-gl-green shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gl-text">Delivery</div>
              <div className="text-[10px] text-gl-text-secondary">
                {product.deliveryEstimate ?? "3–5 days"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <IconRotateClockwise size={16} className="text-gl-brand shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gl-text">Returns</div>
              <div className="text-[10px] text-gl-text-secondary">
                {product.returnPolicyDays
                  ? `Free return within ${product.returnPolicyDays} days`
                  : "Contact support for return eligibility"}
              </div>
            </div>
          </div>
          {product.warranty && (
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <IconShieldCheck size={16} className="text-gl-navy shrink-0" />
              <div>
                <div className="text-[10px] font-semibold text-gl-text">Warranty</div>
                <div className="text-[10px] text-gl-text-secondary">{product.warranty}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-[11px] text-gl-text-secondary">Quantity</span>
          <div className="flex items-center gap-3 border border-gl-border-strong rounded-lg px-2 py-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="active:opacity-60 transition-opacity"
              aria-label="Decrease quantity"
            >
              <IconMinus size={14} className="text-gl-text" />
            </button>
            <span className="text-[12px] font-semibold text-gl-text w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="active:opacity-60 transition-opacity"
              aria-label="Increase quantity"
            >
              <IconPlus size={14} className="text-gl-text" />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-20 max-w-[480px] md:max-w-[720px] mx-auto bg-white border-t border-gl-border px-3 md:px-5 py-2.5 flex gap-2">
        <button
          onClick={handleAddToCart}
          className="flex-1 border border-gl-brand text-gl-brand rounded-lg py-2.5 text-[12px] font-semibold active:bg-gl-brand-soft-bg transition-colors"
        >
          {justAdded ? "Added ✓" : "Add to cart"}
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 bg-gl-brand text-white rounded-lg py-2.5 text-[12px] font-semibold active:opacity-80 transition-opacity"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
