"use client";

import { IconChevronDown, IconAlertTriangle } from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import {
  revenueGHS7Day,
  revenueTrend,
  bestSellers,
  revenueBreakdown,
  notMovingProducts,
  liveConversionPercent,
  directMomoConfirmationPercent,
} from "@/lib/mock-data/analytics";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

// Builds an SVG polyline from relative point values
function trendPoints(values: number[]) {
  const step = 280 / (values.length - 1);
  return values.map((v, i) => `${i * step},${v}`).join(" ");
}

// Builds pie slice paths from cumulative percentages (simple conic approximation via stroke-dasharray on a circle is cleaner than manual arc math for 4 slices)
function PieChart({ slices }: { slices: typeof revenueBreakdown }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <svg width="90" height="90" viewBox="0 0 36 36">
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="transparent"
        stroke="var(--color-gl-bg-muted)"
        strokeWidth="8"
      />
      {slices.map((slice) => {
        const dash = (slice.percent / 100) * circumference;
        const offset = circumference - (cumulative / 100) * circumference;
        cumulative += slice.percent;
        return (
          <circle
            key={slice.label}
            cx="18"
            cy="18"
            r={radius}
            fill="transparent"
            stroke={`var(${slice.colorVar})`}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            transform="rotate(-90 18 18)"
          />
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const { isChecking } = useRequireAuth("sell");

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex justify-between items-center px-3 md:px-5 pt-3.5 pb-1">
        <span className="text-[14px] font-semibold text-gl-text">Analytics</span>
        <button className="text-[9px] text-gl-text-secondary bg-gl-bg-muted px-2 py-1 rounded-full flex items-center gap-1 active:bg-gl-border transition-colors">
          Last 7 days <IconChevronDown size={10} />
        </button>
      </div>

      <div className="px-3 md:px-5 pt-2 pb-1">
        <div className="text-[9px] text-gl-text-secondary">Revenue</div>
        <div className="text-[18px] font-semibold text-gl-text mb-2">
          {formatGHS(revenueGHS7Day)}
        </div>
        <svg width="100%" height="60" viewBox="0 0 280 60" preserveAspectRatio="none">
          <polyline
            points={trendPoints(revenueTrend)}
            fill="none"
            stroke="var(--color-gl-brand)"
            strokeWidth="2.5"
          />
          <circle
            cx="280"
            cy={revenueTrend[revenueTrend.length - 1]}
            r="3"
            fill="var(--color-gl-brand)"
          />
        </svg>
      </div>

      <div className="px-3 md:px-5 pt-2 pb-1 text-[11px] font-semibold text-gl-text">
        Best sellers
      </div>
      <div className="px-3 md:px-5 pb-2.5">
        {bestSellers.map((item) => (
          <div key={item.name} className="flex justify-between py-1.5 text-[10px]">
            <span className="text-gl-text">{item.name}</span>
            <span className="text-gl-text-secondary">{item.unitsSold} sold</span>
          </div>
        ))}
      </div>

      <div className="px-3 md:px-5 py-2">
        <div className="text-[11px] font-semibold text-gl-text mb-2">Revenue by product</div>
        <div className="flex items-center gap-4">
          <PieChart slices={revenueBreakdown} />
          <div className="text-[9px] text-gl-text">
            {revenueBreakdown.map((slice) => (
              <div key={slice.label} className="mb-1.5 flex items-center gap-1.5">
                <span style={{ color: `var(${slice.colorVar})` }}>●</span>
                {slice.label} — {slice.percent}%
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-gl-bg-muted">
          <div className="text-[9px] font-semibold text-gl-amber-soft-text mb-0.5 flex items-center gap-1">
            <IconAlertTriangle size={11} />
            Not moving (0 sales, 14 days)
          </div>
          <div className="text-[9px] text-gl-text-secondary">
            {notMovingProducts.join(" · ")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 md:px-5 pt-2 pb-3">
        <div className="bg-gl-bg-muted rounded-lg p-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Live conversion</div>
          <div className="text-[15px] font-semibold text-gl-green">
            {liveConversionPercent}%
          </div>
          <div className="text-[8px] text-gl-text-secondary">viewers → buyers</div>
        </div>
        <div className="bg-gl-amber-soft-bg rounded-lg p-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Confirmation rate</div>
          <div className="text-[15px] font-semibold text-gl-amber">
            {directMomoConfirmationPercent}%
          </div>
          <div className="text-[8px] text-gl-text-secondary">Direct MoMo, within 1hr</div>
        </div>
      </div>
    </div>
  );
}
