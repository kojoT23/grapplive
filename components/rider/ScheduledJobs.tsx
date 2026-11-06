"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCash } from "@tabler/icons-react";
import {
  useDeliveryStore,
  claimedScheduledFor,
  openScheduledFor,
} from "@/lib/store/useDeliveryStore";
import { formatDateKey, isSlotToday, slotLabel } from "@/lib/mock-data/deliverySlots";
import type { Delivery } from "@/lib/mock-data/deliveries";

// Scheduled delivery, rider's side. Jobs the buyer booked for a chosen day are
// not live offers: a rider CLAIMS them ahead of time (several for the same day
// is fine — each stop pays on its own), then STARTS each one on the day, one at
// a time. They can hand a claimed job back until they start it.
export function ScheduledJobs({
  riderId,
  riderArea,
  deliveries,
  nowMs,
  hasActive,
}: {
  riderId: string;
  riderArea: string;
  deliveries: Delivery[];
  nowMs: number;
  hasActive: boolean;
}) {
  const router = useRouter();
  const claimScheduled = useDeliveryStore((s) => s.claimScheduled);
  const startScheduledStop = useDeliveryStore((s) => s.startScheduledStop);
  const releaseJob = useDeliveryStore((s) => s.releaseJob);
  const [message, setMessage] = useState<Record<string, string>>({});
  const [confirmingHandBack, setConfirmingHandBack] = useState<string | null>(null);

  const claimed = claimedScheduledFor(deliveries, riderId);
  const open = openScheduledFor(deliveries, riderId, riderArea);
  if (claimed.length === 0 && open.length === 0) return null;

  const say = (id: string, text: string) => setMessage((m) => ({ ...m, [id]: text }));

  const handleClaim = (id: string) => {
    const result = claimScheduled(id, riderId);
    if (result === "ok") say(id, "");
    else if (result === "cash_limit") say(id, "Hand over the cash you're holding (Earnings tab) before claiming more jobs.");
    else say(id, "That job is no longer available.");
  };

  const handleStart = (id: string) => {
    const result = startScheduledStop(id, riderId);
    if (result === "ok") router.push("/rider/active");
    else if (result === "busy") say(id, "Finish your current delivery first.");
    else if (result === "not_today") say(id, "You can only start this on its delivery day.");
    else say(id, "This job can't be started.");
  };

  const handleHandBack = (id: string) => {
    if (confirmingHandBack !== id) {
      setConfirmingHandBack(id);
      return;
    }
    releaseJob(id, riderId);
    setConfirmingHandBack(null);
  };

  return (
    <div className="mt-4">
      {claimed.length > 0 && (
        <>
          <h2 className="px-3 md:px-5 pb-1 text-[11px] font-semibold text-gl-text">Your scheduled deliveries</h2>
          {claimed.map((d) => {
            const today = isSlotToday(d.slot!, nowMs);
            return (
              <div key={d.id} className="mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3">
                <div className={`text-[10px] font-semibold mb-0.5 ${today ? "text-gl-brand" : "text-gl-text-secondary"}`}>
                  {today ? "TODAY · " : ""}
                  {slotLabel(d.slot!)}
                </div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[12px] font-semibold text-gl-text">
                      {d.sellerName} → {d.dropoffArea}
                    </div>
                    <div className="text-[10px] text-gl-text-secondary">You earn GHS {d.feeGHS}</div>
                  </div>
                  {d.codAmountGHS > 0 && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gl-amber">
                      <IconCash size={12} /> Collect GHS {d.codAmountGHS}
                    </span>
                  )}
                </div>
                {today ? (
                  <button
                    onClick={() => handleStart(d.id)}
                    disabled={hasActive}
                    className="w-full bg-gl-brand text-white rounded-lg py-2 text-[12px] font-semibold active:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {hasActive ? "Finish your current delivery first" : "Start this stop"}
                  </button>
                ) : (
                  <div className="text-[10px] text-gl-text-secondary">
                    You can start this on {formatDateKey(d.slot!.date)}.
                  </div>
                )}
                {message[d.id] && <p className="text-[10px] text-gl-red mt-1.5">{message[d.id]}</p>}
                <button
                  onClick={() => handleHandBack(d.id)}
                  className="w-full text-gl-text-secondary text-[10px] font-semibold pt-2 active:opacity-60"
                >
                  {confirmingHandBack === d.id ? "Tap again to hand this job back" : "Hand this job back"}
                </button>
              </div>
            );
          })}
        </>
      )}

      {open.length > 0 && (
        <>
          <h2 className="px-3 md:px-5 pb-1 pt-1 text-[11px] font-semibold text-gl-text">Scheduled jobs you can claim</h2>
          {open.map((d) => (
            <div key={d.id} className="mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3">
              <div className="text-[10px] font-semibold text-gl-text-secondary mb-0.5">{slotLabel(d.slot!)}</div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-[12px] font-semibold text-gl-text">{d.sellerName}</div>
                  <div className="text-[10px] text-gl-text-secondary">
                    Pickup {d.pickupArea} · Drop-off {d.dropoffArea}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-gl-text-secondary">You earn</div>
                  <div className="text-[14px] font-bold text-gl-text">GHS {d.feeGHS}</div>
                </div>
              </div>
              {message[d.id] && <p className="text-[10px] text-gl-red mb-1.5">{message[d.id]}</p>}
              <button
                onClick={() => handleClaim(d.id)}
                className="w-full border border-gl-brand text-gl-brand rounded-lg py-2 text-[12px] font-semibold active:bg-gl-brand-soft-bg transition-colors"
              >
                Claim this job
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
