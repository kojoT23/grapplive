"use client";

import { useEffect, useState } from "react";

function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 1000));
}

function formatCountdown(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return { hrs: pad(hrs), mins: pad(mins), secs: pad(secs) };
}

export function DealsCountdown() {
  // The real target ("time until midnight") is only meaningful on the
  // client — the server has no useful "now" for this. Start null and
  // compute after mount, same hasHydrated-style pattern used elsewhere in
  // the app, so server-rendered markup and the first client paint match.
  //
  // Recomputing from Date.now() on every tick (rather than just
  // decrementing a counter) also means the timer self-corrects for any
  // drift and, most importantly, never loops back to a fake "2h15m45s"
  // once it actually hits zero — it counts down to a real deadline.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    setSecondsLeft(secondsUntilMidnight());
    const interval = setInterval(() => {
      setSecondsLeft(secondsUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (secondsLeft === null) {
    // Reserve the same layout space before hydration so nothing jumps once
    // the real countdown appears.
    return (
      <div className="flex items-center gap-1 invisible" aria-hidden="true">
        <span className="bg-gl-text text-white text-[10px] font-bold px-1.5 py-0.5 rounded">00</span>
        <span className="text-[10px] font-bold text-gl-text">:</span>
        <span className="bg-gl-text text-white text-[10px] font-bold px-1.5 py-0.5 rounded">00</span>
        <span className="text-[10px] font-bold text-gl-text">:</span>
        <span className="bg-gl-text text-white text-[10px] font-bold px-1.5 py-0.5 rounded">00</span>
      </div>
    );
  }

  const countdown = formatCountdown(secondsLeft);

  return (
    <div className="flex items-center gap-1">
      {[countdown.hrs, countdown.mins, countdown.secs].map((unit, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-gl-text text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {unit}
          </span>
          {i < 2 && <span className="text-[10px] font-bold text-gl-text">:</span>}
        </span>
      ))}
    </div>
  );
}
