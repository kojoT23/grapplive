"use client";

import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { flattenGroups, groupTotal, type OrderStatus } from "@/lib/mock-data/orders";

const statusLabel: Record<OrderStatus, { text: string; className: string }> = {
  awaiting_confirmation: { text: "Awaiting confirmation", className: "text-gl-amber" },
  ready_to_pack: { text: "Confirmed", className: "text-gl-amber" },
  preparing: { text: "Preparing", className: "text-gl-amber" },
  out_for_delivery: { text: "Out for delivery", className: "text-gl-brand" },
  delivered: { text: "Delivered", className: "text-gl-green" },
};

export default function GrappStoreOrdersPage() {
  const orders = useOrdersStore((s) => s.orders);
  // Buyer's own order history, filtered to GrappStore's merchant record only —
  // separate from the marketplace order groups shown at /account/orders.
  const groups = flattenGroups(orders).filter((g) => g.sellerId === "grapplive-official");

  return (
    <div>
      <h1 className="px-3 md:px-5 pt-3.5 pb-3 text-[14px] font-semibold text-gl-text">
        Your GrappStore orders
      </h1>

      {groups.length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center text-[11px] text-gl-text-secondary">
          You haven&apos;t ordered from GrappStore yet.
        </div>
      ) : (
        <div className="px-3 md:px-5">
          {groups.map((group) => {
            const status = statusLabel[group.status];
            const itemLabel =
              group.items.length === 1
                ? group.items[0].itemName
                : `${group.items[0].itemName} +${group.items.length - 1} more`;
            return (
              <Link
                key={group.id}
                href={`/account/orders/${group.id}`}
                className="flex items-center gap-2.5 py-3 border-b border-gl-bg-muted last:border-b-0 transition-colors active:bg-gl-bg-muted"
              >
                <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden gl-shimmer" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gl-text truncate">{itemLabel}</div>
                  <div className="text-[9px] text-gl-text-secondary">{formatGHSInline(groupTotal(group))}</div>
                  <div className={`text-[9px] font-semibold mt-0.5 ${status.className}`}>{status.text}</div>
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

function formatGHSInline(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}
