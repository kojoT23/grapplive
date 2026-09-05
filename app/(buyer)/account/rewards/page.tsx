import Link from "next/link";
import { IconArrowLeft, IconGift, IconInfoCircle } from "@tabler/icons-react";

// Simple points display for Phase 0 — no redemption flow yet, since that
// implies real backend logic (redeeming points for something) that doesn't
// exist. See docs/GRAPPlive_Kickstart_Prompt.md for the deferred decision.
const CURRENT_POINTS = 320;
const NEXT_TIER_POINTS = 500;

const earnHistory = [
  { label: "Order delivered — Kente-print ankara dress", points: 45, date: "24 Aug 2026" },
  { label: "Order delivered — Bluetooth earbuds", points: 70, date: "19 Aug 2026" },
  { label: "Welcome bonus", points: 100, date: "12 Aug 2026" },
  { label: "Order delivered — Shea butter gift set", points: 105, date: "05 Aug 2026" },
];

export default function RewardsPage() {
  const progressPercent = Math.min(100, Math.round((CURRENT_POINTS / NEXT_TIER_POINTS) * 100));

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/account" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">Rewards</h1>
      </div>

      <div className="mx-3 md:mx-5 mb-5 bg-gl-brand rounded-lg px-4 py-4 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-2 mb-1">
          <IconGift size={18} className="text-white" />
          <span className="text-[11px] font-semibold text-white/85">Your points</span>
        </div>
        <div className="relative text-[24px] font-bold text-white mb-2">{CURRENT_POINTS}</div>
        <div className="relative">
          <div className="h-1.5 bg-white/25 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-white rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="text-[9px] text-white/75">
            {NEXT_TIER_POINTS - CURRENT_POINTS} points to your next reward
          </div>
        </div>
      </div>

      <div className="mx-3 md:mx-5 mb-5 p-3 border border-gl-border rounded-lg flex items-start gap-2">
        <IconInfoCircle size={16} className="text-gl-text-muted shrink-0 mt-0.5" />
        <p className="text-[9px] text-gl-text-secondary leading-relaxed">
          Earn points on every completed order. Redeeming points for discounts is coming soon —
          for now, watch your balance grow here.
        </p>
      </div>

      <h2 className="px-3 md:px-5 pb-2 text-[12px] font-semibold text-gl-text">History</h2>
      <div className="px-3 md:px-5">
        {earnHistory.map((entry, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 border-b border-gl-bg-muted last:border-b-0"
          >
            <div>
              <div className="text-[11px] text-gl-text">{entry.label}</div>
              <div className="text-[9px] text-gl-text-secondary">{entry.date}</div>
            </div>
            <div className="text-[11px] font-semibold text-gl-green">+{entry.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
