"use client";

import Link from "next/link";
import { IconChevronRight, IconBroadcast, IconUsers, IconWallet, IconCircleCheck } from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { sellerTabs } from "@/lib/nav/seller-tabs";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function DashboardPage() {
  const { isChecking } = useRequireAuth("sell");
  const { data, isLoading } = useDashboardSummary();

  if (isChecking || isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const { summary, lastLive } = data;
  const hasAttentionItems = summary.ordersNeedingAttention > 0;

  return (
    <div className="pb-16">
      <div className="px-3 md:px-5 pt-3.5 pb-1">
        <div className="text-[13px] text-gl-text-secondary">Good morning</div>
        <div className="text-[15px] font-semibold text-gl-text">{summary.businessName}</div>
      </div>

      {hasAttentionItems ? (
        <Link
          href="/orders"
          className="mx-3 md:mx-5 my-2.5 bg-gl-brand rounded-lg p-3 flex items-center justify-between transition-transform active:scale-[0.98]"
        >
          <div>
            <div className="text-[12px] font-semibold text-white">
              {summary.ordersNeedingAttention} orders need your attention
            </div>
            <div className="text-[9px] text-white/85">{summary.attentionDetail}</div>
          </div>
          <IconChevronRight size={18} className="text-white" />
        </Link>
      ) : (
        <div className="mx-3 md:mx-5 my-2.5 bg-gl-green-soft-bg rounded-lg p-3 flex items-center gap-2">
          <IconCircleCheck size={18} className="text-gl-green" />
          <div className="text-[12px] font-semibold text-gl-green-soft-text">
            You&apos;re all caught up
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 px-3 md:px-5 pb-2.5">
        <div className="bg-gl-bg-muted rounded-lg p-2.5">
          <div className="text-[9px] text-gl-text-secondary">Today&apos;s sales</div>
          <div className="text-[16px] font-semibold text-gl-text">
            {formatGHS(summary.todaysSalesGHS)}
          </div>
        </div>
        <div className="bg-gl-bg-muted rounded-lg p-2.5">
          <div className="text-[9px] text-gl-text-secondary">Orders today</div>
          <div className="text-[16px] font-semibold text-gl-text">{summary.ordersToday}</div>
        </div>
      </div>

      <Link
        href="/analytics"
        className="mx-3 md:mx-5 mb-2.5 border border-gl-border rounded-lg px-3 py-2.5 flex items-center gap-2.5 transition-colors active:bg-gl-bg-muted"
      >
        <div className="w-[34px] h-[34px] rounded-lg bg-gl-brand-soft-bg flex items-center justify-center shrink-0">
          <IconBroadcast size={16} className="text-gl-brand-soft-text" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-gl-text">Last live session</div>
          <div className="text-[9px] text-gl-text-secondary">
            {lastLive.viewers} viewers · {lastLive.sales} sales · {lastLive.conversionPercent}% conversion
          </div>
        </div>
      </Link>

      <div className="px-3 md:px-5 pb-3 flex gap-2">
        <Link
          href="/customers"
          className="flex-1 bg-white border border-gl-border-strong rounded-lg py-2.5 text-[10px] font-semibold text-gl-text flex items-center justify-center gap-1.5 transition-colors active:bg-gl-bg-muted"
        >
          <IconUsers size={14} />
          Customers
        </Link>
        <Link
          href="/payouts"
          className="flex-1 bg-white border border-gl-border-strong rounded-lg py-2.5 text-[10px] font-semibold text-gl-text flex items-center justify-center gap-1.5 transition-colors active:bg-gl-bg-muted"
        >
          <IconWallet size={14} />
          Payouts
        </Link>
      </div>

      <TabBar tabs={sellerTabs} activeHref="/dashboard" />
    </div>
  );
}
