"use client";

import { useRouter } from "next/navigation";
import { IconArrowLeft, IconMinus, IconPlus, IconTrash } from "@tabler/icons-react";
import { useGrappStoreCartStore } from "@/lib/store/useGrappStoreCartStore";
import { getOfficialProductById } from "@/lib/mock-data/officialCatalog";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function GrappStoreCartPage() {
  const router = useRouter();
  const items = useGrappStoreCartStore((s) => s.items);
  const updateQuantity = useGrappStoreCartStore((s) => s.updateQuantity);
  const removeItem = useGrappStoreCartStore((s) => s.removeItem);

  const rows = items
    .map((item) => ({ item, product: getOfficialProductById(item.productId) }))
    .filter((row) => row.product);

  const total = rows.reduce((sum, { item, product }) => sum + (product?.priceGHS ?? 0) * item.quantity, 0);

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-36">
      <div className="flex items-center gap-2 mb-3">
        {/* Was a hardcoded Link back to /grappstore regardless of where the
            person came from — the marketplace cart's back arrow uses
            router.back() instead, so two "back" buttons in the same app
            behaved differently. Matched to router.back() for consistency. */}
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={18} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">Your GrappStore cart</h1>
      </div>

      {rows.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-[11px] text-gl-text-secondary mb-3">Your GrappStore cart is empty.</div>
          {/* Was text-only — every other empty state in the app (marketplace
              cart, GrappStore's own empty checkout) has a CTA to act on. */}
          <button
            onClick={() => router.push("/grappstore")}
            className="inline-block bg-gl-brand text-white text-[11px] font-semibold px-4 py-2 rounded-lg active:opacity-80 transition-opacity"
          >
            Browse GrappStore
          </button>
        </div>
      ) : (
        rows.map(({ item, product }) => (
          <div key={item.productId} className="flex items-center gap-3 py-3 border-b border-gl-bg-muted last:border-b-0">
            <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden gl-shimmer" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-gl-text truncate">{product?.name}</div>
              <div className="text-[11px] font-semibold text-gl-text mt-0.5">
                {formatGHS(product?.priceGHS ?? 0)}
              </div>
              {/* Quantity controls previously had aria-labels but no defined
                  tap area at all (bare icons). Bumped to a real ~32px box —
                  matched to the marketplace cart's equivalent buttons, which
                  had a tap area but no aria-labels. Same pattern, both files. */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 border border-gl-border-strong rounded-lg px-1 py-0.5">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gl-bg-muted transition-colors"
                  >
                    <IconMinus size={14} className="text-gl-text" />
                  </button>
                  <span className="text-[10px] font-semibold text-gl-text w-3 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gl-bg-muted transition-colors"
                  >
                    <IconPlus size={14} className="text-gl-text" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gl-text-muted active:bg-gl-bg-muted active:text-gl-red transition-colors"
                  aria-label="Remove item"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {rows.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-20 max-w-[480px] md:max-w-[720px] mx-auto bg-white border-t border-gl-border px-3 md:px-5 py-2.5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gl-text-secondary">Total</span>
            <span className="text-[14px] font-bold text-gl-text">{formatGHS(total)}</span>
          </div>
          <button
            onClick={() => router.push("/grappstore/checkout")}
            className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-80 transition-opacity"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
