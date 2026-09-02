"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconMinus, IconPlus, IconTrash } from "@tabler/icons-react";
import { useCartStore } from "@/lib/store/useCartStore";
import { getProductById } from "@/lib/mock-data/catalog";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineItems = items
    .map((item) => {
      const product = getProductById(item.productId);
      return product ? { ...item, product } : null;
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const total = lineItems.reduce((sum, i) => sum + i.product.priceGHS * i.quantity, 0);

  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-2">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={16} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">Cart</h1>
      </div>

      {lineItems.length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center">
          <div className="text-[12px] text-gl-text-secondary mb-3">Your cart is empty</div>
          <Link
            href="/home"
            className="inline-block bg-gl-brand text-white text-[11px] font-semibold px-4 py-2 rounded-lg active:opacity-80 transition-opacity"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div className="px-3 md:px-5">
            {lineItems.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-2.5 py-2.5 border-b border-gl-bg-muted last:border-b-0"
              >
                <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden gl-shimmer" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gl-text truncate">{product.name}</div>
                  <div className="text-[11px] font-semibold text-gl-text mb-1.5">
                    {formatGHS(product.priceGHS)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-6 h-6 rounded-full border border-gl-border-strong flex items-center justify-center active:bg-gl-bg-muted transition-colors"
                    >
                      <IconMinus size={11} />
                    </button>
                    <span className="text-[11px] text-gl-text w-4 text-center">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-6 h-6 rounded-full border border-gl-border-strong flex items-center justify-center active:bg-gl-bg-muted transition-colors"
                    >
                      <IconPlus size={11} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-gl-text-muted active:text-gl-red transition-colors shrink-0"
                >
                  <IconTrash size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="px-3 md:px-5 pt-3 mt-2 border-t border-gl-border">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-gl-text-secondary">Total</span>
              <span className="text-[16px] font-semibold text-gl-text">{formatGHS(total)}</span>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-80 transition-opacity"
            >
              Continue to checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
