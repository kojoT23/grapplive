"use client";

import type { FlatOrderGroup } from "@/lib/mock-data/orders";
import { groupTotal } from "@/lib/mock-data/orders";
import {
  ACTIVE_DELIVERY_STATUSES,
  deliveryStatusLabels,
  failureReasonLabels,
  type Delivery,
} from "@/lib/mock-data/deliveries";

// Seller/GrappStore-facing card for an order that's in rider dispatch:
// waiting for a rider, a rider on the way to the seller, or a rider already
// carrying it. The seller can't mark these delivered — the customer's OTP
// does that, on the rider's side — so the only action is re-requesting
// after a failed attempt.
export function isRiderManaged(group: FlatOrderGroup, delivery: Delivery | undefined): boolean {
  return (
    group.status === "ready_for_pickup" ||
    group.status === "rider_assigned" ||
    (group.status === "out_for_delivery" && delivery !== undefined)
  );
}

export function DeliveryOrderCard({
  group,
  delivery,
  flashClass,
  onRequestDelivery,
}: {
  group: FlatOrderGroup;
  delivery: Delivery | undefined;
  flashClass: string;
  onRequestDelivery: (id: string) => void;
}) {
  const total = groupTotal(group);
  const items = group.items.map((i) => `${i.itemName} × ${i.quantity}`).join(", ");
  const failed = group.status === "ready_for_pickup" && delivery?.status === "failed";
  const inProgress = delivery !== undefined && ACTIVE_DELIVERY_STATUSES.includes(delivery.status);

  let heading = "WAITING FOR A RIDER";
  let detail = delivery
    ? `Your request is with riders in ${delivery.pickupArea}.`
    : "Delivery requested.";
  if (failed && delivery?.failureReason) {
    heading = "DELIVERY FAILED";
    detail = `${failureReasonLabels[delivery.failureReason]}. You can request a rider again.`;
  } else if (inProgress && delivery) {
    heading = group.status === "out_for_delivery" ? "OUT FOR DELIVERY" : "RIDER ASSIGNED";
    detail = `${delivery.riderName} · ${deliveryStatusLabels[delivery.status]}`;
  }

  return (
    <div
      className={`mx-3 md:mx-5 mb-2 border rounded-lg p-3 ${
        failed ? "border-gl-amber" : "border-gl-border"
      } ${flashClass}`}
    >
      <div className="flex justify-between mb-1">
        <span className={`text-[10px] font-semibold ${failed ? "text-gl-amber" : "text-gl-brand"}`}>
          {heading}
        </span>
      </div>
      <div className="text-[11px] text-gl-text mb-0.5">{items}</div>
      <div className="text-[10px] text-gl-text-secondary">GHS {total.toLocaleString("en-GH")}</div>
      <div className="text-[10px] text-gl-text-secondary mt-1">{detail}</div>
      {failed && (
        <button
          onClick={() => onRequestDelivery(group.id)}
          className="mt-2 w-full bg-gl-brand text-white rounded-lg py-2 text-[11px] font-semibold active:opacity-90"
        >
          Request delivery again
        </button>
      )}
    </div>
  );
}
