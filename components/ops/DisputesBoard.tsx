"use client";

import { useState } from "react";
import { useDisputesStore } from "@/lib/store/useDisputesStore";
import { useRefundsStore } from "@/lib/store/useRefundsStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useDeliveryStore, latestDeliveryForGroup } from "@/lib/store/useDeliveryStore";
import { useNow } from "@/lib/hooks/useNow";
import { disputeAttention, refundAttention } from "@/lib/delivery/ops";
import { disputeReasonLabels, type Dispute } from "@/lib/mock-data/disputes";
import { flattenGroups, groupPayable, paymentMethodLabel } from "@/lib/mock-data/orders";
import { refundSourceLabels, type Refund } from "@/lib/mock-data/refunds";

function formatWhen(ms: number) {
  return new Date(ms).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const ghs = (n: number) => `GHS ${n.toLocaleString("en-GH")}`;

function DisputeCard({ dispute, nowMs }: { dispute: Dispute; nowMs: number }) {
  const staffResolve = useDisputesStore((s) => s.staffResolve);
  const orders = useOrdersStore((s) => s.orders);
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const group = flattenGroups(orders).find((g) => g.id === dispute.orderGroupId);
  const delivery = latestDeliveryForGroup(deliveries, dispute.orderGroupId);
  const deliveredAt = delivery?.history.find((h) => h.status === "delivered")?.at;
  const payable = group ? groupPayable(group) : 0;
  const reasons = disputeAttention(dispute, nowMs);

  const decide = (outcome: "refunded" | "rejected") => {
    const parsed = amount.trim() === "" ? undefined : Number(amount);
    const result = staffResolve(dispute.id, outcome, { amountGHS: parsed, note });
    setMessage(
      result === "ok"
        ? "Decision recorded."
        : result === "forbidden"
          ? "Only GRAPPlive staff can do this."
          : "Couldn't record that — check the refund amount (it can't be more than the buyer paid)."
    );
  };

  return (
    <div className={`mx-3 md:mx-5 mb-2 border rounded-lg p-3 ${dispute.status === "open" ? "border-gl-amber" : "border-gl-border"}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="text-[12px] font-semibold text-gl-text">
          {dispute.sellerName} · {disputeReasonLabels[dispute.reason]}
        </div>
        <span className="text-[10px] font-semibold text-gl-text-secondary shrink-0">
          {dispute.status === "open" ? "Open" : dispute.status === "refunded" ? "Refunded" : "Rejected"}
        </span>
      </div>
      <div className="text-[10px] text-gl-text-secondary mt-0.5">
        Order {dispute.orderGroupId} · {group ? `${paymentMethodLabel(group.paymentMethod)} · buyer paid ${ghs(payable)}` : "order not found"} · opened{" "}
        {formatWhen(dispute.createdAt)}
      </div>
      {reasons.map((r) => (
        <div key={r} className="text-[10px] font-semibold text-gl-amber mt-1">
          ⚠ {r}
        </div>
      ))}
      {dispute.details && <div className="text-[11px] text-gl-text mt-1.5">Buyer: &ldquo;{dispute.details}&rdquo;</div>}
      {dispute.sellerResponse ? (
        <div className="text-[11px] text-gl-text mt-1">Seller: &ldquo;{dispute.sellerResponse.text}&rdquo;</div>
      ) : (
        dispute.status === "open" && <div className="text-[10px] text-gl-text-secondary mt-1">The seller hasn&apos;t responded yet.</div>
      )}
      <div className="text-[10px] text-gl-text-secondary mt-1.5">
        Evidence:{" "}
        {delivery?.riderName && deliveredAt
          ? `delivered by ${delivery.riderName} on ${formatWhen(deliveredAt)} using the customer's delivery code`
          : "no delivery record (marked delivered by the seller)"}
        .
      </div>

      {dispute.status === "open" ? (
        <div className="mt-2.5 pt-2.5 border-t border-gl-bg-muted">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder={`Refund amount (default ${ghs(payable)})`}
              className="flex-1 border border-gl-border-strong rounded-lg px-2.5 py-1.5 text-[11px] text-gl-text outline-none focus:border-gl-brand"
            />
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your reasoning (the buyer and seller will see it)"
            className="w-full border border-gl-border-strong rounded-lg px-2.5 py-1.5 text-[11px] text-gl-text outline-none mb-2 focus:border-gl-brand"
          />
          <div className="flex gap-2">
            <button
              onClick={() => decide("refunded")}
              className="bg-gl-brand text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold active:opacity-90"
            >
              Refund the buyer
            </button>
            <button
              onClick={() => decide("rejected")}
              className="border border-gl-border-strong text-gl-red rounded-lg px-3 py-1.5 text-[11px] font-semibold active:bg-gl-bg-muted"
            >
              Reject
            </button>
          </div>
          {message && <p className="text-[10px] text-gl-text-secondary mt-1.5">{message}</p>}
        </div>
      ) : (
        dispute.resolution?.note && <div className="text-[10px] text-gl-text-secondary mt-1.5">Decision: {dispute.resolution.note}</div>
      )}
    </div>
  );
}

function RefundCard({ refund, nowMs }: { refund: Refund; nowMs: number }) {
  const markRefundedByStaff = useRefundsStore((s) => s.markRefundedByStaff);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const reasons = refundAttention(refund, nowMs);

  return (
    <div className={`mx-3 md:mx-5 mb-2 border rounded-lg p-3 ${reasons.length > 0 ? "border-gl-amber" : "border-gl-border"}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="text-[12px] font-semibold text-gl-text">
          {ghs(refund.amountGHS)} · {refund.sellerName}
        </div>
        <span className={`text-[10px] font-semibold shrink-0 ${refund.status === "paid" ? "text-gl-green" : "text-gl-amber"}`}>
          {refund.status === "paid" ? "Refunded" : `Owed by ${refund.owner === "seller" ? "seller" : "GRAPPlive"}`}
        </span>
      </div>
      <div className="text-[10px] text-gl-text-secondary mt-0.5">
        {refundSourceLabels[refund.source]} · order {refund.orderGroupId} · {formatWhen(refund.createdAt)}
      </div>
      {reasons.map((r) => (
        <div key={r} className="text-[10px] font-semibold text-gl-amber mt-1">
          ⚠ {r}
        </div>
      ))}
      {refund.status === "paid" && (
        <div className="text-[10px] text-gl-text-secondary mt-1">
          Sent by {refund.paidBy === "staff" ? "support" : "the seller"}
          {refund.paidAt ? ` · ${formatWhen(refund.paidAt)}` : ""}
          {refund.note ? ` — ${refund.note}` : ""}
        </div>
      )}
      {refund.status === "pending" && (
        <div className="mt-2.5 pt-2.5 border-t border-gl-bg-muted">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — e.g. confirmed with the seller"
            className="w-full border border-gl-border-strong rounded-lg px-2.5 py-1.5 text-[11px] text-gl-text outline-none mb-2 focus:border-gl-brand"
          />
          <button
            onClick={() =>
              setMessage(markRefundedByStaff(refund.id, note) === "ok" ? "Marked as refunded." : "Only GRAPPlive staff can do this.")
            }
            className="bg-gl-brand text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold active:opacity-90"
          >
            Mark as refunded
          </button>
          {message && <span className="text-[10px] text-gl-text-secondary ml-2">{message}</span>}
        </div>
      )}
    </div>
  );
}

export function DisputesBoard() {
  const disputes = useDisputesStore((s) => s.disputes);
  const refunds = useRefundsStore((s) => s.refunds);
  const now = useNow();
  const [showAll, setShowAll] = useState(false);

  const shownDisputes = disputes
    .filter((d) => showAll || d.status === "open")
    .sort((a, b) => b.createdAt - a.createdAt);
  const shownRefunds = refunds
    .filter((r) => showAll || r.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div className="flex gap-1.5 px-3 md:px-5 pb-2">
        {[
          { v: false, label: "Needs action" },
          { v: true, label: "All" },
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

      <h2 className="px-3 md:px-5 pb-1 text-[11px] font-semibold text-gl-text">Buyer disputes</h2>
      {shownDisputes.length === 0 ? (
        <div className="mx-3 md:mx-5 mb-3 text-[10px] text-gl-text-secondary">
          {showAll ? "No disputes yet." : "No open disputes."}
        </div>
      ) : (
        shownDisputes.map((d) => <DisputeCard key={d.id} dispute={d} nowMs={now} />)
      )}

      <h2 className="px-3 md:px-5 pb-1 pt-2 text-[11px] font-semibold text-gl-text">Refunds</h2>
      {shownRefunds.length === 0 ? (
        <div className="mx-3 md:mx-5 text-[10px] text-gl-text-secondary">
          {showAll ? "No refunds yet." : "No refunds waiting."}
        </div>
      ) : (
        shownRefunds.map((r) => <RefundCard key={r.id} refund={r} nowMs={now} />)
      )}
    </div>
  );
}
