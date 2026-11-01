"use client";

import { useCashLedgerStore, pendingForSeller } from "@/lib/store/useCashLedgerStore";

// Shown on a seller's (or GrappStore's) orders page when a rider says they've
// handed over cash from a cash-on-delivery order. Nothing is settled until
// the receiving seller confirms — a rider can't close their own cash trail.
export function CashToConfirm({ sellerId }: { sellerId: string }) {
  const entries = useCashLedgerStore((s) => s.entries);
  const confirmReceived = useCashLedgerStore((s) => s.confirmReceived);
  const pending = pendingForSeller(entries, sellerId);

  if (pending.length === 0) return null;

  return (
    <div className="mx-3 md:mx-5 mb-3">
      {pending.map((e) => (
        <div key={e.id} className="border-[1.5px] border-gl-brand rounded-lg p-3 bg-gl-brand-soft-bg mb-2">
          <div className="text-[10px] font-semibold text-gl-brand-soft-text mb-0.5">CASH FROM A RIDER</div>
          <div className="text-[11px] text-gl-text mb-2">
            {e.riderName} says they handed you GHS {e.amountGHS.toLocaleString("en-GH")} for order{" "}
            {e.orderGroupId}.
          </div>
          <button
            onClick={() => confirmReceived(e.id, sellerId)}
            className="w-full bg-gl-brand text-white rounded-lg py-2 text-[11px] font-semibold active:opacity-90"
          >
            I received the cash
          </button>
        </div>
      ))}
    </div>
  );
}
