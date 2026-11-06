// Scheduled delivery: for large or bulky items a seller switches on "deliver on
// a day the buyer picks". The buyer chooses a DAY and a time WINDOW (not an
// exact time), and a rider claims the job ahead of time, then does it on the
// day. These helpers work in the device's local time, which is what a buyer in
// Ghana expects "tomorrow morning" to mean.

export type DeliveryWindow = "morning" | "afternoon" | "evening";

export const deliveryWindows: { value: DeliveryWindow; label: string; hours: string }[] = [
  { value: "morning", label: "Morning", hours: "8am – 12pm" },
  { value: "afternoon", label: "Afternoon", hours: "12pm – 4pm" },
  { value: "evening", label: "Evening", hours: "4pm – 8pm" },
];

const WINDOW_ORDER: Record<DeliveryWindow, number> = { morning: 0, afternoon: 1, evening: 2 };

export type DeliverySlot = {
  date: string; // "YYYY-MM-DD", local time
  window: DeliveryWindow;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// "2026-11-12" for the local calendar day containing `ms`.
export function toDateKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// The days a buyer can pick from: tomorrow onward (a scheduled item needs at
// least a day to prepare). Empty until there's a real clock time.
export function slotDateOptions(nowMs: number, days = 7): { key: string; label: string }[] {
  if (nowMs <= 0) return [];
  const options: { key: string; label: string }[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(nowMs);
    d.setDate(d.getDate() + i);
    options.push({ key: toDateKey(d.getTime()), label: formatDateKey(toDateKey(d.getTime())) });
  }
  return options;
}

export function formatDateKey(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function slotLabel(slot: DeliverySlot): string {
  const w = deliveryWindows.find((x) => x.value === slot.window);
  return `${formatDateKey(slot.date)} · ${w ? `${w.label} (${w.hours})` : slot.window}`;
}

export function isSlotToday(slot: DeliverySlot, nowMs: number): boolean {
  return nowMs > 0 && slot.date === toDateKey(nowMs);
}

// Earliest first: by day, then morning -> evening.
export function compareSlots(a: DeliverySlot, b: DeliverySlot): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return WINDOW_ORDER[a.window] - WINDOW_ORDER[b.window];
}

export function isValidSlot(slot: DeliverySlot | undefined): slot is DeliverySlot {
  return (
    slot !== undefined &&
    /^\d{4}-\d{2}-\d{2}$/.test(slot.date) &&
    deliveryWindows.some((w) => w.value === slot.window)
  );
}
