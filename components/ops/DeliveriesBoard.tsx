"use client";

import { useState } from "react";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useNow } from "@/lib/hooks/useNow";
import {
  ACTIVE_DELIVERY_STATUSES,
  STAFF_CAN_INTERVENE,
  type Delivery,
} from "@/lib/mock-data/deliveries";
import { slotLabel } from "@/lib/mock-data/deliverySlots";
import { actorLabels, deliveryAttention, deliveryTimeline, opsStatusLabels } from "@/lib/delivery/ops";

type Filter = "attention" | "open" | "active" | "scheduled" | "all";

const filters: { value: Filter; label: string }[] = [
  { value: "attention", label: "Needs attention" },
  { value: "open", label: "Open" },
  { value: "active", label: "In progress" },
  { value: "scheduled", label: "Scheduled" },
  { value: "all", label: "All" },
];

function formatWhen(ms: number) {
  return new Date(ms).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function DeliveryCard({ delivery, nowMs }: { delivery: Delivery; nowMs: number }) {
  const staffReassign = useDeliveryStore((s) => s.staffReassign);
  const staffCancel = useDeliveryStore((s) => s.staffCancel);
  const staffConfirmParcelReceived = useDeliveryStore((s) => s.staffConfirmParcelReceived);
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [message, setMessage] = useState("");

  const reasons = deliveryAttention(delivery, nowMs);
  const canIntervene = STAFF_CAN_INTERVENE.includes(delivery.status);
  const needsReturnConfirm = delivery.status === "returned" && delivery.returnConfirmedAt === undefined;
  const run = (result: "ok" | "invalid" | "forbidden") => {
    if (result === "ok") {
      setMessage("Done.");
      setNote("");
      setConfirmingCancel(false);
    } else {
      setMessage(result === "forbidden" ? "Only GRAPPlive staff can do this." : "That can't be done in this state.");
    }
  };

  return (
    <div className={`mx-3 md:mx-5 mb-2 border rounded-lg p-3 ${reasons.length > 0 ? "border-gl-amber" : "border-gl-border"}`}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex justify-between items-start gap-2">
          <div className="text-[12px] font-semibold text-gl-text">
            {delivery.sellerName} → {delivery.dropoffArea}
          </div>
          <span className="text-[10px] font-semibold text-gl-brand shrink-0">{opsStatusLabels[delivery.status]}</span>
        </div>
        <div className="text-[10px] text-gl-text-secondary mt-0.5">
          #{delivery.id} · {delivery.riderName ?? "no rider yet"} · started {formatWhen(delivery.createdAt)}
          {delivery.slot ? ` · 📅 ${slotLabel(delivery.slot)}` : ""}
        </div>
        {reasons.map((r) => (
          <div key={r} className="text-[10px] font-semibold text-gl-amber mt-1">
            ⚠ {r}
          </div>
        ))}
      </button>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-gl-bg-muted">
          <div className="text-[10px] font-semibold text-gl-text mb-1.5">Timeline</div>
          {deliveryTimeline(delivery).map((e, i) => (
            <div key={i} className="text-[10px] text-gl-text-secondary mb-1">
              <span className="text-gl-text">{formatWhen(e.at)}</span> · {actorLabels[e.by]} ·{" "}
              {e.from ? `${opsStatusLabels[e.from]} → ` : ""}
              <span className="font-semibold text-gl-text">{opsStatusLabels[e.to]}</span>
              {e.note ? ` — ${e.note}` : ""}
            </div>
          ))}

          {(canIntervene || needsReturnConfirm) && (
            <div className="mt-2.5">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason (optional, kept in the timeline)"
                className="w-full border border-gl-border-strong rounded-lg px-2.5 py-1.5 text-[11px] text-gl-text outline-none mb-2 focus:border-gl-brand"
              />
              <div className="flex flex-wrap gap-2">
                {canIntervene && (
                  <button
                    onClick={() => run(staffReassign(delivery.id, note.trim() || undefined))}
                    className="border border-gl-brand text-gl-brand rounded-lg px-3 py-1.5 text-[11px] font-semibold active:bg-gl-brand-soft-bg"
                  >
                    {delivery.status === "offered" ? "Send out again" : "Reassign to another rider"}
                  </button>
                )}
                {canIntervene && (
                  <button
                    onClick={() => {
                      if (!confirmingCancel) setConfirmingCancel(true);
                      else run(staffCancel(delivery.id, note.trim() || undefined));
                    }}
                    className="border border-gl-border-strong text-gl-red rounded-lg px-3 py-1.5 text-[11px] font-semibold active:bg-gl-bg-muted"
                  >
                    {confirmingCancel ? "Tap again to cancel" : "Cancel delivery"}
                  </button>
                )}
                {needsReturnConfirm && (
                  <button
                    onClick={() => run(staffConfirmParcelReceived(delivery.id, note.trim() || undefined))}
                    className="bg-gl-brand text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold active:opacity-90"
                  >
                    Confirm parcel received
                  </button>
                )}
              </div>
              {message && <p className="text-[10px] text-gl-text-secondary mt-1.5">{message}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DeliveriesBoard() {
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const now = useNow();
  const [filter, setFilter] = useState<Filter>("attention");

  const matches = (d: Delivery) => {
    switch (filter) {
      case "attention":
        return deliveryAttention(d, now).length > 0;
      case "open":
        return d.status === "offered" && !d.slot;
      case "active":
        return ACTIVE_DELIVERY_STATUSES.includes(d.status);
      case "scheduled":
        return d.slot !== undefined && (d.status === "offered" || d.status === "scheduled");
      default:
        return true;
    }
  };
  const shown = deliveries.filter(matches).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto px-3 md:px-5 pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 border rounded-full px-3 py-1 text-[11px] font-semibold ${
              filter === f.value ? "border-gl-brand text-gl-brand border-[1.5px]" : "border-gl-border text-gl-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="mx-3 md:mx-5 border border-dashed border-gl-border-strong rounded-lg px-4 py-8 text-center text-[11px] text-gl-text-secondary">
          {filter === "attention" ? "Nothing needs attention right now." : "No deliveries here."}
        </div>
      ) : (
        shown.map((d) => <DeliveryCard key={d.id} delivery={d} nowMs={now} />)
      )}
    </div>
  );
}
