"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconCircleCheck, IconCircle, IconPhone, IconStar, IconStarFilled } from "@tabler/icons-react";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { flattenGroups, groupPayable, groupTotal, type OrderStatus } from "@/lib/mock-data/orders";
import { useDeliveryStore, latestDeliveryForGroup } from "@/lib/store/useDeliveryStore";
import { getRiderByIdSync } from "@/lib/store/useRiderIdentityStore";
import {
  ACTIVE_DELIVERY_STATUSES,
  deliveryStatusLabels,
  failureReasonLabels,
  minutesLeft,
  type Delivery,
} from "@/lib/mock-data/deliveries";
import { useNow } from "@/lib/hooks/useNow";
import { slotLabel } from "@/lib/mock-data/deliverySlots";
import { useRefundsStore, refundsForGroup } from "@/lib/store/useRefundsStore";
import { useDisputesStore, disputeForGroup } from "@/lib/store/useDisputesStore";
import {
  disputeReasonLabels,
  DISPUTE_WINDOW_DAYS,
  type Dispute,
  type DisputeReason,
} from "@/lib/mock-data/disputes";
import { useAppStore } from "@/lib/store/useAppStore";

const ALL_STEPS: { status: OrderStatus; fallbackLabel: string }[] = [
  { status: "awaiting_confirmation", fallbackLabel: "Order placed" },
  { status: "preparing", fallbackLabel: "Seller is preparing your order" },
  { status: "ready_for_pickup", fallbackLabel: "Waiting for a rider" },
  { status: "rider_assigned", fallbackLabel: "Rider assigned" },
  { status: "out_for_delivery", fallbackLabel: "Out for delivery" },
  { status: "delivered", fallbackLabel: "Delivered" },
];

// After a completed delivery the buyer rates their rider once, 1–5 stars
// with an optional note. Feeds the rider's average rating.
function RateRider({ delivery }: { delivery: Delivery }) {
  const phone = useAppStore((s) => s.phone);
  const rateDelivery = useDeliveryStore((s) => s.rateDelivery);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  if (delivery.rating) {
    return (
      <div className="border border-gl-border rounded-lg p-3 mb-4">
        <div className="text-[10px] font-semibold text-gl-text mb-1">YOUR RATING FOR {delivery.riderName?.toUpperCase()}</div>
        <div className="flex gap-0.5 text-gl-amber">
          {[1, 2, 3, 4, 5].map((n) =>
            n <= delivery.rating!.stars ? <IconStarFilled key={n} size={16} /> : <IconStar key={n} size={16} />
          )}
        </div>
        {delivery.rating.comment && (
          <div className="text-[10px] text-gl-text-secondary mt-1">{delivery.rating.comment}</div>
        )}
      </div>
    );
  }

  const handleSubmit = () => {
    const result = rateDelivery(delivery.id, phone, stars, comment);
    if (result === "not_buyer") setError("Only the person who placed this order can rate the delivery.");
    else if (result !== "ok") setError("Couldn't save your rating. Please try again.");
  };

  return (
    <div className="border border-gl-border rounded-lg p-3 mb-4">
      <div className="text-[11px] font-semibold text-gl-text mb-0.5">How was your delivery?</div>
      <div className="text-[10px] text-gl-text-secondary mb-2">Rate {delivery.riderName}</div>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => {
              setStars(n);
              setError("");
            }}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="text-gl-amber active:scale-90 transition-transform"
          >
            {n <= stars ? <IconStarFilled size={26} /> : <IconStar size={26} />}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={200}
        placeholder="Add a note (optional)"
        className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none mb-2 transition-colors focus:border-gl-brand"
      />
      {error && <p className="text-[10px] text-gl-red mb-1.5">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={stars === 0}
        className="w-full bg-gl-brand text-white rounded-lg py-2 text-[12px] font-semibold active:opacity-90 transition-opacity disabled:opacity-40"
      >
        Submit rating
      </button>
    </div>
  );
}

// After delivery the buyer can report a problem (not as described, wrong item,
// damaged, never arrived) within DISPUTE_WINDOW_DAYS. The seller can respond and
// GRAPPlive decides.
function ReportProblem({ groupId }: { groupId: string }) {
  const phone = useAppStore((s) => s.phone);
  const openDispute = useDisputesStore((s) => s.openDispute);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-gl-text-secondary text-[11px] font-semibold py-2 mb-4 active:opacity-60"
      >
        Something wrong? Report a problem
      </button>
    );
  }

  const handleSubmit = () => {
    if (!reason) return;
    const result = openDispute({ orderGroupId: groupId, buyerPhone: phone, reason, details });
    if (result === "window_closed") setError(`Problems can only be reported within ${DISPUTE_WINDOW_DAYS} days of delivery.`);
    else if (result === "not_buyer") setError("Only the person who placed this order can report a problem.");
    else if (result !== "ok") setError("Couldn't send your report. Please try again.");
  };

  return (
    <div className="border border-gl-border rounded-lg p-3 mb-4">
      <div className="text-[11px] font-semibold text-gl-text mb-1.5">What went wrong?</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {(Object.keys(disputeReasonLabels) as DisputeReason[]).map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={`border rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              reason === r ? "border-gl-brand text-gl-brand border-[1.5px]" : "border-gl-border text-gl-text-secondary"
            }`}
          >
            {disputeReasonLabels[r]}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={500}
        placeholder="Tell us what happened (optional)"
        className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none mb-2 transition-colors focus:border-gl-brand"
      />
      {error && <p className="text-[10px] text-gl-red mb-1.5">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!reason}
          className="flex-1 bg-gl-brand text-white rounded-lg py-2 text-[12px] font-semibold active:opacity-90 transition-opacity disabled:opacity-40"
        >
          Send report
        </button>
        <button
          onClick={() => setOpen(false)}
          className="flex-1 border border-gl-border-strong text-gl-text rounded-lg py-2 text-[12px] font-semibold active:bg-gl-bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DisputeStatus({ dispute }: { dispute: Dispute }) {
  const outcome =
    dispute.status === "open"
      ? "GRAPPlive is looking into it."
      : dispute.status === "refunded"
        ? `Decided in your favour: GHS ${(dispute.resolution?.amountGHS ?? 0).toLocaleString("en-GH")} will be refunded.`
        : "GRAPPlive decided not to refund this order.";
  return (
    <div className="border border-gl-border rounded-lg p-3 mb-4">
      <div className="text-[10px] font-semibold text-gl-text mb-0.5">
        YOUR REPORT · {disputeReasonLabels[dispute.reason].toUpperCase()}
      </div>
      <div className={`text-[11px] font-semibold ${dispute.status === "open" ? "text-gl-amber" : "text-gl-text"}`}>
        {outcome}
      </div>
      {dispute.resolution?.note && (
        <div className="text-[10px] text-gl-text-secondary mt-0.5">{dispute.resolution.note}</div>
      )}
      {dispute.sellerResponse && (
        <div className="text-[10px] text-gl-text-secondary mt-1">
          {dispute.sellerName} replied: {dispute.sellerResponse.text}
        </div>
      )}
    </div>
  );
}

// A buyer can call off an order until a rider has been
// requested (nothing has been paid, so nothing needs refunding). Two taps, so
// it can't happen by accident.
function CancelOrder({ groupId, refundNote }: { groupId: string; refundNote: string }) {
  const phone = useAppStore((s) => s.phone);
  const cancelByBuyer = useOrdersStore((s) => s.cancelByBuyer);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    const result = cancelByBuyer(groupId, phone);
    if (result === "not_buyer") setError("Only the person who placed this order can cancel it.");
    else if (result !== "ok") setError("This order can't be cancelled any more.");
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleClick}
        className="w-full border border-gl-border-strong text-gl-red text-[12px] font-semibold py-2.5 rounded-lg active:bg-gl-bg-muted transition-colors"
      >
        {confirming ? "Tap again to cancel this order" : "Cancel order"}
      </button>
      <p className="text-[9px] text-gl-text-secondary mt-1">{refundNote}</p>
      {error && <p className="text-[10px] text-gl-red mt-1">{error}</p>}
    </div>
  );
}

export default function BuyerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orders = useOrdersStore((s) => s.orders);
  const group = flattenGroups(orders).find((g) => g.id === params.id);
  const delivery = useDeliveryStore((s) =>
    latestDeliveryForGroup(s.deliveries, params.id)
  );
  const now = useNow();
  const refunds = useRefundsStore((s) => s.refunds);
  const disputes = useDisputesStore((s) => s.disputes);

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

  const deliveryDetails = orders.find((o) => o.id === group.orderId)?.deliveryDetails;
  const etaMinutesLeft = delivery ? minutesLeft(delivery, now) : null;
  const riderForDelivery =
    delivery?.riderId ? getRiderByIdSync(delivery.riderId) : undefined;
  const deliveryInProgress =
    delivery !== undefined &&
    ACTIVE_DELIVERY_STATUSES.includes(delivery.status) &&
    delivery.status !== "returning";
  // Any order can be called off until a rider is requested; a paid one is refunded.
  const canCancel =
    group.status === "awaiting_confirmation" ||
    group.status === "ready_to_pack" ||
    group.status === "preparing";
  const paidOrder = group.paymentMethod !== "cash_on_delivery";
  const refundNote = paidOrder
    ? `You'll be refunded GHS ${groupPayable(group).toLocaleString("en-GH")} by ${
        group.paymentMethod === "direct_momo" ? group.sellerName : "GRAPPlive"
      }.`
    : "You haven't paid yet, so nothing will be charged.";
  const groupRefunds = refundsForGroup(refunds, group.id);
  const dispute = disputeForGroup(disputes, group.id);

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
          {group.deliveryFeeGHS !== undefined && (
            <div className="flex justify-between text-[10px] text-gl-text-secondary pt-1">
              <span>Items</span>
              <span>GHS {groupTotal(group).toLocaleString("en-GH")}</span>
            </div>
          )}
          {group.deliveryFeeGHS !== undefined && (
            <div className="flex justify-between text-[10px] text-gl-text-secondary pb-1">
              <span>Delivery</span>
              <span>
                {(group.deliveryFeeChargedGHS ?? 0) > 0
                  ? `GHS ${group.deliveryFeeChargedGHS!.toLocaleString("en-GH")}`
                  : "Covered by Instant Confirm"}
              </span>
            </div>
          )}
          <div className="text-[11px] font-semibold text-gl-text text-right">
            Total: GHS {groupPayable(group).toLocaleString("en-GH")}
          </div>
        </div>

        {group.deliverySlot && group.status !== "delivered" && group.status !== "cancelled" && (
          <div className="border border-gl-border rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold text-gl-text mb-0.5">DELIVERY DAY</div>
            <div className="text-[11px] text-gl-text">{slotLabel(group.deliverySlot)}</div>
            {delivery?.status === "scheduled" && delivery.riderName && (
              <div className="text-[10px] text-gl-text-secondary mt-0.5">
                {delivery.riderName} is booked to deliver it. You&apos;ll get your delivery code once they set off.
              </div>
            )}
          </div>
        )}

        {deliveryDetails && (
          <div className="border border-gl-border rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold text-gl-text mb-0.5">DELIVERING TO</div>
            <div className="text-[11px] text-gl-text">{deliveryDetails.name}</div>
            {deliveryDetails.digitalAddress && (
              <div className="text-[11px] font-semibold text-gl-text">{deliveryDetails.digitalAddress}</div>
            )}
            {deliveryDetails.landmark && (
              <div className="text-[10px] text-gl-text-secondary">{deliveryDetails.landmark}</div>
            )}
            {deliveryDetails.pin && (
              <div className="text-[10px] text-gl-brand font-semibold">📍 Location shared</div>
            )}
          </div>
        )}

        {group.paymentMethod === "cash_on_delivery" && group.status !== "delivered" && (
          <div className="border border-gl-border rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold text-gl-text mb-0.5">CASH ON DELIVERY</div>
            <div className="text-[11px] text-gl-text-secondary">
              Pay GHS {groupPayable(group).toLocaleString("en-GH")} in cash to your rider when your order arrives.
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
                  {delivery.status === "at_dropoff"
                    ? "Your rider has arrived"
                    : etaMinutesLeft === null
                      ? ""
                      : etaMinutesLeft > 0
                        ? `Estimated arrival in about ${etaMinutesLeft} min`
                        : "Arriving any moment now"}
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

        {groupRefunds.map((r) => (
          <div key={r.id} className="border border-gl-border rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold text-gl-text mb-0.5">
              REFUND · GHS {r.amountGHS.toLocaleString("en-GH")}
            </div>
            <div className={`text-[11px] ${r.status === "paid" ? "text-gl-green" : "text-gl-amber"} font-semibold`}>
              {r.status === "paid"
                ? `Sent by ${r.paidBy === "staff" ? "GRAPPlive" : r.sellerName}`
                : `Waiting for ${r.owner === "seller" ? r.sellerName : "GRAPPlive"} to send it`}
            </div>
            <div className="text-[10px] text-gl-text-secondary mt-0.5">{r.reason}</div>
          </div>
        ))}

        {delivery?.status === "delivered" && delivery.riderName && <RateRider delivery={delivery} />}

        {group.status === "delivered" && !dispute && <ReportProblem groupId={group.id} />}
        {dispute && <DisputeStatus dispute={dispute} />}

        {delivery?.status === "returning" && delivery.failureReason && (
          <div className="border border-gl-border rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold text-gl-amber mb-0.5">DELIVERY ATTEMPT FAILED</div>
            <div className="text-[11px] text-gl-text">{failureReasonLabels[delivery.failureReason]}</div>
            <div className="text-[10px] text-gl-text-secondary">
              Your rider is taking the order back to the seller, who will arrange next steps with you.
            </div>
          </div>
        )}

        {group.status === "ready_for_pickup" &&
          (delivery?.status === "failed" || delivery?.status === "returned") &&
          delivery.failureReason && (
            <div className="border border-gl-border rounded-lg p-3 mb-4">
              <div className="text-[10px] font-semibold text-gl-amber mb-0.5">DELIVERY ATTEMPT FAILED</div>
              <div className="text-[11px] text-gl-text">{failureReasonLabels[delivery.failureReason]}</div>
              <div className="text-[10px] text-gl-text-secondary">The seller has been told and will arrange next steps.</div>
            </div>
          )}

        {group.status === "cancelled" && (
          <div className="border border-gl-border rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold text-gl-text-secondary mb-0.5">ORDER CANCELLED</div>
            <div className="text-[10px] text-gl-text-secondary">You cancelled this order. Nothing was charged.</div>
          </div>
        )}

        {canCancel && <CancelOrder groupId={group.id} refundNote={refundNote} />}

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
