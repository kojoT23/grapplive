"use client";

import { useState } from "react";
import { useCashLedgerStore } from "@/lib/store/useCashLedgerStore";
import { useNow } from "@/lib/hooks/useNow";
import { cashAttention } from "@/lib/delivery/ops";
import type { CashEntry, CashEntryStatus } from "@/lib/mock-data/cash";

const statusLabels: Record<CashEntryStatus, string> = {
  held: "With rider",
  handover_pending: "Handover pending",
  settled: "Settled",
  disputed: "Disputed",
  rider_liable: "Rider liable",
};

function formatWhen(ms: number) {
  return new Date(ms).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function CashCard({ entry, nowMs }: { entry: CashEntry; nowMs: number }) {
  const staffResolveDispute = useCashLedgerStore((s) => s.staffResolveDispute);
  const staffMarkRepaid = useCashLedgerStore((s) => s.staffMarkRepaid);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const reasons = cashAttention(entry, nowMs);
  const actionable = entry.status === "disputed" || entry.status === "rider_liable";

  const run = (result: "ok" | "invalid" | "forbidden") =>
    setMessage(
      result === "ok" ? "Recorded." : result === "forbidden" ? "Only GRAPPlive staff can do this." : "That can't be done in this state."
    );

  return (
    <div className={`mx-3 md:mx-5 mb-2 border rounded-lg p-3 ${reasons.length > 0 ? "border-gl-amber" : "border-gl-border"}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="text-[12px] font-semibold text-gl-text">
          {entry.riderName} → {entry.sellerName}
        </div>
        <span className="text-[12px] font-semibold text-gl-text shrink-0">GHS {entry.amountGHS.toLocaleString("en-GH")}</span>
      </div>
      <div className="text-[10px] text-gl-text-secondary mt-0.5">
        {statusLabels[entry.status]} · collected {formatWhen(entry.collectedAt)} · order {entry.orderGroupId}
      </div>
      {reasons.map((r) => (
        <div key={r} className="text-[10px] font-semibold text-gl-amber mt-1">
          ⚠ {r}
        </div>
      ))}
      {entry.staffNote && <div className="text-[10px] text-gl-text-secondary mt-1">Support note: {entry.staffNote}</div>}

      {actionable && (
        <div className="mt-2.5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you found (optional, kept on the record)"
            className="w-full border border-gl-border-strong rounded-lg px-2.5 py-1.5 text-[11px] text-gl-text outline-none mb-2 focus:border-gl-brand"
          />
          <div className="flex flex-wrap gap-2">
            {entry.status === "disputed" && (
              <>
                <button
                  onClick={() => run(staffResolveDispute(entry.id, "settled", note))}
                  className="bg-gl-brand text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold active:opacity-90"
                >
                  Cash was received
                </button>
                <button
                  onClick={() => run(staffResolveDispute(entry.id, "rider_liable", note))}
                  className="border border-gl-border-strong text-gl-red rounded-lg px-3 py-1.5 text-[11px] font-semibold active:bg-gl-bg-muted"
                >
                  Hold rider responsible
                </button>
              </>
            )}
            {entry.status === "rider_liable" && (
              <button
                onClick={() => run(staffMarkRepaid(entry.id, note))}
                className="bg-gl-brand text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold active:opacity-90"
              >
                Rider has repaid
              </button>
            )}
          </div>
          {message && <p className="text-[10px] text-gl-text-secondary mt-1.5">{message}</p>}
        </div>
      )}
    </div>
  );
}

export function CashBoard() {
  const entries = useCashLedgerStore((s) => s.entries);
  const now = useNow();
  const [showAll, setShowAll] = useState(false);

  const shown = entries
    .filter((e) => showAll || cashAttention(e, now).length > 0)
    .sort((a, b) => b.collectedAt - a.collectedAt);

  return (
    <div>
      <div className="flex gap-1.5 px-3 md:px-5 pb-2">
        {[
          { v: false, label: "Needs attention" },
          { v: true, label: "All cash" },
        ].map((f) => (
          <button
            key={f.label}
            onClick={() => setShowAll(f.v)}
            className={`border rounded-full px-3 py-1 text-[11px] font-semibold ${
              showAll === f.v ? "border-gl-brand text-gl-brand border-[1.5px]" : "border-gl-border text-gl-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="mx-3 md:mx-5 border border-dashed border-gl-border-strong rounded-lg px-4 py-8 text-center text-[11px] text-gl-text-secondary">
          {showAll ? "No cash collected yet." : "No cash needs attention."}
        </div>
      ) : (
        shown.map((e) => <CashCard key={e.id} entry={e} nowMs={now} />)
      )}
    </div>
  );
}
