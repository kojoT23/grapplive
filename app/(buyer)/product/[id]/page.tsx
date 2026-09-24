"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconRosetteDiscountCheck,
  IconMessageCircle2,
  IconBrandWhatsapp,
  IconBrandTiktok,
  IconBrandInstagram,
  IconBrandTelegram,
  IconShieldCheck,
  IconX,
  IconMinus,
  IconPlus,
  IconPlayerPlayFilled,
  IconCheck,
} from "@tabler/icons-react";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import { getProductById } from "@/lib/mock-data/catalog";
import { useCartStore } from "@/lib/store/useCartStore";
import { ProductReviews } from "@/components/ui/ProductReviews";
import { BuyerRequestSheet } from "@/components/ui/BuyerRequestSheet";

function isLightColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const addToCart = useCartStore((s) => s.addItem);
  const requireAuth = useAuthGate();
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [showAskSheet, setShowAskSheet] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const product = getProductById(params.id);

  if (!product) {
    return (
      <div className="px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-4 active:opacity-60 transition-opacity"
        >
          <IconArrowLeft size={14} /> Back
        </button>
        <div className="text-[12px] text-gl-text-secondary">
          This product isn&apos;t available anymore.
        </div>
      </div>
    );
  }

  const handleAddToCart = () => requireAuth(() => addToCart(product.id, quantity));

  const handleCheckout = () =>
    requireAuth(() => {
      addToCart(product.id, quantity);
      router.push("/checkout");
    });

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () => setQuantity((q) => q + 1);

  const handleGalleryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImage(index);
  };

  const imageCount = product.imageCount ?? 1;
  const images = Array.from({ length: imageCount }, (_, i) => i);
  const selectedColor = product.colorVariants?.[selectedColorIndex];

  const whatsappNumber = product.sellerSocials.whatsappNumber;
  const signalNumber = product.sellerSocials.signalNumber;
  const telegramHandle = product.sellerSocials.telegramHandle;
  const tiktokHandle = product.sellerSocials.tiktokHandle;
  const instagramHandle = product.sellerSocials.instagramHandle;

  const callMessage = "Hi, I'd like to request a video call about " + product.name + " before I buy.";
  const whatsappCallUrl = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(callMessage);

  const whatsappUrl = "https://wa.me/" + whatsappNumber;
  const signalUrl = "https://signal.me/#p/" + signalNumber;
  const telegramUrl = "https://t.me/" + telegramHandle;
  const tiktokUrl = "https://www.tiktok.com/@" + tiktokHandle;
  const instagramUrl = "https://www.instagram.com/" + instagramHandle;

  const hasAnySocial = Boolean(
    whatsappNumber || signalNumber || telegramHandle || tiktokHandle || instagramHandle
  );
  const hasAnyCallOption = hasAnySocial;

  return (
    <div className="pb-4">
      <div className="relative">
        <div
          onScroll={handleGalleryScroll}
          className="h-[220px] flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
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
        <button
          onClick={() => router.back()}
          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center active:bg-black/50 transition-colors"
        >
          <IconArrowLeft size={14} className="text-white" />
        </button>
        {product.discountPercent && (
          <div className="absolute top-2 right-2 bg-gl-brand text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
            -{product.discountPercent}%
          </div>
        )}
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

      <div className="px-3 md:px-5 pt-2.5">
        <div className="text-[13px] text-gl-text mb-1">{product.name}</div>
        <div className="flex items-baseline gap-1.5 mb-2.5">
          <span className="text-[18px] font-semibold text-gl-text">GHS {product.priceGHS}</span>
          {product.originalPriceGHS && (
            <span className="text-[11px] text-gl-text-muted line-through">
              GHS {product.originalPriceGHS}
            </span>
          )}
        </div>

        {product.returnPolicyDays ? (
          <div className="flex items-center gap-1 text-[10px] text-gl-text-secondary mb-2.5">
            <IconShieldCheck size={12} className="text-gl-green" />
            {product.returnPolicyDays}-day returns
          </div>
        ) : null}

        {product.colorVariants && product.colorVariants.length > 0 && (
          <div className="mb-3">
            <div className="text-[11px] text-gl-text-secondary mb-1.5">
              Color: <span className="text-gl-text font-semibold">{selectedColor?.label}</span>
            </div>
            <div className="flex gap-2">
              {product.colorVariants.map((variant, i) => {
                const isSelected = i === selectedColorIndex;
                const showDarkCheck = isLightColor(variant.hex);
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
                      <IconCheck size={14} className={showDarkCheck ? "text-gl-text" : "text-white"} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Link
          href={"/seller/" + product.sellerId}
          className="flex items-center gap-2 p-2 bg-gl-bg-muted rounded-lg mb-2 transition-colors active:bg-gl-border"
        >
          <div className="w-[30px] h-[30px] rounded-full shrink-0 overflow-hidden gl-shimmer" />
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-gl-text flex items-center gap-1">
              {product.sellerName}
              <IconRosetteDiscountCheck size={12} className="text-gl-brand" />
            </div>
            <div className="text-[9px] text-gl-text-secondary">
              {product.sellerOrdersCompleted} orders completed, replies in {product.sellerReplyTime}
            </div>
          </div>
        </Link>

        <button
          onClick={() => setShowContactSheet(true)}
          className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[12px] font-semibold mb-2.5 flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
        >
          <IconMessageCircle2 size={13} />
          Contact seller
        </button>

        <div className="flex items-center justify-between border border-gl-border rounded-lg px-3 py-2.5 mb-2.5">
          <span className="text-[11px] font-semibold text-gl-text">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="w-7 h-7 rounded-full border border-gl-border-strong flex items-center justify-center active:bg-gl-bg-muted transition-colors disabled:opacity-30"
            >
              <IconMinus size={12} />
            </button>
            <span className="text-[13px] font-semibold text-gl-text w-5 text-center">
              {quantity}
            </span>
            <button
              onClick={increaseQuantity}
              className="w-7 h-7 rounded-full border border-gl-border-strong flex items-center justify-center active:bg-gl-bg-muted transition-colors"
            >
              <IconPlus size={12} />
            </button>
          </div>
        </div>

        <ProductReviews productId={product.id} />
      </div>

      <div className="px-3 md:px-5 pt-2.5 border-t border-gl-border flex gap-2">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-white text-gl-text border-[0.5px] border-gl-border-strong rounded-lg py-2.5 text-[12px] font-semibold active:bg-gl-bg-muted transition-colors"
        >
          Add to cart
        </button>
        <button
          onClick={handleCheckout}
          className="flex-[1.4] bg-gl-brand text-white rounded-lg py-2.5 text-[12px] font-semibold active:opacity-80 transition-opacity"
        >
          Continue to checkout
        </button>
      </div>

      {showContactSheet && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full max-w-[480px] md:max-w-[380px] bg-white rounded-t-2xl md:rounded-2xl p-5 pb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[14px] font-semibold text-gl-text">Contact seller</h2>
              <button onClick={() => setShowContactSheet(false)} className="active:opacity-60 transition-opacity">
                <IconX size={16} className="text-gl-text-secondary" />
              </button>
            </div>
            <p className="text-[11px] text-gl-text-secondary mb-4">
              Reach out to {product.sellerName} about {product.name}.
            </p>

            <button
              onClick={() => {
                setShowContactSheet(false);
                setShowAskSheet(true);
              }}
              className="w-full flex items-center gap-2.5 border border-gl-border rounded-lg p-3 mb-2 active:bg-gl-bg-muted transition-colors"
            >
              <IconMessageCircle2 size={18} className="text-gl-brand" />
              <div className="text-left">
                <div className="text-[12px] font-semibold text-gl-text">Ask a question</div>
                <div className="text-[9px] text-gl-text-secondary">Send a message inside GRAPPlive</div>
              </div>
            </button>

            {hasAnyCallOption && (
              <>
                <div className="text-[10px] font-semibold text-gl-text-secondary mt-3 mb-2">
                  Or request a video call
                </div>

                {whatsappNumber ? (
                  <Link
                    href={whatsappCallUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowContactSheet(false)}
                    className="w-full flex items-center gap-2.5 border border-gl-border rounded-lg p-3 mb-2 active:bg-gl-bg-muted transition-colors"
                  >
                    <IconBrandWhatsapp size={18} className="text-gl-green" />
                    <div className="text-left">
                      <div className="text-[12px] font-semibold text-gl-text">WhatsApp</div>
                      <div className="text-[9px] text-gl-text-secondary">Opens a chat with your request pre-filled</div>
                    </div>
                  </Link>
                ) : null}

                {signalNumber ? (
                  <Link
                    href={signalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowContactSheet(false)}
                    className="w-full flex items-center gap-2.5 border border-gl-border rounded-lg p-3 mb-2 active:bg-gl-bg-muted transition-colors"
                  >
                    <IconShieldCheck size={18} className="text-gl-navy" />
                    <div className="text-left">
                      <div className="text-[12px] font-semibold text-gl-text">Signal</div>
                      <div className="text-[9px] text-gl-text-secondary">Opens a chat — start the call there</div>
                    </div>
                  </Link>
                ) : null}

                {telegramHandle ? (
                  <Link
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowContactSheet(false)}
                    className="w-full flex items-center gap-2.5 border border-gl-border rounded-lg p-3 mb-2 active:bg-gl-bg-muted transition-colors"
                  >
                    <IconBrandTelegram size={18} className="text-[#229ED9]" />
                    <div className="text-left">
                      <div className="text-[12px] font-semibold text-gl-text">Telegram</div>
                      <div className="text-[9px] text-gl-text-secondary">Opens a chat — start the call there</div>
                    </div>
                  </Link>
                ) : null}

                {tiktokHandle ? (
                  <Link
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowContactSheet(false)}
                    className="w-full flex items-center gap-2.5 border border-gl-border rounded-lg p-3 mb-2 active:bg-gl-bg-muted transition-colors"
                  >
                    <IconBrandTiktok size={18} className="text-gl-text" />
                    <div className="text-left">
                      <div className="text-[12px] font-semibold text-gl-text">TikTok</div>
                      <div className="text-[9px] text-gl-text-secondary">Opens their profile — message them there</div>
                    </div>
                  </Link>
                ) : null}

                {instagramHandle ? (
                  <Link
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowContactSheet(false)}
                    className="w-full flex items-center gap-2.5 border border-gl-border rounded-lg p-3 active:bg-gl-bg-muted transition-colors"
                  >
                    <IconBrandInstagram size={18} className="text-gl-brand" />
                    <div className="text-left">
                      <div className="text-[12px] font-semibold text-gl-text">Instagram</div>
                      <div className="text-[9px] text-gl-text-secondary">Opens their profile — message them there</div>
                    </div>
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}

      <BuyerRequestSheet
        isOpen={showAskSheet}
        onClose={() => setShowAskSheet(false)}
        productId={product.id}
        productName={product.name}
        sellerId={product.sellerId}
      />
    </div>
  );
}
