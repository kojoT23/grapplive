import { useSyncExternalStore } from "react";

// The current time as a number, for render-time comparisons like "is this
// session still upcoming?". Calling Date.now() directly during render is
// impure (react-hooks/purity): two renders of the same props can disagree.
// This reads the clock through useSyncExternalStore instead, rounded to
// 30s so the value is stable between renders, and it re-renders the
// component as time passes (an "upcoming" label flips to "went live" on its
// own). The server snapshot is 0 — callers only use it after hydration.
const TICK_MS = 30_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}

function getSnapshot() {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

function getServerSnapshot() {
  return 0;
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
