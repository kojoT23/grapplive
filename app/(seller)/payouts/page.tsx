"use client";

import { IconRosetteDiscountCheck, IconClock } from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { sellerTabs } from "@/lib/nav/seller-tabs";
import { availableBalanceGHS, momoDetails, payoutHistory, type PayoutRecord } from "@/lib/mock-data/payouts";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

function PayoutRow({ record }: { record: PayoutRecord }) {
  const statusDisplay = {
    paid_out: { label: "● Paid out", className: "text-gl-green" },
    pending_release: { label: "● Pending release", className: "text-gl-amber" },
    direct_momo_untracked: { label: "Not tracked here", className: "text-gl-text-muted" },
  }[record.status];

  return (
    <div className="flex items-center justify-between py-2 border-b border-gl-bg-muted last:border-b-0">
      <div>
        <div className="text-[11px] text-gl-text">{formatGHS(record.amountGHS)}</div>
        <div className="text-[9px] text-gl-text-secondary">{record.detail}</div>
      </div>
      <span className={`text-[9px] font-semibold ${statusDisplay.className}`}>
        {statusDisplay.label}
      </span>
    </div>
  );
}

export default function PayoutsPage() {
  const { isChecking } = useRequireAuth("sell");

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">Payouts</h1>

      <div className="mx-3 md:mx-5 mb-2.5 bg-[#0B0B0B] rounded-lg p-3.5">
        <div className="text-[9px] text-white/60 mb-0.5">Available balance</div>
        <div className="text-[22px] font-semibold text-white mb-2.5">
          {formatGHS(availableBalanceGHS)}
        </div>
        <button className="w-full bg-gl-brand text-white rounded-md py-2 text-[11px] font-semibold active:opacity-80 transition-opacity">
          Request payout
        </button>
      </div>

      <div className="mx-3 md:mx-5 mb-2.5 border border-gl-border rounded-lg px-3 py-2.5">
        <div className="text-[9px] text-gl-text-secondary mb-1">Verified MoMo number</div>
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-gl-text flex items-center gap-1">
            {momoDetails.numberMasked}
            {momoDetails.isVerified && (
              <IconRosetteDiscountCheck size={13} className="text-gl-green" />
            )}
          </span>
          <button className="text-[9px] font-semibold text-gl-brand active:opacity-70 transition-opacity">
            Change
          </button>
        </div>
      </div>

      {momoDetails.pendingChange && (
        <div className="mx-3 md:mx-5 mb-3 bg-gl-amber-soft-bg border border-gl-amber rounded-lg px-3 py-2.5">
          <div className="text-[9px] font-semibold text-gl-amber-soft-text mb-0.5 flex items-center gap-1">
            <IconClock size={12} />
            Number change pending
          </div>
          <div className="text-[9px] text-gl-amber-soft-text">
            New number active in {momoDetails.pendingChange.hoursRemaining}h{" "}
            {momoDetails.pendingChange.minutesRemaining}m — security cooling-off period
          </div>
        </div>
      )}

      <h2 className="px-3 md:px-5 pb-1 text-[11px] font-semibold text-gl-text">Payout history</h2>
      <div className="px-3 md:px-5">
        {payoutHistory.map((record) => (
          <PayoutRow key={record.id} record={record} />
        ))}
      </div>

      <TabBar tabs={sellerTabs} activeHref="/payouts" />
    </div>
  );
}
