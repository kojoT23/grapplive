"use client";

import { useEffect } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";

// Next.js renders this in place of the page whenever a render/render-phase
// error is thrown anywhere below it in the tree — without this file, that
// error has nowhere to land and the user sees a blank white screen
// instead. See ROADMAP.md §"Reliability" — this app had zero error
// boundaries before, including around the localStorage-backed stores
// (cart, catalog, etc.) where a quota or corrupted-data error is a real,
// if now unlikely, possibility.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No real error-reporting backend yet — this is the one place in the
    // app it's worth logging to the console regardless, so an error isn't
    // silently swallowed during development or QA.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <IconAlertTriangle size={40} className="text-gl-text-muted mb-3" />
      <h1 className="text-[16px] font-semibold text-gl-text mb-1.5">Something went wrong</h1>
      <p className="text-[11px] text-gl-text-secondary mb-6 max-w-[240px]">
        That&apos;s on us, not you. Try again — if it keeps happening, restarting the app usually helps.
      </p>
      <button
        onClick={reset}
        className="bg-gl-brand text-white text-[12px] font-semibold px-5 py-2.5 rounded-lg active:opacity-80 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
