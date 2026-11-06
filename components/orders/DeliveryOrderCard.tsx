"use client";

import { useState } from "react";
import type { FlatOrderGroup } from "@/lib/mock-data/orders";
import { groupTotal } from "@/lib/mock-data/orders";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { slotLabel } from "@/lib/mock-data/deliverySlots";
import {
  ACTIVE_DELIVERY_STATUSES,
  CANCELLABLE_BY_SELLER,
  canRequestAgain,
  deliveryStatusLabels,
  failureReasonLabels,
  type Delivery,
} from "@/lib/mock-data/deliveries";

// Seller/GrappStore-facing card for an order that's in rider dispatch:
// waiting for a rider, a rider on the way to the seller, a rider carrying it,
// or a failed attempt coming back. The seller can't mark these delivered —
// the customer's OTP does that, on the rider's side. What the seller CAN do
// is call a delivery off before pickup, send it out again, confirm a
// returned parcel arrived, or request a rider again after a failure.
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
  actingSellerId,
  onRequestDelivery,
}: {
  group: FlatOrderGroup;
  delivery: Delivery | undefined;
  flashClass: string;
  // Who is pressing the buttons (the signed-in seller; GrappStore staff act as
  // GrappStore). The delivery store checks it matches the delivery's seller.
  actingSellerId: string;
  onRequestDelivery: (id: string) => void;
}) {
  const reofferDelivery = useDeliveryStore((s) => s.reofferDelivery);
  const cancelDelivery = useDeliveryStore((s) => s.cancelDelivery);
  const confirmParcelReceived = useDeliveryStore((s) => s.confirmParcelReceived);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const total = groupTotal(group);
  const items = group.items.map((i) => `${i.itemName} × ${i.quantity}`).join(", ");
  const status = delivery?.status;
  const inProgress = delivery !== undefined && ACTIVE_DELIVERY_STATUSES.includes(delivery.status);
  const returning = status === "returning";
  const returnedUnconfirmed = status === "returned" && delivery?.returnConfirmedAt === undefined;
  const atSeller = group.status === "ready_for_pickup";
  const needsRetry =
    atSeller &&
    delivery !== undefined &&
    (status === "failed" || (status === "returned" && delivery.returnConfirmedAt !== undefined));
  const warn = returning || returnedUnconfirmed || needsRetry;

  let heading = "WAITING FOR A RIDER";
  let detail = delivery ? `Your request is with riders in ${delivery.pickupArea}.` : "Delivery requested.";
  if (delivery?.slot && status === "offered") {
    heading = "WAITING FOR A RIDER TO CLAIM IT";
    detail = `Scheduled for ${slotLabel(delivery.slot)}. Riders in ${delivery.pickupArea} can claim it ahead of time.`;
  } else if (status === "scheduled" && delivery?.slot) {
    heading = "SCHEDULED";
    detail = `${delivery.riderName} will deliver on ${slotLabel(delivery.slot)}. Have it ready for pickup that day.`;
  }
  if (returning && delivery) {
    heading = "PARCEL BEING RETURNED";
    detail = `${delivery.riderName} is bringing it back${
      delivery.failureReason ? ` — ${failureReasonLabels[delivery.failureReason]}` : ""
    }.`;
  } else if (returnedUnconfirmed && delivery) {
    heading = "PARCEL RETURNED";
    detail = `${delivery.riderName} says the parcel is back with you. Confirm once you have it.`;
  } else if (needsRetry && delivery) {
    heading = "DELIVERY FAILED";
    detail = `${delivery.failureReason ? failureReasonLabels[delivery.failureReason] : "The attempt failed"}. You can request a rider again.`;
  } else if (inProgress && delivery && status !== "scheduled") {
    heading = group.status === "out_for_delivery" ? "OUT FOR DELIVERY" : "RIDER ASSIGNED";
    detail = `${delivery.riderName} · ${deliveryStatusLabels[delivery.status]}`;
  }

  const canCancel = delivery !== undefined && CANCELLABLE_BY_SELLER.includes(delivery.status);

  return (
    <div
      className={`mx-3 md:mx-5 mb-2 border rounded-lg p-3 ${warn ? "border-gl-amber" : "border-gl-border"} ${flashClass}`}
    >
      <div className="flex justify-between mb-1">
        <span className={`text-[10px] font-semibold ${warn ? "text-gl-amber" : "text-gl-brand"}`}>{heading}</span>
      </div>
      <div className="text-[11px] text-gl-text mb-0.5">{items}</div>
      <div className="text-[10px] text-gl-text-secondary">GHS {total.toLocaleString("en-GH")}</div>
      <div className="text-[10px] text-gl-text-secondary mt-1">{detail}</div>

      {delivery?.status === "offered" && (
        <button
          onClick={() => reofferDelivery(delivery.id)}
          className="mt-2 w-full border border-gl-brand text-gl-brand rounded-lg py-2 text-[11px] font-semibold active:bg-gl-brand-soft-bg transition-colors"
        >
          Send the request again
        </button>
      )}

      {returnedUnconfirmed && delivery && (
        <button
          onClick={() => confirmParcelReceived(delivery.id, actingSellerId)}
          className="mt-2 w-full bg-gl-brand text-white rounded-lg py-2 text-[11px] font-semibold active:opacity-90"
        >
          I received the parcel
        </button>
      )}

      {needsRetry && canRequestAgain(delivery) && (
        <button
          onClick={() => onRequestDelivery(group.id)}
          className="mt-2 w-full bg-gl-brand text-white rounded-lg py-2 text-[11px] font-semibold active:opacity-90"
        >
          Request delivery again
        </button>
      )}

      {canCancel && delivery && (
        <button
          onClick={() => {
            if (confirmingCancel) cancelDelivery(delivery.id, actingSellerId);
            else setConfirmingCancel(true);
          }}
          className="mt-2 w-full text-gl-red text-[11px] font-semibold py-1.5 active:opacity-60"
        >
          {confirmingCancel
            ? "Tap again to cancel the delivery"
            : delivery.status === "offered"
              ? "Cancel delivery request"
              : "Cancel this delivery"}
        </button>
      )}
    </div>
  );
}

// An order the buyer called off before it was dispatched.
export function CancelledOrderCard({ group, flashClass }: { group: FlatOrderGroup; flashClass: string }) {
  const items = group.items.map((i) => `${i.itemName} × ${i.quantity}`).join(", ");
  return (
    <div className={`mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3 opacity-70 ${flashClass}`}>
      <div className="text-[10px] font-semibold text-gl-text-secondary mb-1">CANCELLED</div>
      <div className="text-[11px] text-gl-text mb-0.5">{items}</div>
      <div className="text-[10px] text-gl-text-secondary">Cancelled by the buyer — nothing to pack.</div>
    </div>
  );
}
