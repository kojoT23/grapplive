"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { useCartStore } from "@/lib/store/useCartStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { getProductById } from "@/lib/mock-data/catalog";

type PaymentMethod = "instant_confirm" | "direct_momo";

const INSTANT_CONFIRM_FEE_GHS = 2;

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const [method, setMethod] = useState<PaymentMethod>("instant_confirm");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return product ? sum + product.priceGHS * item.quantity : sum;
  }, 0);

  if (subtotal === 0) {
    return (
      <div className="px-3 md:px-5 pt-4">
        <div className="text-[12px] text-gl-text-secondary mb-3">
          Your cart is empty — nothing to check out.
        </div>
        <button
          onClick={() => router.push("/home")}
          className="bg-gl-brand text-white text-[11px] font-semibold px-4 py-2 rounded-lg active:opacity-80 transition-opacity"
        >
          Browse products
        </button>
      </div>
    );
  }

  const total = method === "instant_confirm" ? subtotal + INSTANT_CONFIRM_FEE_GHS : subtotal;

  const handlePlaceOrder = () => {
    setIsPlacingOrder(true);
    setTimeout(() => {
      items.forEach((item) => {
        const product = getProductById(item.productId);
        if (!product) return;
        placeOrder({
          productId: product.id,
          itemName: product.name,
          quantity: item.quantity,
          priceGHS: product.priceGHS,
          sellerName: product.sellerName,
          paymentMethod: method,
        });
      });
      clearCart();
      router.push("/checkout/confirmation");
    }, 500);
  };

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-5">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={16} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">How do you want to pay?</h1>
      </div>
      <p className="text-[10px] text-gl-text-secondary mb-4">
        Both go through MoMo — pick what matters more to you
      </p>

      <button
        onClick={() => setMethod("instant_confirm")}
        className={`w-full text-left border rounded-lg p-3 mb-2.5 transition-colors ${
          method === "instant_confirm" ? "border-[1.5px] border-gl-brand" : "border-gl-border-strong"
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className="text-[12px] font-semibold text-gl-text">Instant Confirm</span>
          <span className="bg-gl-brand-soft-bg text-gl-brand-soft-text text-[8px] font-semibold px-1.5 py-0.5 rounded">
            RECOMMENDED
          </span>
        </div>
        <p className="text-[10px] text-gl-text-secondary mb-1.5">
          Approve with your MoMo PIN — order starts right away, no waiting on the seller
        </p>
        <div className="text-[10px] font-semibold text-gl-text">
          +{formatGHS(INSTANT_CONFIRM_FEE_GHS)} fee
        </div>
      </button>

      <button
        onClick={() => setMethod("direct_momo")}
        className={`w-full text-left border rounded-lg p-3 mb-4 transition-colors ${
          method === "direct_momo" ? "border-[1.5px] border-gl-brand" : "border-gl-border-strong"
        }`}
      >
        <div className="text-[12px] font-semibold text-gl-text mb-1">Direct MoMo</div>
        <p className="text-[10px] text-gl-text-secondary mb-1.5">
          Send payment yourself, then confirm — seller checks and confirms manually, may take a
          few hours
        </p>
        <div className="text-[10px] font-semibold text-gl-text">No fee</div>
      </button>

      <button
        onClick={handlePlaceOrder}
        disabled={isPlacingOrder}
        className="w-full bg-gl-brand disabled:opacity-60 text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-80 transition-opacity"
      >
        {isPlacingOrder ? "Placing order…" : `Continue — ${formatGHS(total)}`}
      </button>
    </div>
  );
}
