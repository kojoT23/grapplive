"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { useCartStore } from "@/lib/store/useCartStore";
import { useOrdersStore, type NewOrderGroupInput } from "@/lib/store/useOrdersStore";
import { getProductById } from "@/lib/mock-data/catalog";
import type { PaymentMethod } from "@/lib/mock-data/orders";

const INSTANT_CONFIRM_FEE_GHS = 2;

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const [method, setMethod] = useState<PaymentMethod>("instant_confirm");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Resolved once, reused both for the on-screen summary and for building
  // the OrderGroups on submit — one source of truth instead of two
  // separate derivations of the same cart.
  const lineItems = items
    .map((item) => {
      const product = getProductById(item.productId);
      return product ? { item, product } : null;
    })
    .filter((row): row is { item: (typeof items)[number]; product: NonNullable<ReturnType<typeof getProductById>> } =>
      Boolean(row)
    );

  const subtotal = lineItems.reduce((sum, { item, product }) => sum + product.priceGHS * item.quantity, 0);

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

  // Grouped by seller purely for the on-screen summary — with a
  // multi-seller cart, buyers should see which items ship from which
  // seller before paying, which also previews the same split the order
  // will actually settle into.
  const groupedForDisplay = lineItems.reduce<
    Record<string, { sellerName: string; rows: { item: (typeof items)[number]; product: NonNullable<ReturnType<typeof getProductById>> }[] }>
  >((acc, row) => {
    const key = row.product.sellerId;
    if (!acc[key]) acc[key] = { sellerName: row.product.sellerName, rows: [] };
    acc[key].rows.push(row);
    return acc;
  }, {});

  const handlePlaceOrder = () => {
    setIsPlacingOrder(true);
    setTimeout(() => {
      // Group cart items by seller — each seller becomes one OrderGroup
      // within a single buyer-facing Order (unified cart, split settlement).
      const groupsBySeller = new Map<string, NewOrderGroupInput>();

      lineItems.forEach(({ item, product }) => {
        const orderItem = {
          productId: product.id,
          itemName: product.name,
          quantity: item.quantity,
          priceGHS: product.priceGHS,
        };

        const existing = groupsBySeller.get(product.sellerId);
        if (existing) {
          existing.items.push(orderItem);
        } else {
          groupsBySeller.set(product.sellerId, {
            sellerId: product.sellerId,
            sellerName: product.sellerName,
            items: [orderItem],
            paymentMethod: method,
          });
        }
      });

      placeOrder(Array.from(groupsBySeller.values()));
      clearCart();
      router.push("/checkout/confirmation");
    }, 500);
  };

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-5">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={16} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">How do you want to pay?</h1>
      </div>

      {/* Real item list before payment, grouped by seller so a multi-seller
          cart is legible — this is the moment someone commits real MoMo
          money, and showing exactly what's being paid for (and to whom)
          matters more here than almost anywhere else in the app. */}
      <div className="border border-gl-border rounded-lg p-3 mb-4">
        <h2 className="text-[11px] font-semibold text-gl-text mb-2">Order summary</h2>
        {Object.entries(groupedForDisplay).map(([sellerId, group], groupIdx) => (
          <div key={sellerId} className={groupIdx > 0 ? "mt-3 pt-3 border-t border-gl-bg-muted" : ""}>
            <div className="text-[9px] font-semibold text-gl-text-secondary uppercase tracking-wide mb-1.5">
              From {group.sellerName}
            </div>
            <div className="divide-y divide-gl-bg-muted">
              {group.rows.map(({ item, product }) => (
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
        ))}
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

      {/* Subtotal/fee/total breakdown, reactive to the payment method
          chosen above — previously the fee only appeared as a single line
          inside the Instant Confirm card, with no final breakdown showing
          how it rolled into the total before the pay button. */}
      <div className="border border-gl-border rounded-lg p-3 mb-4">
        <div className="flex justify-between text-[11px] text-gl-text-secondary mb-1">
          <span>Subtotal</span>
          <span>{formatGHS(subtotal)}</span>
        </div>
        {method === "instant_confirm" && (
          <div className="flex justify-between text-[11px] text-gl-text-secondary mb-1">
            <span>Instant Confirm fee</span>
            <span>{formatGHS(INSTANT_CONFIRM_FEE_GHS)}</span>
          </div>
        )}
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
        {isPlacingOrder ? "Placing order…" : `Continue — ${formatGHS(total)}`}
      </button>
    </div>
  );
}
