"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useNow } from "@/lib/hooks/useNow";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useCashLedgerStore } from "@/lib/store/useCashLedgerStore";
import { useRiderIdentityStore } from "@/lib/store/useRiderIdentityStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { cashAttention, deliveryAttention, disputeAttention, opsSummary, refundAttention } from "@/lib/delivery/ops";
import { useDisputesStore } from "@/lib/store/useDisputesStore";
import { useRefundsStore } from "@/lib/store/useRefundsStore";
import { DisputesBoard } from "@/components/ops/DisputesBoard";
import { DeliveriesBoard } from "@/components/ops/DeliveriesBoard";
import { CashBoard } from "@/components/ops/CashBoard";
import { RidersBoard } from "@/components/ops/RidersBoard";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { STAFF_RECIPIENT } from "@/lib/mock-data/notifications";

type Tab = "deliveries" | "cash" | "disputes" | "riders";

// GRAPPlive staff's view across every seller and rider: which deliveries and
// cash trails are stuck, what happened on a delivery and who did it, and the
// tools to fix it (reassign / cancel a delivery, resolve a cash dispute,
// suspend a rider). Gated by the grapplive_staff role.
export default function GrappStoreOpsPage() {
  const { isChecking } = useRequireAuth("grapplive_staff");
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const deliveriesHydrated = useDeliveryStore((s) => s.hasHydrated);
  const entries = useCashLedgerStore((s) => s.entries);
  const ledgerHydrated = useCashLedgerStore((s) => s.hasHydrated);
  const disputes = useDisputesStore((s) => s.disputes);
  const disputesHydrated = useDisputesStore((s) => s.hasHydrated);
  const refunds = useRefundsStore((s) => s.refunds);
  const refundsHydrated = useRefundsStore((s) => s.hasHydrated);
  const ridersHydrated = useRiderIdentityStore((s) => s.hasHydrated);
  const statusHydrated = useRiderStore((s) => s.hasHydrated);
  const now = useNow();
  const [tab, setTab] = useState<Tab>("deliveries");

  if (isChecking || !deliveriesHydrated || !ledgerHydrated || !ridersHydrated || !statusHydrated || !disputesHydrated || !refundsHydrated) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const summary = opsSummary(deliveries, entries, now);
  const deliveryAttentionCount = deliveries.filter((d) => deliveryAttention(d, now).length > 0).length;
  const cashAttentionCount = entries.filter((e) => cashAttention(e, now).length > 0).length;
  const disputeAttentionCount =
    disputes.filter((d) => disputeAttention(d, now).length > 0).length +
    refunds.filter((r) => refundAttention(r, now).length > 0).length;

  const tiles = [
    { label: "Needs attention", value: summary.needAttention + disputeAttentionCount, warn: summary.needAttention + disputeAttentionCount > 0 },
    { label: "Open requests", value: summary.openRequests },
    { label: "In progress", value: summary.inProgress },
    { label: "Scheduled", value: summary.scheduled },
  ];

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "deliveries", label: "Deliveries", count: deliveryAttentionCount },
    { value: "cash", label: "Cash", count: cashAttentionCount },
    { value: "disputes", label: "Disputes", count: disputeAttentionCount },
    { value: "riders", label: "Riders" },
  ];

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-2">
        <Link href="/grappstore/account" className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text flex-1">Delivery operations</h1>
        <Link href="/grappstore/fulfillment" className="text-[11px] font-semibold text-gl-brand active:opacity-60">
          Fulfillment
        </Link>
        <NotificationBell recipient={STAFF_RECIPIENT} href="/grappstore/ops/notifications" />
      </div>

      <div className="mx-3 md:mx-5 mb-3 grid grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className={`border rounded-lg px-2 py-2 ${t.warn ? "border-gl-amber" : "border-gl-border"}`}>
            <div className="text-[8px] text-gl-text-secondary mb-0.5 leading-tight">{t.label}</div>
            <div className="text-[15px] font-semibold text-gl-text">{t.value}</div>
          </div>
        ))}
      </div>
      {(summary.cashDisputes > 0 || summary.cashOwedByRidersGHS > 0) && (
        <div className="mx-3 md:mx-5 mb-3 text-[10px] text-gl-text-secondary">
          {summary.cashDisputes > 0 ? `${summary.cashDisputes} cash dispute${summary.cashDisputes > 1 ? "s" : ""} open. ` : ""}
          {summary.cashOwedByRidersGHS > 0
            ? `Riders owe GHS ${summary.cashOwedByRidersGHS.toLocaleString("en-GH")} in total.`
            : ""}
        </div>
      )}

      <div className="mx-3 md:mx-5 mb-3 flex border-b border-gl-border">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex-1 pb-2 text-[12px] font-semibold border-b-2 -mb-px ${
              tab === t.value ? "border-gl-brand text-gl-brand" : "border-transparent text-gl-text-secondary"
            }`}
          >
            {t.label}
            {t.count ? (
              <span className="ml-1 text-[10px] bg-gl-amber text-white rounded-full px-1.5 py-0.5">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "deliveries" && <DeliveriesBoard />}
      {tab === "cash" && <CashBoard />}
      {tab === "disputes" && <DisputesBoard />}
      {tab === "riders" && <RidersBoard />}
    </div>
  );
}
