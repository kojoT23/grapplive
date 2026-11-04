"use client";

import { useState } from "react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCurrentRider } from "@/lib/hooks/useCurrentRider";
import { useNow } from "@/lib/hooks/useNow";
import { riderTabs } from "@/lib/nav/rider-tabs";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import {
  useCashLedgerStore,
  entriesForRider,
  heldTotal,
} from "@/lib/store/useCashLedgerStore";
import {
  availableToCashOut,
  earnedSince,
  keptFromCash,
  requestCashOut,
  startOfDay,
} from "@/lib/delivery/earnings";
import { CASH_HOLD_LIMIT_GHS, type CashOut } from "@/lib/mock-data/cash";

const EMPTY_CASH_OUTS: CashOut[] = [];
const DAY_MS = 24 * 60 * 60 * 1000;

function ghs(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

function formatWhen(ms: number) {
  return new Date(ms).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function RiderEarningsPage() {
  const { isChecking } = useRequireAuth("deliver");
  const { rider, hasHydrated: riderHydrated } = useCurrentRider();
  const now = useNow();
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const deliveriesHydrated = useDeliveryStore((s) => s.hasHydrated);
  const entries = useCashLedgerStore((s) => s.entries);
  const ledgerHydrated = useCashLedgerStore((s) => s.hasHydrated);
  const handOver = useCashLedgerStore((s) => s.handOver);
  const cashOuts = useRiderStore((s) => (rider ? s.cashOutsByRider[rider.id] : undefined)) ?? EMPTY_CASH_OUTS;
  const statusHydrated = useRiderStore((s) => s.hasHydrated);
  const [message, setMessage] = useState("");

  if (isChecking || !riderHydrated || !deliveriesHydrated || !ledgerHydrated || !statusHydrated) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }
  if (!rider) return null;

  const available = availableToCashOut(deliveries, cashOuts, rider.id);
  const today = earnedSince(deliveries, rider.id, startOfDay(now));
  const week = earnedSince(deliveries, rider.id, now - 7 * DAY_MS);
  const kept = keptFromCash(deliveries, rider.id);
  const myEntries = entriesForRider(entries, rider.id);
  const held = heldTotal(entries, rider.id);
  const nearLimit = held >= CASH_HOLD_LIMIT_GHS * 0.8;

  const handleCashOut = () => {
    const amount = requestCashOut(rider.id);
    setMessage(amount > 0 ? `Cash-out of ${ghs(amount)} requested.` : "Nothing to cash out yet.");
  };

  return (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">Earnings</h1>

      <div className="mx-3 md:mx-5 mb-3 border border-gl-border rounded-lg p-3">
        <div className="text-[9px] text-gl-text-secondary mb-0.5">Available to cash out</div>
        <div className="text-[20px] font-bold text-gl-text mb-2">{ghs(available)}</div>
        <button
          onClick={handleCashOut}
          disabled={available <= 0}
          className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[12px] font-semibold active:opacity-90 transition-opacity disabled:opacity-40"
        >
          Cash out to MoMo
        </button>
        {message && <p className="text-[10px] text-gl-text-secondary mt-2">{message}</p>}
        <p className="text-[9px] text-gl-text-secondary mt-2">
          Goes to the MoMo on {rider.phone}. Prototype: no real money moves yet.
        </p>
        {kept > 0 && (
          <p className="text-[9px] text-gl-text-secondary mt-1">
            {ghs(kept)} of your earnings you already kept from cash payments isn&apos;t included here.
          </p>
        )}
      </div>

      <div className="mx-3 md:mx-5 mb-4 grid grid-cols-3 gap-2">
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Today</div>
          <div className="text-[13px] font-semibold text-gl-text">{ghs(today)}</div>
        </div>
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">7 days</div>
          <div className="text-[13px] font-semibold text-gl-text">{ghs(week)}</div>
        </div>
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Trips</div>
          <div className="text-[13px] font-semibold text-gl-text">{rider.tripsCompleted}</div>
        </div>
      </div>

      <h2 className="px-3 md:px-5 pb-1 text-[11px] font-semibold text-gl-text">Cash you collected</h2>
      <div className={`mx-3 md:mx-5 mb-2 border rounded-lg p-3 ${nearLimit ? "border-gl-amber" : "border-gl-border"}`}>
        <div className="flex justify-between items-baseline">
          <span className="text-[9px] text-gl-text-secondary">Holding now</span>
          <span className="text-[9px] text-gl-text-secondary">Limit {ghs(CASH_HOLD_LIMIT_GHS)}</span>
        </div>
        <div className="text-[16px] font-bold text-gl-text">{ghs(held)}</div>
        <p className="text-[9px] text-gl-text-secondary mt-1">
          This cash isn&apos;t yours — hand it to the seller. At the limit you can&apos;t accept new jobs.
        </p>
      </div>

      {myEntries.length === 0 ? (
        <div className="mx-3 md:mx-5 mb-4 text-[10px] text-gl-text-secondary">No cash collected yet.</div>
      ) : (
        <div className="mb-4">
          {myEntries.map((e) => (
            <div key={e.id} className="mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3">
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-[12px] font-semibold text-gl-text">{e.sellerName}</span>
                <span className="text-[12px] font-semibold text-gl-text">{ghs(e.amountGHS)}</span>
              </div>
              <div className="text-[10px] text-gl-text-secondary mb-1.5">Collected {formatWhen(e.collectedAt)}</div>
              {e.status === "held" && (
                <button
                  onClick={() => handOver(e.id, rider.id)}
                  className="w-full border border-gl-brand text-gl-brand rounded-lg py-2 text-[11px] font-semibold active:bg-gl-brand-soft-bg transition-colors"
                >
                  I&apos;ve handed this to {e.sellerName}
                </button>
              )}
              {e.status === "handover_pending" && (
                <div className="text-[10px] font-semibold text-gl-amber">Waiting for {e.sellerName} to confirm</div>
              )}
              {e.status === "disputed" && (
                <div>
                  <div className="text-[10px] font-semibold text-gl-red mb-1.5">
                    {e.sellerName} says they haven&apos;t received this cash
                  </div>
                  <button
                    onClick={() => handOver(e.id, rider.id)}
                    className="w-full border border-gl-brand text-gl-brand rounded-lg py-2 text-[11px] font-semibold active:bg-gl-brand-soft-bg transition-colors"
                  >
                    I&apos;ve handed it over again
                  </button>
                </div>
              )}
              {e.status === "settled" && (
                <div className="text-[10px] font-semibold text-gl-green">Settled ✓</div>
              )}
            </div>
          ))}
        </div>
      )}

      {cashOuts.length > 0 && (
        <>
          <h2 className="px-3 md:px-5 pb-1 text-[11px] font-semibold text-gl-text">Cash-outs</h2>
          {cashOuts.map((c) => (
            <div key={c.id} className="mx-3 md:mx-5 mb-1.5 flex justify-between text-[11px]">
              <span className="text-gl-text-secondary">Requested {formatWhen(c.requestedAt)}</span>
              <span className="font-semibold text-gl-text">{ghs(c.amountGHS)}</span>
            </div>
          ))}
        </>
      )}

      <TabBar tabs={riderTabs} activeHref="/rider/earnings" />
    </div>
  );
}
