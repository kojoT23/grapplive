"use client";

import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCurrentRider } from "@/lib/hooks/useCurrentRider";
import { riderTabs } from "@/lib/nav/rider-tabs";
import { useDeliveryStore, historyFor } from "@/lib/store/useDeliveryStore";
import { failureReasonLabels } from "@/lib/mock-data/deliveries";
import { earnedFeeGHS } from "@/lib/delivery/earnings";

function formatWhen(ms: number) {
  return new Date(ms).toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RiderHistoryPage() {
  const { isChecking } = useRequireAuth("deliver");
  const { rider, hasHydrated: riderHydrated } = useCurrentRider();
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const deliveriesHydrated = useDeliveryStore((s) => s.hasHydrated);

  if (isChecking || !riderHydrated || !deliveriesHydrated) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const history = rider ? historyFor(deliveries, rider.id) : [];

  return (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">History</h1>

      {history.length === 0 ? (
        <div className="mx-3 md:mx-5 border border-dashed border-gl-border-strong rounded-lg px-4 py-8 text-center">
          <div className="text-[12px] font-semibold text-gl-text mb-1">No deliveries yet</div>
          <div className="text-[10px] text-gl-text-secondary">Finished, failed and cancelled deliveries show up here.</div>
        </div>
      ) : (
        history.map((d) => {
          const delivered = d.status === "delivered";
          const earned = earnedFeeGHS(d);
          const outcome =
            d.status === "returned" ? "Returned" : d.status === "cancelled" ? "Cancelled" : "Failed";
          // A returned parcel pays once the seller has confirmed it's back.
          const awaitingSeller = d.status === "returned" && d.returnConfirmedAt === undefined;
          const doneAt = d.history[d.history.length - 1]?.at ?? d.createdAt;
          return (
            <div key={d.id} className="mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3">
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-[12px] font-semibold text-gl-text">
                  {d.sellerName} → {d.dropoffArea}
                </span>
                <span className={`text-[11px] font-semibold ${delivered ? "text-gl-green" : "text-gl-amber"}`}>
                  {delivered ? `+GHS ${d.feeGHS}` : earned > 0 ? `+GHS ${earned}` : outcome}
                </span>
              </div>
              <div className="text-[10px] text-gl-text-secondary">
                {formatWhen(doneAt)}
                {!delivered && d.failureReason ? ` · ${failureReasonLabels[d.failureReason]}` : ""}
                {d.status === "cancelled" ? " · Cancelled by the seller" : ""}
                {!delivered && earned > 0 ? ` · ${outcome}, half fee paid` : ""}
                {awaitingSeller ? " · Half fee once the seller confirms the parcel is back" : ""}
                {d.codAmountGHS > 0 && delivered ? ` · Collected GHS ${d.codAmountGHS} cash` : ""}
                {d.rating ? ` · Rated ${"★".repeat(d.rating.stars)}${"☆".repeat(5 - d.rating.stars)}` : ""}
              </div>
            </div>
          );
        })
      )}

      <TabBar tabs={riderTabs} activeHref="/rider/history" />
    </div>
  );
}
