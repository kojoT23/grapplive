"use client";

import { useRouter } from "next/navigation";
import { IconCircleCheck } from "@tabler/icons-react";
import { useOrdersStore } from "@/lib/store/useOrdersStore";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function CheckoutConfirmationPage() {
  const router = useRouter();
  const hasHydrated = useOrdersStore((s) => s.hasHydrated);
  const latestOrder = useOrdersStore((s) => s.orders[0]);

  // Before hydration, the real order list is unknowable — the server has
  // no localStorage, only the fixture data. Without this guard, someone
  // landing here right after paying could briefly see the wrong order (or
  // none) flash before the client catches up.
  if (!hasHydrated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
        <div className="w-12 h-12 rounded-full gl-shimmer mb-4" />
        <div className="h-4 w-32 rounded gl-shimmer mb-2" />
        <div className="h-3 w-52 rounded gl-shimmer" />
      </div>
    );
  }

  if (!latestOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
        <h1 className="text-[15px] font-semibold text-gl-text mb-1.5">No recent order found</h1>
        <p className="text-[11px] text-gl-text-secondary mb-6">
          We couldn&apos;t find an order to confirm.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="bg-gl-brand text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg active:opacity-80 transition-opacity"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // A single Order can contain multiple OrderGroups, one per merchant. A
  // GrappStore order will only ever have one group with sellerId
  // "grapplive-official" (AGENTS.md §40.5) — checking the real data here
  // instead of trusting a URL param also means this stays correct even if
  // someone reaches this page a different way later.
  const isGrappStoreOrder = latestOrder.groups.every((g) => g.sellerId === "grapplive-official");
  const allItems = latestOrder.groups.flatMap((g) => g.items);
  const total = allItems.reduce((sum, item) => sum + item.priceGHS * item.quantity, 0);

  const heading = isGrappStoreOrder ? "Order confirmed" : "Order placed";
  const body = isGrappStoreOrder
    ? "GRAPPlive is preparing your order now — no waiting on a seller."
    : latestOrder.groups.length > 1
    ? "Each seller has been notified. You'll get updates as each part of your order moves along."
    : "The seller has been notified. You'll get updates as your order moves along.";
  const buttonLabel = isGrappStoreOrder ? "Back to GrappStore" : "Back to Home";
  const buttonHref = isGrappStoreOrder ? "/grappstore" : "/home";

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <IconCircleCheck size={48} className="text-gl-green mb-4" />
      <h1 className="text-[15px] font-semibold text-gl-text mb-1.5">{heading}</h1>
      <p className="text-[11px] text-gl-text-secondary mb-1">Order #{latestOrder.id}</p>
      <p className="text-[11px] text-gl-text-secondary mb-5">{body}</p>

      <div className="w-full max-w-xs border border-gl-border rounded-lg p-3 mb-6 text-left">
        {allItems.map((item, i) => (
          <div
            key={`${item.productId}-${i}`}
            className="flex justify-between gap-2 text-[11px] text-gl-text-secondary py-1"
          >
            <span className="truncate">
              {item.itemName}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </span>
            <span className="shrink-0 text-gl-text">{formatGHS(item.priceGHS * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between text-[12px] font-semibold text-gl-text pt-2 mt-1 border-t border-gl-bg-muted">
          <span>Total</span>
          <span>{formatGHS(total)}</span>
        </div>
      </div>

      <button
        onClick={() => router.push(buttonHref)}
        className="bg-gl-brand text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg active:opacity-80 transition-opacity"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
