"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useDeliveryStore, latestDeliveryForGroup } from "@/lib/store/useDeliveryStore";
import { DeliveryOrderCard, CancelledOrderCard, isRiderManaged } from "@/components/orders/DeliveryOrderCard";
import { deliveryNeedsSeller } from "@/lib/mock-data/deliveries";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";
import { CashToConfirm } from "@/components/orders/CashToConfirm";
import { SellerCancelOrder } from "@/components/orders/SellerCancelOrder";
import { flattenGroups, groupTotal, type FlatOrderGroup, type OrderStatus } from "@/lib/mock-data/orders";

type FilterTab = "needs_action" | "preparing" | "delivered";

const NEEDS_ACTION_STATUSES: OrderStatus[] = ["ready_to_pack"];
const PREPARING_STATUSES: OrderStatus[] = [
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "out_for_delivery",
];
const DELIVERED_STATUSES: OrderStatus[] = ["delivered"];

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

function itemsSummary(group: FlatOrderGroup) {
  return group.items.map((i) => `${i.itemName} × ${i.quantity}`).join(", ");
}

function FulfillmentCard({
  group,
  justUpdated,
  onRequestDelivery,
  onMarkDelivered,
}: {
  group: FlatOrderGroup;
  justUpdated: boolean;
  onRequestDelivery: (id: string) => void;
  onMarkDelivered: (id: string) => void;
}) {
  const flashClass = justUpdated ? "gl-status-flash" : "";
  const total = groupTotal(group);
  const delivery = useDeliveryStore((s) => latestDeliveryForGroup(s.deliveries, group.id));

  if (group.status === "cancelled") {
    return <CancelledOrderCard group={group} flashClass={flashClass} />;
  }

  if (isRiderManaged(group, delivery)) {
    return (
      <DeliveryOrderCard
        group={group}
        delivery={delivery}
        flashClass={flashClass}
        actingSellerId="grapplive-official"
        onRequestDelivery={onRequestDelivery}
      />
    );
  }

  if (group.status === "ready_to_pack") {
    return (
      <div className={`mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3 ${flashClass}`}>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-semibold text-gl-green">PAID · READY TO PACK</span>
          <span className="text-[9px] text-gl-text-secondary">Order #{group.orderId}</span>
        </div>
        <div className="text-[11px] text-gl-text mb-0.5">{itemsSummary(group)}</div>
        <div className="text-[10px] text-gl-text-secondary mb-2">{formatGHS(total)}</div>
        <button
          onClick={() => onRequestDelivery(group.id)}
          className="w-full bg-white text-gl-text border border-gl-border-strong rounded-md py-2 text-[10px] font-semibold transition-colors active:bg-gl-bg-muted"
        >
          Request delivery
        </button>
      </div>
    );
  }

  if (group.status === "preparing") {
    return (
      <div className={`mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3 ${flashClass}`}>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-semibold text-gl-amber">PREPARING</span>
          <span className="text-[9px] text-gl-text-secondary">Order #{group.orderId}</span>
        </div>
        <div className="text-[11px] text-gl-text">{itemsSummary(group)}</div>
        <div className="text-[10px] text-gl-text-secondary">
          {formatGHS(total)} · Ready for a rider
        </div>
        <button
          onClick={() => onRequestDelivery(group.id)}
          className="mt-2 w-full bg-gl-brand text-white rounded-lg py-2 text-[11px] font-semibold active:opacity-90"
        >
          Request delivery
        </button>
      </div>
    );
  }

  if (group.status === "out_for_delivery") {
    return (
      <div className={`mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3 ${flashClass}`}>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-semibold text-gl-text-secondary">OUT FOR DELIVERY</span>
          <span className="text-[9px] text-gl-text-secondary">Order #{group.orderId}</span>
        </div>
        <div className="text-[11px] text-gl-text mb-0.5">{itemsSummary(group)}</div>
        <div className="text-[10px] text-gl-text-secondary mb-2">
          {formatGHS(total)}
          {group.riderName ? ` · Rider: ${group.riderName}` : ""}
          {group.etaMinutes ? ` · ETA ${group.etaMinutes} min` : ""}
        </div>
        <button
          onClick={() => onMarkDelivered(group.id)}
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
        <span className="text-[9px] text-gl-text-secondary">Order #{group.orderId}</span>
      </div>
      <div className="text-[11px] text-gl-text">{itemsSummary(group)}</div>
      <div className="text-[10px] text-gl-text-secondary">{formatGHS(total)}</div>
    </div>
  );
}

export default function GrappStoreFulfillmentPage() {
  // TEMPORARY: gated behind the existing "sell" role since there's no
  // real GRAPPlive-staff role in the auth model yet. Replace with a
  // proper staff/admin role check once real auth exists — this is not
  // correct access control long-term, just better than fully open.
  const { isChecking } = useRequireAuth("sell");
  const orders = useOrdersStore((s) => s.orders);
  const deliveries = useDeliveryStore((s) => s.deliveries);
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

  const groups = flattenGroups(orders).filter((g) => g.sellerId === "grapplive-official");
  // A failed delivery attempt needs the seller's attention too (re-request a
  // rider, or sort out the problem), so it counts as needing action.
  const needsAction = (g: FlatOrderGroup) =>
    NEEDS_ACTION_STATUSES.includes(g.status) ||
    (g.status === "ready_for_pickup" && deliveryNeedsSeller(latestDeliveryForGroup(deliveries, g.id)));
  const needsActionCount = groups.filter(needsAction).length;

  const filteredGroups = groups.filter((g) => {
    if (activeFilter === "needs_action") return needsAction(g);
    if (activeFilter === "preparing") return PREPARING_STATUSES.includes(g.status) && !needsAction(g);
    return DELIVERED_STATUSES.includes(g.status);
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "needs_action", label: `Needs action (${needsActionCount})` },
    { key: "preparing", label: "Preparing" },
    { key: "delivered", label: "Delivered" },
  ];

  const flashThenRun = (groupId: string, action: (id: string) => void) => {
    action(groupId);
    setRecentlyUpdatedId(groupId);
    setTimeout(() => setRecentlyUpdatedId(null), 1000);
  };

  return (
    <div className="pb-16">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-2">
        <Link href="/grappstore/account" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text flex-1">GrappStore fulfillment</h1>
        {/* Entry point into the (currently mockup-only) product form —
            products/new isn't linked from anywhere else yet. */}
        <Link
          href="/grappstore/products/new"
          aria-label="Add product"
          className="w-8 h-8 rounded-full bg-gl-bg-muted flex items-center justify-center transition-transform hover:scale-110 active:scale-90"
        >
          <IconPlus size={16} className="text-gl-text" />
        </Link>
      </div>
      <p className="px-3 md:px-5 pb-2.5 text-[10px] text-gl-text-secondary">
        Internal ops view — GRAPPlive fulfills these directly, no seller confirmation needed.
      </p>

      <CashToConfirm sellerId="grapplive-official" />

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

      {filteredGroups.length === 0 ? (
        <div className="px-3 md:px-5 py-8 text-center text-[11px] text-gl-text-secondary">
          Nothing here right now.
        </div>
      ) : (
        filteredGroups.map((group) => (
          <div key={group.id}>
            <FulfillmentCard
              group={group}
              justUpdated={group.id === recentlyUpdatedId}
              onRequestDelivery={(id) => flashThenRun(id, requestDeliveryForGroup)}
              onMarkDelivered={(id) => flashThenRun(id, markDelivered)}
            />
            <SellerCancelOrder group={group} actingSellerId="grapplive-official" />
          </div>
        ))
      )}
    </div>
  );
}
