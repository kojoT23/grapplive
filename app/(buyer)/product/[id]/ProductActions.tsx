"use client";

import { useRouter } from "next/navigation";
import { IconVideo, IconBrandWhatsapp, IconBrandTiktok, IconBrandInstagram } from "@tabler/icons-react";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import { useCartStore } from "@/lib/store/useCartStore";

export function ProductActions({ productId }: { productId: string }) {
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addItem);
  const requireAuth = useAuthGate();

  const handleAddToCart = () => requireAuth(() => addToCart(productId, 1));
  const handleCheckout = () =>
    requireAuth(() => {
      addToCart(productId, 1);
      router.push("/checkout");
    });
  const handleVideoCallRequest = () => requireAuth(() => alert("Video call request sent (mock)"));

  return (
    <>
      <button
        onClick={handleVideoCallRequest}
        className="w-full bg-white text-gl-text border border-[#2C2C2A] rounded-lg py-2.5 text-[12px] font-semibold mb-2 flex items-center justify-center gap-1.5 active:bg-gl-bg-muted transition-colors"
      >
        <IconVideo size={13} />
        Request video call before you buy
      </button>

      <div className="flex gap-1.5 mb-2.5">
        <button className="flex-1 text-center border border-gl-bg-placeholder rounded-md py-1.5 text-[9px] text-gl-text-secondary active:bg-gl-bg-muted transition-colors">
          <IconBrandWhatsapp size={14} className="mx-auto mb-0.5" />
          WhatsApp
        </button>
        <button className="flex-1 text-center border border-gl-bg-placeholder rounded-md py-1.5 text-[9px] text-gl-text-secondary active:bg-gl-bg-muted transition-colors">
          <IconBrandTiktok size={14} className="mx-auto mb-0.5" />
          TikTok
        </button>
        <button className="flex-1 text-center border border-gl-bg-placeholder rounded-md py-1.5 text-[9px] text-gl-text-secondary active:bg-gl-bg-muted transition-colors">
          <IconBrandInstagram size={14} className="mx-auto mb-0.5" />
          Instagram
        </button>
      </div>

      <div className="pt-2.5 border-t border-gl-border flex gap-2 -mx-3 md:-mx-5 px-3 md:px-5">
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
    </>
  );
}
