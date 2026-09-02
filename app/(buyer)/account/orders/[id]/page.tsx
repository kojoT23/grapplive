"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconCircleCheck, IconCircle } from "@tabler/icons-react";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import type { OrderStatus } from "@/lib/mock-data/orders";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

const ALL_STEPS: { status: OrderStatus; fallbackLabel: string }[] = [
  { status: "awaiting_confirmation", fallbackLabel: "Order placed" },
  { status: "preparing", fallbackLabel: "Seller is preparing your order" },
  { status: "out_for_delivery", fallbackLabel: "Out for delivery" },
  { status: "delivered", fallbackLabel: "Delivered" },
];

export default function BuyerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orders = useOrdersStore((s) => s.orders);
  const order = orders.find((o) => o.id === params.id);

  if (!order) {
    return (
      <div className="px-3 md:px-5 pt-3.5">
        <Link href="/account/orders" className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-4 active:opacity-60 transition-opacity">
          <IconArrowLeft size={14} /> Back
        </Link>
        <div className="text-[12px] text-gl-text-secondary">Order not found.</div>
      </div>
    );
  }

  // Build a display timeline: use real history for completed steps,
  // show remaining steps in ALL_STEPS as pending (no timestamp yet).
  const relevantSteps =
    order.status === "awaiting_confirmation" || order.status === "ready_to_pack"
      ? ALL_STEPS.filter((s) => s.status !== "awaiting_confirmation" || order.paymentMethod === "direct_momo")
      : ALL_STEPS;

  const timeline = relevantSteps.map((step) => {
    const historyEntry = order.history.find((h) => h.status === step.status);
    return {
      status: step.status,
      label: historyEntry?.label ?? step.fallbackLabel,
      timestamp: historyEntry?.timestamp ?? "",
      completed: Boolean(historyEntry),
    };
  });

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/account/orders" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">Order details</h1>
      </div>

      <div className="px-3 md:px-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gl-bg-muted mb-3">
          <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden gl-shimmer" />
          <div className="flex-1">
            <div className="text-[12px] text-gl-text">{order.itemName} × {order.quantity}</div>
            <div className="text-[10px] text-gl-text-secondary">{order.sellerName}</div>
            <div className="text-[12px] font-semibold text-gl-text mt-0.5">
              {formatGHS(order.priceGHS * order.quantity)}
            </div>
          </div>
        </div>

        <h2 className="text-[11px] font-semibold text-gl-text mb-2.5">Tracking</h2>
        <div>
          {timeline.map((step, i) => (
            <div key={step.status} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                {step.completed ? (
                  <IconCircleCheck size={16} className="text-gl-green shrink-0" />
                ) : (
                  <IconCircle size={16} className="text-gl-bg-placeholder shrink-0" />
                )}
                {i < timeline.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[24px] ${step.completed ? "bg-gl-green" : "bg-gl-bg-placeholder"}`} />
                )}
              </div>
              <div className="pb-4">
                <div className={`text-[11px] ${step.completed ? "text-gl-text font-semibold" : "text-gl-text-secondary"}`}>
                  {step.label}
                </div>
                {step.timestamp && (
                  <div className="text-[9px] text-gl-text-secondary">{step.timestamp}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
