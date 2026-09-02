"use client";

import Link from "next/link";
import { IconArrowLeft, IconChevronRight } from "@tabler/icons-react";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import type { OrderStatus } from "@/lib/mock-data/orders";

const statusLabel: Record<OrderStatus, { text: string; className: string }> = {
  awaiting_confirmation: { text: "Awaiting confirmation", className: "text-gl-amber" },
  ready_to_pack: { text: "Confirmed", className: "text-gl-amber" },
  preparing: { text: "Preparing", className: "text-gl-amber" },
  out_for_delivery: { text: "Out for delivery", className: "text-gl-brand" },
  delivered: { text: "Delivered", className: "text-gl-green" },
};

export default function BuyerOrdersPage() {
  const orders = useOrdersStore((s) => s.orders);

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/account" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">My orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center text-[11px] text-gl-text-secondary">
          You haven&apos;t placed any orders yet.
        </div>
      ) : (
        <div className="px-3 md:px-5">
          {orders.map((order) => {
            const status = statusLabel[order.status];
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center gap-2.5 py-3 border-b border-gl-bg-muted last:border-b-0 transition-colors active:bg-gl-bg-muted"
              >
                <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden gl-shimmer" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gl-text truncate">{order.itemName}</div>
                  <div className="text-[9px] text-gl-text-secondary">{order.sellerName}</div>
                  <div className={`text-[9px] font-semibold mt-0.5 ${status.className}`}>
                    {status.text}
                  </div>
                </div>
                <IconChevronRight size={16} className="text-gl-text-muted shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
