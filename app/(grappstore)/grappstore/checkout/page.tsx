"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { useGrappStoreCartStore } from "@/lib/store/useGrappStoreCartStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { getOfficialProductById } from "@/lib/mock-data/officialCatalog";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function GrappStoreCheckoutPage() {
  const router = useRouter();
  const items = useGrappStoreCartStore((s) => s.items);
  const clearCart = useGrappStoreCartStore((s) => s.clearCart);
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const total = items.reduce((sum, item) => {
    const product = getOfficialProductById(item.productId);
    return product ? sum + product.priceGHS * item.quantity : sum;
  }, 0);

  if (total === 0) {
    return (
      <div className="px-3 md:px-5 pt-4">
        <div className="text-[12px] text-gl-text-secondary mb-3">
          Your GrappStore cart is empty — nothing to check out.
        </div>
        <button
          onClick={() => router.push("/grappstore")}
          className="bg-gl-brand text-white text-[11px] font-semibold px-4 py-2 rounded-lg active:opacity-80 transition-opacity"
        >
          Browse GrappStore
        </button>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    setIsPlacingOrder(true);
    setTimeout(() => {
      // GrappStore is merchant of record — GRAPPlive already holds the
      // payment, so this always uses instant_confirm (no seller-side
      // confirmation delay like Direct MoMo). AGENTS.md §40.5.
      const orderItems = items
        .map((item) => {
          const product = getOfficialProductById(item.productId);
          if (!product) return null;
          return { productId: product.id, itemName: product.name, quantity: item.quantity, priceGHS: product.priceGHS };
        })
        .filter((i): i is NonNullable<typeof i> => i !== null);

      placeOrder([
        {
          sellerId: "grapplive-official",
          sellerName: "GrappStore",
          items: orderItems,
          paymentMethod: "instant_confirm",
        },
      ]);

      clearCart();
      router.push("/checkout/confirmation");
    }, 500);
  };

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-5">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={16} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">Pay with MoMo</h1>
      </div>

      <p className="text-[10px] text-gl-text-secondary mb-4">
        GrappStore orders are fulfilled directly by GRAPPlive — payment is confirmed instantly, no
        waiting on a seller.
      </p>

      <div className="border border-gl-border rounded-lg p-3 mb-4">
        <div className="flex justify-between text-[11px] text-gl-text-secondary mb-1">
          <span>Subtotal</span>
          <span>{formatGHS(total)}</span>
        </div>
        <div className="flex justify-between text-[12px] font-semibold text-gl-text pt-1.5 border-t border-gl-bg-muted mt-1.5">
          <span>Total</span>
          <span>{formatGHS(total)}</span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={isPlacingOrder}
        className="w-full bg-gl-brand disabled:opacity-60 text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-80 transition-opacity"
      >
        {isPlacingOrder ? "Placing order…" : `Pay — ${formatGHS(total)}`}
      </button>
    </div>
  );
}
