"use client";

import { useState } from "react";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import type { FlatOrderGroup } from "@/lib/mock-data/orders";

// Orders a seller can still call off: before a rider has been requested.
const CANCELLABLE: FlatOrderGroup["status"][] = ["awaiting_confirmation", "ready_to_pack", "preparing"];

const reasons = ["Out of stock", "Can't deliver to that area", "Buyer asked to cancel", "Other"];

// A seller (or GrappStore staff) calling off an order they can't fulfil. A paid
// order automatically creates a refund owed to the buyer.
export function SellerCancelOrder({
  group,
  actingSellerId,
}: {
  group: FlatOrderGroup;
  actingSellerId: string;
}) {
  const cancelBySeller = useOrdersStore((s) => s.cancelBySeller);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [error, setError] = useState("");

  if (!CANCELLABLE.includes(group.status)) return null;

  const paid = group.paymentMethod !== "cash_on_delivery";

  const handleConfirm = () => {
    const result = cancelBySeller(group.id, actingSellerId, reason);
    if (result === "not_seller") setError("You can't cancel this order.");
    else if (result !== "ok") setError("This order can't be cancelled any more.");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-3 md:mx-5 mb-3 -mt-1 text-[10px] font-semibold text-gl-red active:opacity-60"
      >
        Cancel this order
      </button>
    );
  }

  return (
    <div className="mx-3 md:mx-5 mb-3 -mt-1 border border-gl-border rounded-lg p-3">
      <div className="text-[11px] font-semibold text-gl-text mb-1.5">Why are you cancelling?</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {reasons.map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={`border rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              reason === r ? "border-gl-brand text-gl-brand border-[1.5px]" : "border-gl-border text-gl-text-secondary"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <p className="text-[9px] text-gl-text-secondary mb-2">
        {paid
          ? "The buyer has paid, so they'll be owed a refund."
          : "The buyer hasn't paid (cash on delivery), so nothing needs refunding."}
      </p>
      {error && <p className="text-[10px] text-gl-red mb-1.5">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          className="flex-1 bg-gl-red text-white rounded-lg py-2 text-[11px] font-semibold active:opacity-90"
        >
          Cancel the order
        </button>
        <button
          onClick={() => setOpen(false)}
          className="flex-1 border border-gl-border-strong text-gl-text rounded-lg py-2 text-[11px] font-semibold active:bg-gl-bg-muted"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
