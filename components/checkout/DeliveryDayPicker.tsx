"use client";

import {
  deliveryWindows,
  slotDateOptions,
  type DeliverySlot,
  type DeliveryWindow,
} from "@/lib/mock-data/deliverySlots";

export type PartialSlot = { date?: string; window?: DeliveryWindow };

// Scheduled delivery, buyer's side: for a seller's large items the buyer picks
// a delivery DAY (from tomorrow) and a time WINDOW, instead of getting a
// same-day rider.
export function DeliveryDayPicker({
  sellerName,
  value,
  nowMs,
  error,
  onChange,
}: {
  sellerName: string;
  value: PartialSlot;
  nowMs: number;
  error?: boolean;
  onChange: (next: PartialSlot) => void;
}) {
  const days = slotDateOptions(nowMs);
  const chip = (selected: boolean) =>
    `border rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.98] ${
      selected ? "border-gl-brand border-[1.5px] text-gl-brand" : "border-gl-border text-gl-text"
    }`;

  return (
    <div className={`border rounded-lg p-3 mb-4 ${error ? "border-gl-red" : "border-gl-border"}`}>
      <h2 className="text-[11px] font-semibold text-gl-text mb-0.5">Choose your delivery day</h2>
      <p className="text-[9px] text-gl-text-secondary mb-2.5">
        {sellerName} delivers these items on a day you pick, so there&apos;s time to prepare them.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {days.map((d) => (
          <button key={d.key} onClick={() => onChange({ ...value, date: d.key })} className={chip(value.date === d.key)}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {deliveryWindows.map((w) => (
          <button
            key={w.value}
            onClick={() => onChange({ ...value, window: w.value })}
            className={`${chip(value.window === w.value)} text-center`}
          >
            <div>{w.label}</div>
            <div className="text-[9px] font-normal text-gl-text-secondary">{w.hours}</div>
          </button>
        ))}
      </div>
      {error && <p className="text-[10px] text-gl-red mt-2">Pick a day and a time window.</p>}
    </div>
  );
}

// A complete slot, or undefined while either half is missing.
export function completeSlot(partial: PartialSlot | undefined): DeliverySlot | undefined {
  return partial?.date && partial.window ? { date: partial.date, window: partial.window } : undefined;
}
