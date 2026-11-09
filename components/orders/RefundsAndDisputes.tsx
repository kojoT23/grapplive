"use client";

import { useState } from "react";
import { pendingForSeller, useRefundsStore } from "@/lib/store/useRefundsStore";
import { openForSeller, useDisputesStore } from "@/lib/store/useDisputesStore";
import { disputeReasonLabels, type Dispute } from "@/lib/mock-data/disputes";

function DisputeCard({ dispute, sellerId }: { dispute: Dispute; sellerId: string }) {
  const respond = useDisputesStore((s) => s.respondToDispute);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="border-[1.5px] border-gl-amber rounded-lg p-3 mb-2">
      <div className="text-[10px] font-semibold text-gl-amber mb-0.5">
        BUYER REPORTED A PROBLEM · {disputeReasonLabels[dispute.reason].toUpperCase()}
      </div>
      {dispute.details && <div className="text-[11px] text-gl-text mb-1">&ldquo;{dispute.details}&rdquo;</div>}
      <div className="text-[10px] text-gl-text-secondary mb-2">
        Order {dispute.orderGroupId}. GRAPPlive will decide; your side helps them.
      </div>
      {dispute.sellerResponse ? (
        <div className="text-[10px] text-gl-text-secondary">
          Your response: <span className="text-gl-text">{dispute.sellerResponse.text}</span>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            maxLength={500}
            placeholder="Your side of the story"
            className="w-full border border-gl-border-strong rounded-lg px-2.5 py-1.5 text-[11px] text-gl-text outline-none mb-1.5 focus:border-gl-brand"
          />
          {error && <p className="text-[10px] text-gl-red mb-1">{error}</p>}
          <button
            onClick={() => setError(respond(dispute.id, sellerId, text) === "ok" ? "" : "Write a response first.")}
            className="w-full bg-gl-brand text-white rounded-lg py-2 text-[11px] font-semibold active:opacity-90"
          >
            Send response
          </button>
        </>
      )}
    </div>
  );
}

// On a seller's Orders page: refunds they owe buyers (Direct MoMo orders they
// were paid for directly), and open disputes they can respond to.
export function RefundsAndDisputes({ sellerId }: { sellerId: string }) {
  const refunds = useRefundsStore((s) => s.refunds);
  const markRefundedBySeller = useRefundsStore((s) => s.markRefundedBySeller);
  const disputes = useDisputesStore((s) => s.disputes);

  const owed = pendingForSeller(refunds, sellerId);
  const open = openForSeller(disputes, sellerId);
  if (owed.length === 0 && open.length === 0) return null;

  return (
    <div className="mx-3 md:mx-5 mb-3">
      {open.map((d) => (
        <DisputeCard key={d.id} dispute={d} sellerId={sellerId} />
      ))}
      {owed.map((r) => (
        <div key={r.id} className="border-[1.5px] border-gl-brand rounded-lg p-3 bg-gl-brand-soft-bg mb-2">
          <div className="text-[10px] font-semibold text-gl-brand-soft-text mb-0.5">REFUND TO SEND</div>
          <div className="text-[11px] text-gl-text mb-0.5">
            Send GHS {r.amountGHS.toLocaleString("en-GH")} back to the buyer for order {r.orderGroupId}.
          </div>
          <div className="text-[10px] text-gl-text-secondary mb-2">{r.reason}</div>
          <button
            onClick={() => markRefundedBySeller(r.id, sellerId)}
            className="w-full bg-gl-brand text-white rounded-lg py-2 text-[11px] font-semibold active:opacity-90"
          >
            I&apos;ve sent the refund
          </button>
        </div>
      ))}
    </div>
  );
}
