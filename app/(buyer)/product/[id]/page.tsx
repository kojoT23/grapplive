"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconRosetteDiscountCheck,
  IconVideo,
  IconBrandWhatsapp,
  IconBrandTiktok,
  IconBrandInstagram,
  IconBrandTelegram,
  IconShieldCheck,
  IconX,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import { getProductById } from "@/lib/mock-data/catalog";
import { useCartStore } from "@/lib/store/useCartStore";

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const addToCart = useCartStore((s) => s.addItem);
  const requireAuth = useAuthGate();
  const [showCallPicker, setShowCallPicker] = useState(false);
  const [quantity, setQuantity] = useState(1);

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

  const handleVideoCallRequest = () => requireAuth(() => setShowCallPicker(true));

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () => setQuantity((q) => q + 1);

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
      <div className="h-[150px] relative gl-shimmer">
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
          onClick={handleVideoCallRequest}
          disabled={!hasAnyCallOption}
          className="w-full bg-white text-gl-text border border-[#2C2C2A] rounded-lg py-2.5 text-[12px] font-semibold mb-2 flex items-center justify-center gap-1.5 active:bg-gl-bg-muted transition-colors disabled:opacity-40"
        >
          <IconVideo size={13} />
          Request video call before you buy
        </button>

        {hasAnySocial && (
          <div className="flex gap-1.5 mb-2.5 flex-wrap">
            {whatsappNumber ? (
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[60px] text-center border border-gl-bg-placeholder rounded-md py-1.5 text-[9px] text-gl-text-secondary active:bg-gl-bg-muted transition-colors"
              >
                <IconBrandWhatsapp size={14} className="mx-auto mb-0.5" />
                WhatsApp
              </Link>
            ) : null}
            {signalNumber ? (
              <Link
                href={signalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[60px] text-center border border-gl-bg-placeholder rounded-md py-1.5 text-[9px] text-gl-text-secondary active:bg-gl-bg-muted transition-colors"
              >
                <IconShieldCheck size={14} className="mx-auto mb-0.5" />
                Signal
              </Link>
            ) : null}
            {telegramHandle ? (
              <Link
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[60px] text-center border border-gl-bg-placeholder rounded-md py-1.5 text-[9px] text-gl-text-secondary active:bg-gl-bg-muted transition-colors"
              >
                <IconBrandTelegram size={14} className="mx-auto mb-0.5" />
                Telegram
              </Link>
            ) : null}
            {tiktokHandle ? (
              <Link
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[60px] text-center border border-gl-bg-placeholder rounded-md py-1.5 text-[9px] text-gl-text-secondary active:bg-gl-bg-muted transition-colors"
              >
                <IconBrandTiktok size={14} className="mx-auto mb-0.5" />
                TikTok
              </Link>
            ) : null}
            {instagramHandle ? (
              <Link
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[60px] text-center border border-gl-bg-placeholder rounded-md py-1.5 text-[9px] text-gl-text-secondary active:bg-gl-bg-muted transition-colors"
              >
                <IconBrandInstagram size={14} className="mx-auto mb-0.5" />
                Instagram
              </Link>
            ) : null}
          </div>
        )}

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

      {showCallPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full max-w-[480px] md:max-w-[380px] bg-white rounded-t-2xl md:rounded-2xl p-5 pb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[14px] font-semibold text-gl-text">Request a video call</h2>
              <button onClick={() => setShowCallPicker(false)} className="active:opacity-60 transition-opacity">
                <IconX size={16} className="text-gl-text-secondary" />
              </button>
            </div>
            <p className="text-[11px] text-gl-text-secondary mb-4">
              Choose how you&apos;d like to reach {product.sellerName}. Video calls happen inside
              that app, not in GRAPPlive.
            </p>

            {whatsappNumber ? (
              <Link
                href={whatsappCallUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowCallPicker(false)}
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
                onClick={() => setShowCallPicker(false)}
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
                onClick={() => setShowCallPicker(false)}
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
                onClick={() => setShowCallPicker(false)}
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
                onClick={() => setShowCallPicker(false)}
                className="w-full flex items-center gap-2.5 border border-gl-border rounded-lg p-3 active:bg-gl-bg-muted transition-colors"
              >
                <IconBrandInstagram size={18} className="text-gl-brand" />
                <div className="text-left">
                  <div className="text-[12px] font-semibold text-gl-text">Instagram</div>
                  <div className="text-[9px] text-gl-text-secondary">Opens their profile — message them there</div>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
