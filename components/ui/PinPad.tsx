"use client";

import { useState } from "react";
import { IconBackspace } from "@tabler/icons-react";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export function PinPad({
  onComplete,
  error,
}: {
  onComplete: (pin: string) => void;
  error?: string;
}) {
  const [digits, setDigits] = useState("");

  const handleKey = (key: string) => {
    if (key === "") return;
    if (key === "back") {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (digits.length >= PIN_LENGTH) return;
    const next = digits + key;
    setDigits(next);
    if (next.length === PIN_LENGTH) {
      onComplete(next);
      setDigits("");
    }
  };

  return (
    <div>
      <div className="flex justify-center gap-3 mb-1">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 ${
              i < digits.length ? "bg-gl-brand border-gl-brand" : "border-gl-border-strong"
            }`}
          />
        ))}
      </div>
      <div className="h-4 text-center mb-4">
        {error && <span className="text-[10px] text-gl-red">{error}</span>}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
        {KEYS.map((key, i) => {
          if (key === "") return <div key={i} />;
          if (key === "back") {
            return (
              <button
                key={i}
                onClick={() => handleKey("back")}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto active:bg-gl-bg-muted transition-colors"
              >
                <IconBackspace size={20} className="text-gl-text-secondary" />
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleKey(key)}
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-[18px] font-semibold text-gl-text active:bg-gl-bg-muted transition-colors"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
