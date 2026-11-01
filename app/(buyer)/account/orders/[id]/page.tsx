"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconCircleCheck, IconCircle, IconPhone } from "@tabler/icons-react";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { flattenGroups, groupTotal, type OrderStatus } from "@/lib/mock-data/orders";
import { useDeliveryStore, latestDeliveryForGroup } from "@/lib/store/useDeliveryStore";
import { getRiderByIdSync } from "@/lib/store/useRiderIdentityStore";
import {
  ACTIVE_DELIVERY_STATUSES,
  deliveryStatusLabels,
  failureReasonLabels,
} from "@/lib/mock-data/deliveries";

const ALL_STEPS: { status: OrderStatus; fallbackLabel: string }[] = [
  { status: "awaiting_confirmation", fallbackLabel: "Order placed" },
  { status: "preparing", fallbackLabel: "Seller is preparing your order" },
  { status: "ready_for_pickup", fallbackLabel: "Waiting for a rider" },
  { status: "rider_assigned", fallbackLabel: "Rider assigned" },
  { status: "out_for_delivery", fallbackLabel: "Out for delivery" },
  { status: "delivered", fallbackLabel: "Delivered" },
];

export default function BuyerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orders = useOrdersStore((s) => s.orders);
  const group = flattenGroups(orders).find((g) => g.id === params.id);
  const delivery = useDeliveryStore((s) =>
    latestDeliveryForGroup(s.deliveries, params.id)
  );

  if (!group) {
    return (
      <div className="px-3 md:px-5 pt-3.5">
        <Link href="/account/orders" className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-4 active:opacity-60 transition-opacity">
          <IconArrowLeft size={14} /> Back
        </Link>
        <div className="text-[12px] text-gl-text-secondary">Order not found.</div>
      </div>
    );
  }

  // The two rider steps only appear for orders that actually went through
  // rider dispatch (older/seeded orders skip straight to out for delivery).
  const usesRider =
    group.status === "ready_for_pickup" ||
    group.status === "rider_assigned" ||
    group.history.some((h) => h.status === "ready_for_pickup" || h.status === "rider_assigned");
  const stepsForOrder = ALL_STEPS.filter(
    (s) => usesRider || (s.status !== "ready_for_pickup" && s.status !== "rider_assigned")
  );
  const relevantSteps =
    group.status === "awaiting_confirmation" || group.status === "ready_to_pack"
      ? stepsForOrder.filter((s) => s.status !== "awaiting_confirmation" || group.paymentMethod === "direct_momo")
      : stepsForOrder;

  const riderForDelivery =
    delivery?.riderId ? getRiderByIdSync(delivery.riderId) : undefined;
  const deliveryInProgress =
    delivery !== undefined && ACTIVE_DELIVERY_STATUSES.includes(delivery.status);

  const timeline = relevantSteps.map((step) => {
    const historyEntry = group.history.find((h) => h.status === step.status);
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
        <div className="pb-3 border-b border-gl-bg-muted mb-3">
          <div className="text-[10px] text-gl-text-secondary mb-2">{group.sellerName}</div>
          {group.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-2.5 mb-2">
              <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden gl-shimmer" />
              <div className="flex-1">
                <div className="text-[12px] text-gl-text">{item.itemName} × {item.quantity}</div>
                <div className="text-[12px] font-semibold text-gl-text mt-0.5">
                  GHS {(item.priceGHS * item.quantity).toLocaleString("en-GH")}
                </div>
              </div>
            </div>
          ))}
          <div className="text-[11px] font-semibold text-gl-text text-right">
            Total: GHS {groupTotal(group).toLocaleString("en-GH")}
          </div>
        </div>

        {group.paymentMethod === "cash_on_delivery" && group.status !== "delivered" && (
          <div className="border border-gl-border rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold text-gl-text mb-0.5">CASH ON DELIVERY</div>
            <div className="text-[11px] text-gl-text-secondary">
              Pay GHS {groupTotal(group).toLocaleString("en-GH")} in cash to your rider when your order arrives.
            </div>
          </div>
        )}

        {deliveryInProgress && delivery && (
          <div className="border-[1.5px] border-gl-brand rounded-lg p-3 mb-4 bg-gl-brand-soft-bg">
            <div className="text-[10px] font-semibold text-gl-brand-soft-text mb-1">
              {deliveryStatusLabels[delivery.status].toUpperCase()}
            </div>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <div className="text-[12px] font-semibold text-gl-text">{delivery.riderName}</div>
                <div className="text-[10px] text-gl-text-secondary">
                  About {delivery.etaMinutes} min away when accepted
                </div>
              </div>
              {riderForDelivery && (
                <a
                  href={`tel:${riderForDelivery.phone}`}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gl-brand active:opacity-60"
                >
                  <IconPhone size={14} /> Call rider
                </a>
              )}
            </div>
            <div className="border-t border-gl-border pt-2.5">
              <div className="text-[9px] text-gl-text-secondary mb-0.5">Delivery code</div>
              <div className="text-[20px] font-bold tracking-[0.3em] text-gl-text">{delivery.otp}</div>
              <div className="text-[9px] text-gl-text-secondary mt-1">
                Give this code to your rider when your order arrives — not before.
              </div>
            </div>
          </div>
        )}

        {group.status === "ready_for_pickup" && delivery?.status === "failed" && delivery.failureReason && (
          <div className="border border-gl-border rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold text-gl-amber mb-0.5">DELIVERY ATTEMPT FAILED</div>
            <div className="text-[11px] text-gl-text">{failureReasonLabels[delivery.failureReason]}</div>
            <div className="text-[10px] text-gl-text-secondary">The seller has been told and will arrange next steps.</div>
          </div>
        )}

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
