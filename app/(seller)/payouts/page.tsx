"use client";

import { useState } from "react";
import { IconRosetteDiscountCheck, IconClock, IconX } from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { sellerTabs } from "@/lib/nav/seller-tabs";
import { usePayoutsStore } from "@/lib/store/usePayoutsStore";
import { type PayoutRecord } from "@/lib/mock-data/payouts";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

// Best-effort mock masking only — not real MoMo/carrier validation.
// Keeps the first 3 digits (network prefix) and last 4, masks the middle.
function maskMomoNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7) return digits;
  const first3 = digits.slice(0, 3);
  const last4 = digits.slice(-4);
  return `${first3} XXX ${last4}`;
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

  const balanceGHS = usePayoutsStore((s) => s.balanceGHS);
  const momoDetails = usePayoutsStore((s) => s.momoDetails);
  const history = usePayoutsStore((s) => s.history);
  const hasHydrated = usePayoutsStore((s) => s.hasHydrated);
  const requestPayout = usePayoutsStore((s) => s.requestPayout);
  const updateMomoNumber = usePayoutsStore((s) => s.updateMomoNumber);

  const [showConfirmPayout, setShowConfirmPayout] = useState(false);
  const [isEditingMomo, setIsEditingMomo] = useState(false);
  const [momoInput, setMomoInput] = useState("");

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const handleConfirmPayout = () => {
    requestPayout();
    setShowConfirmPayout(false);
  };

  const handleSaveMomo = () => {
    const masked = maskMomoNumber(momoInput);
    if (!masked) return;
    updateMomoNumber(masked);
    setMomoInput("");
    setIsEditingMomo(false);
  };

  const handleCancelMomoEdit = () => {
    setMomoInput("");
    setIsEditingMomo(false);
  };

  const canRequestPayout = hasHydrated && balanceGHS > 0;

  return (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">Payouts</h1>

      <div className="mx-3 md:mx-5 mb-2.5 bg-[#0B0B0B] rounded-lg p-3.5">
        <div className="text-[9px] text-white/60 mb-0.5">Available balance</div>
        <div className="text-[22px] font-semibold text-white mb-2.5">
          {hasHydrated ? formatGHS(balanceGHS) : <span className="inline-block w-20 h-[22px] bg-white/10 rounded gl-shimmer" />}
        </div>
        <button
          onClick={() => setShowConfirmPayout(true)}
          disabled={!canRequestPayout}
          className="w-full bg-gl-brand text-white rounded-md py-2 text-[11px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
        >
          Request payout
        </button>
      </div>

      <div className="mx-3 md:mx-5 mb-2.5 border border-gl-border rounded-lg px-3 py-2.5">
        <div className="text-[9px] text-gl-text-secondary mb-1">Verified MoMo number</div>
        {isEditingMomo ? (
          <div className="flex flex-col gap-2">
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={momoInput}
              onChange={(e) => setMomoInput(e.target.value)}
              placeholder="e.g. 024 123 4567"
              className="w-full border border-gl-border-strong rounded-md px-2.5 py-1.5 text-[12px] text-gl-text outline-none focus:border-gl-brand"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCancelMomoEdit}
                className="flex-1 border border-gl-border-strong text-gl-text text-[10px] font-semibold py-1.5 rounded-md active:bg-gl-bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMomo}
                disabled={momoInput.replace(/\D/g, "").length < 7}
                className="flex-1 bg-gl-brand text-white text-[10px] font-semibold py-1.5 rounded-md active:opacity-80 transition-opacity disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-gl-text flex items-center gap-1">
              {momoDetails.numberMasked}
              {momoDetails.isVerified && (
                <IconRosetteDiscountCheck size={13} className="text-gl-green" />
              )}
            </span>
            <button
              onClick={() => setIsEditingMomo(true)}
              className="text-[9px] font-semibold text-gl-brand active:opacity-70 transition-opacity"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {momoDetails.pendingChange && (
        <div className="mx-3 md:mx-5 mb-3 bg-gl-amber-soft-bg border border-gl-amber rounded-lg px-3 py-2.5">
          <div className="text-[9px] font-semibold text-gl-amber-soft-text mb-0.5 flex items-center gap-1">
            <IconClock size={12} />
            Number change pending
          </div>
          <div className="text-[9px] text-gl-amber-soft-text">
            {momoDetails.pendingChange.newNumberMasked
              ? `Changing to ${momoDetails.pendingChange.newNumberMasked} in `
              : "New number active in "}
            {momoDetails.pendingChange.hoursRemaining}h{" "}
            {momoDetails.pendingChange.minutesRemaining}m — security cooling-off period
          </div>
        </div>
      )}

      <h2 className="px-3 md:px-5 pb-1 text-[11px] font-semibold text-gl-text">Payout history</h2>
      <div className="px-3 md:px-5">
        {history.map((record) => (
          <PayoutRow key={record.id} record={record} />
        ))}
      </div>

      {showConfirmPayout && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45"
          onClick={() => setShowConfirmPayout(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] bg-white rounded-t-2xl p-5 pb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-gl-text">Request payout</h2>
              <button onClick={() => setShowConfirmPayout(false)} className="active:opacity-60 transition-opacity">
                <IconX size={16} className="text-gl-text-secondary" />
              </button>
            </div>
            <p className="text-[11px] text-gl-text-secondary mb-4">
              {formatGHS(balanceGHS)} will be requested to your verified MoMo number and marked
              pending release.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmPayout(false)}
                className="flex-1 border border-gl-border-strong text-gl-text text-[12px] font-semibold py-2.5 rounded-lg active:bg-gl-bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayout}
                className="flex-1 bg-gl-brand text-white text-[12px] font-semibold py-2.5 rounded-lg active:opacity-80 transition-opacity"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <TabBar tabs={sellerTabs} activeHref="/payouts" />
    </div>
  );
}

