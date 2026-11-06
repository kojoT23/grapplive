"use client";

// The seller's opt-in for scheduled delivery, on a product. Switched on for
// large or bulky items: instead of a same-day rider, the buyer picks a
// delivery day. Left off, the product is delivered the usual same-day way.
export function ScheduledDeliveryToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="border border-gl-border rounded-lg p-3 mb-6 flex items-start justify-between gap-3">
      <div>
        <div className="text-[12px] font-semibold text-gl-text mb-0.5">Deliver on a day the buyer picks</div>
        <p className="text-[10px] text-gl-text-secondary">
          For large or bulky items. The buyer chooses a delivery day and time window instead of getting a
          same-day rider, giving you time to prepare.
        </p>
      </div>
      <button
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        aria-label="Deliver on a day the buyer picks"
        className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
          value ? "bg-gl-brand" : "bg-gl-border-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${value ? "left-[18px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
