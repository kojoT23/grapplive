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
  IconChevronDown,
  IconBox,
  IconPlayerPlayFilled,
  IconCheck,
} from "@tabler/icons-react";
import { getOfficialProductById } from "@/lib/mock-data/officialCatalog";
import { useGrappStoreCartStore } from "@/lib/store/useGrappStoreCartStore";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import { ProductReviews } from "@/components/ui/ProductReviews";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

function isLightColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

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
  const descriptionLines = product.description?.split("\n\n") ?? [];
  const hasLongDescription = descriptionLines.length > 1;
  const selectedColor = product.colorVariants?.[selectedColorIndex];

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
        {images.map((i) => {
          const isVideo = product.videoSlideIndex === i;
          return (
            <div key={i} className="w-full h-full shrink-0 snap-center gl-shimmer relative">
              {isVideo && (
                <>
                  <span className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded">
                    VIDEO
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/45 flex items-center justify-center">
                      <IconPlayerPlayFilled size={18} className="text-white ml-0.5" />
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
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

        <div className="flex items-center gap-3 mb-2">
          {product.rating != null && (
            <div className="flex items-center gap-1">
              <IconStarFilled size={12} className="text-gl-amber" />
              <span className="text-[11px] text-gl-text-secondary">
                {product.rating.toFixed(1)}
                {product.reviewCount ? ` (${product.reviewCount} reviews)` : ""}
              </span>
            </div>
          )}
          {product.stockCount != null && (
            <span className="text-[10px] text-gl-amber font-medium">
              Only {product.stockCount} left
            </span>
          )}
        </div>

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

        {product.colorVariants && product.colorVariants.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] text-gl-text-secondary mb-1.5">
              Color: <span className="text-gl-text font-semibold">{selectedColor?.label}</span>
            </div>
            <div className="flex gap-2">
              {product.colorVariants.map((variant, i) => {
                const isSelected = i === selectedColorIndex;
                const showCheckDark = isLightColor(variant.hex);
                return (
                  <button
                    key={variant.label}
                    onClick={() => setSelectedColorIndex(i)}
                    aria-label={variant.label}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                      isSelected ? "ring-2 ring-offset-2 ring-gl-brand" : ""
                    }`}
                    style={{ backgroundColor: variant.hex }}
                  >
                    {isSelected && (
                      <IconCheck
                        size={14}
                        className={showCheckDark ? "text-gl-text" : "text-white"}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="border border-gl-border rounded-lg divide-y divide-gl-bg-muted mb-4">
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

        {product.description && (
          <div className="mb-4">
            <h2 className="text-[12px] font-semibold text-gl-text mb-1.5">Product description</h2>
            <p
              className={`text-[11px] text-gl-text-secondary leading-relaxed whitespace-pre-line ${
                !descriptionExpanded && hasLongDescription ? "line-clamp-2" : ""
              }`}
            >
              {descriptionLines.join("\n\n")}
            </p>
            {hasLongDescription && (
              <button
                onClick={() => setDescriptionExpanded((v) => !v)}
                className="flex items-center gap-0.5 text-[10px] font-semibold text-gl-brand mt-1 active:opacity-70 transition-opacity"
              >
                {descriptionExpanded ? "Show less" : "See all"}
                <IconChevronDown
                  size={12}
                  className={`transition-transform ${descriptionExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        )}

        {product.specs && product.specs.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[12px] font-semibold text-gl-text mb-1.5">Specifications</h2>
            <div className="border border-gl-border rounded-lg overflow-hidden divide-y divide-gl-bg-muted">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex px-3 py-2">
                  <span className="text-[10px] text-gl-text-secondary w-[38%] shrink-0">{spec.label}</span>
                  <span className="text-[10px] text-gl-text flex-1">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {product.boxContents && product.boxContents.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[12px] font-semibold text-gl-text mb-1.5">What&apos;s in the box</h2>
            <div className="flex flex-col gap-1.5">
              {product.boxContents.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <IconBox size={13} className="text-gl-text-muted shrink-0" />
                  <span className="text-[10px] text-gl-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <ProductReviews productId={product.id} />

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
