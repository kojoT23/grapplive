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

  const rows = items
    .map((item) => ({ item, product: getOfficialProductById(item.productId) }))
    .filter((row): row is { item: (typeof items)[number]; product: NonNullable<typeof row.product> } =>
      Boolean(row.product)
    );

  const total = rows.reduce((sum, { item, product }) => sum + product.priceGHS * item.quantity, 0);

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
      // payment, so this always uses grapplive_fulfilled (no seller-side
      // confirmation delay, and no relation to the marketplace's paid
      // instant_confirm opt-in — they used to share a value, now they
      // don't). AGENTS.md §40.5.
      const orderItems = rows.map(({ item, product }) => ({
        productId: product.id,
        itemName: product.name,
        quantity: item.quantity,
        priceGHS: product.priceGHS,
      }));

      placeOrder([
        {
          sellerId: "grapplive-official",
          sellerName: "GrappStore",
          items: orderItems,
          paymentMethod: "grapplive_fulfilled",
        },
      ]);

      clearCart();
      router.push("/checkout/confirmation");
    }, 500);
  };

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-5">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={16} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">Pay with MoMo</h1>
      </div>

      <p className="text-[10px] text-gl-text-secondary mb-4">
        GrappStore orders are fulfilled directly by GRAPPlive — payment is confirmed instantly, no
        waiting on a seller.
      </p>

      {/* Real item list before payment, not just a total — this is the
          moment someone commits real MoMo money, and showing exactly
          what's being paid for is worth more here than almost anywhere
          else in the app. */}
      <div className="border border-gl-border rounded-lg p-3 mb-4">
        <h2 className="text-[11px] font-semibold text-gl-text mb-2">Order summary</h2>
        <div className="divide-y divide-gl-bg-muted">
          {rows.map(({ item, product }) => (
            <div key={product.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
              <div className="w-9 h-9 rounded-md shrink-0 overflow-hidden gl-shimmer" />
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <span className="text-[11px] text-gl-text-secondary truncate">
                  {product.name}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="text-[11px] font-medium text-gl-text shrink-0">
                  {formatGHS(product.priceGHS * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
