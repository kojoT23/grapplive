"use client";

import { useState } from "react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { sellerTabs } from "@/lib/nav/seller-tabs";
import type { Order, OrderStatus } from "@/lib/mock-data/orders";

type FilterTab = "needs_action" | "preparing" | "delivered";

const NEEDS_ACTION_STATUSES: OrderStatus[] = ["awaiting_confirmation", "ready_to_pack"];
const PREPARING_STATUSES: OrderStatus[] = ["preparing", "out_for_delivery"];
const DELIVERED_STATUSES: OrderStatus[] = ["delivered"];

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

function OrderCard({
  order,
  justUpdated,
  onConfirmPayment,
  onRequestDelivery,
  onMarkDelivered,
}: {
  order: Order;
  justUpdated: boolean;
  onConfirmPayment: (id: string) => void;
  onRequestDelivery: (id: string) => void;
  onMarkDelivered: (id: string) => void;
}) {
  const flashClass = justUpdated ? "gl-status-flash" : "";

  if (order.status === "awaiting_confirmation") {
    return (
      <div className={`mx-3 md:mx-5 mb-2 border-[1.5px] border-gl-brand rounded-lg p-3 bg-gl-brand-soft-bg ${flashClass}`}>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-semibold text-gl-brand-soft-text">
            AWAITING YOUR CONFIRMATION
          </span>
          <span className="text-[9px] text-gl-brand-soft-text">Direct MoMo</span>
        </div>
        <div className="text-[11px] text-gl-text mb-0.5">
          {order.itemName} × {order.quantity}
        </div>
        <div className="text-[10px] text-gl-text-secondary mb-2">
          {formatGHS(order.priceGHS)} · {order.buyerNote}
        </div>
        <button
          onClick={() => onConfirmPayment(order.id)}
          className="w-full bg-gl-brand text-white rounded-md py-2 text-[10px] font-semibold transition-transform active:scale-[0.98] active:opacity-90"
        >
          Confirm payment received
        </button>
      </div>
    );
  }

  if (order.status === "ready_to_pack") {
    return (
      <div className={`mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3 ${flashClass}`}>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-semibold text-gl-green">PAID · READY TO PACK</span>
          <span className="text-[9px] text-gl-text-secondary">Instant Confirm</span>
        </div>
        <div className="text-[11px] text-gl-text mb-0.5">
          {order.itemName} × {order.quantity}
        </div>
        <div className="text-[10px] text-gl-text-secondary mb-2">
          {formatGHS(order.priceGHS)}
          {order.isResellerOrder && order.resellerMarkupGHS
            ? ` · Reseller order · GHS ${order.resellerMarkupGHS} markup`
            : ""}
        </div>
        <button
          onClick={() => onRequestDelivery(order.id)}
          className="w-full bg-white text-gl-text border border-gl-border-strong rounded-md py-2 text-[10px] font-semibold transition-colors active:bg-gl-bg-muted"
        >
          Request delivery
        </button>
      </div>
    );
  }

  if (order.status === "preparing") {
    return (
      <div className={`mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3 ${flashClass}`}>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-semibold text-gl-amber">PREPARING</span>
          <span className="text-[9px] text-gl-text-secondary">
            {order.paymentMethod === "direct_momo" ? "Direct MoMo" : "Instant Confirm"}
          </span>
        </div>
        <div className="text-[11px] text-gl-text">
          {order.itemName} × {order.quantity}
        </div>
        <div className="text-[10px] text-gl-text-secondary">
          {formatGHS(order.priceGHS)} · Getting ready to hand to rider
        </div>
      </div>
    );
  }

  if (order.status === "out_for_delivery") {
    return (
      <div className={`mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3 ${flashClass}`}>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-semibold text-gl-text-secondary">OUT FOR DELIVERY</span>
          <span className="text-[9px] text-gl-text-secondary">
            {order.paymentMethod === "direct_momo" ? "Direct MoMo" : "Instant Confirm"}
          </span>
        </div>
        <div className="text-[11px] text-gl-text mb-0.5">{order.itemName} × {order.quantity}</div>
        <div className="text-[10px] text-gl-text-secondary mb-2">
          {formatGHS(order.priceGHS)}
          {order.riderName ? ` · Rider: ${order.riderName}` : ""}
          {order.etaMinutes ? ` · ETA ${order.etaMinutes} min` : ""}
        </div>
        <button
          onClick={() => onMarkDelivered(order.id)}
          className="w-full bg-white text-gl-text border border-gl-border-strong rounded-md py-2 text-[10px] font-semibold transition-colors active:bg-gl-bg-muted"
        >
          Mark as delivered
        </button>
      </div>
    );
  }

  return (
    <div className={`mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3 opacity-70 ${flashClass}`}>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] font-semibold text-gl-text-secondary">DELIVERED</span>
        <span className="text-[9px] text-gl-text-secondary">
          {order.paymentMethod === "direct_momo" ? "Direct MoMo" : "Instant Confirm"}
        </span>
      </div>
      <div className="text-[11px] text-gl-text">{order.itemName} × {order.quantity}</div>
      <div className="text-[10px] text-gl-text-secondary">{formatGHS(order.priceGHS)}</div>
    </div>
  );
}

export default function OrdersPage() {
  const { isChecking } = useRequireAuth("sell");
  const orders = useOrdersStore((s) => s.orders);
  const confirmPayment = useOrdersStore((s) => s.confirmPayment);
  const requestDelivery = useOrdersStore((s) => s.requestDelivery);
  const markDelivered = useOrdersStore((s) => s.markDelivered);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("needs_action");
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const needsActionCount = orders.filter((o) => NEEDS_ACTION_STATUSES.includes(o.status)).length;

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "needs_action") return NEEDS_ACTION_STATUSES.includes(o.status);
    if (activeFilter === "preparing") return PREPARING_STATUSES.includes(o.status);
    return DELIVERED_STATUSES.includes(o.status);
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "needs_action", label: `Needs action (${needsActionCount})` },
    { key: "preparing", label: "Preparing" },
    { key: "delivered", label: "Delivered" },
  ];

  const flashThenRun = (orderId: string, action: (id: string) => void) => {
    action(orderId);
    setRecentlyUpdatedId(orderId);
    setTimeout(() => setRecentlyUpdatedId(null), 1000);
  };

  return (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">Orders</h1>

      <div className="flex gap-1.5 px-3 md:px-5 pb-2.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`text-[9px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? "bg-gl-brand text-white"
                : "bg-gl-bg-muted text-gl-text-secondary active:bg-gl-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="px-3 md:px-5 py-8 text-center text-[11px] text-gl-text-secondary">
          Nothing here right now.
        </div>
      ) : (
        filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            justUpdated={order.id === recentlyUpdatedId}
            onConfirmPayment={(id) => flashThenRun(id, confirmPayment)}
            onRequestDelivery={(id) => flashThenRun(id, requestDelivery)}
            onMarkDelivered={(id) => flashThenRun(id, markDelivered)}
          />
        ))
      )}

      <TabBar tabs={sellerTabs} activeHref="/orders" />
    </div>
  );
}
