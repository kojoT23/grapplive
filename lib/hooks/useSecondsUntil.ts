import { useSyncExternalStore } from "react";

// Whole seconds left until `deadlineMs` (never below 0), ticking once a
// second; null while there's no deadline yet or on the server. Reads the
// clock through useSyncExternalStore rather than copying it into state from
// an effect (react-hooks/set-state-in-effect), same as useNow.
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

export function useSecondsUntil(deadlineMs: number | null): number | null {
  return useSyncExternalStore(
    subscribe,
    () => (deadlineMs === null ? null : Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000))),
    () => null
  );
}
