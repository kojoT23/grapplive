"use client";

import { useEffect, useState } from "react";

const DEAL_DURATION_SECONDS = 2 * 3600 + 15 * 60 + 45;

function formatCountdown(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return { hrs: pad(hrs), mins: pad(mins), secs: pad(secs) };
}

export function DealsCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(DEAL_DURATION_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? DEAL_DURATION_SECONDS : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
