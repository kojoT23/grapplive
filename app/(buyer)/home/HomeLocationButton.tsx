"use client";

import { useState } from "react";
import { IconMapPin, IconCurrentLocation, IconX, IconCircleCheck } from "@tabler/icons-react";
import { useLocationStore } from "@/lib/store/useLocationStore";
import { serviceAreas } from "@/lib/mock-data/serviceAreas";

export function HomeLocationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const areaName = useLocationStore((s) => s.areaName);
  const status = useLocationStore((s) => s.status);
  const detectLocation = useLocationStore((s) => s.detectLocation);
  const selectAreaManually = useLocationStore((s) => s.selectAreaManually);

  const label = areaName ?? "Set location";

  const handleSelect = (name: string) => {
    selectAreaManually(name);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-[11px] font-semibold text-gl-text active:opacity-60 transition-opacity"
      >
        <IconMapPin size={13} />
        {label}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] md:max-w-[720px] bg-white rounded-t-2xl px-4 pt-5 pb-6 relative"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gl-text-secondary active:opacity-60 transition-opacity"
            >
              <IconX size={18} />
            </button>

            <h2 className="text-[14px] font-semibold text-gl-text mb-1">Delivery location</h2>
            <p className="text-[10px] text-gl-text-secondary mb-4 max-w-[280px]">
              GRAPPlive sellers currently deliver to a few areas — we&apos;ll show you what&apos;s
              available nearby.
            </p>

            <button
              onClick={detectLocation}
              disabled={status === "detecting"}
              className="w-full flex items-center justify-center gap-1.5 bg-gl-brand text-white rounded-lg py-2.5 text-[12px] font-semibold mb-2 transition-transform active:scale-[0.98] active:opacity-90 disabled:opacity-60"
            >
              <IconCurrentLocation size={14} />
              {status === "detecting" ? "Finding you…" : "Use my current location"}
            </button>

            {status === "denied" && (
              <p className="text-[10px] text-gl-red mb-3">
                Location access was denied — pick your area below instead.
              </p>
            )}
            {status === "unsupported" && (
              <p className="text-[10px] text-gl-red mb-3">
                Location isn&apos;t available on this device — pick your area below instead.
              </p>
            )}
            {status === "outside_coverage" && (
              <p className="text-[10px] text-gl-amber-soft-text bg-gl-amber-soft-bg rounded-lg px-2.5 py-2 mb-3">
                We don&apos;t have sellers delivering to your exact area yet — pick the closest
                one below to browse what&apos;s nearby.
              </p>
            )}

            <div className="text-[9px] font-semibold text-gl-text-secondary mb-1.5 mt-3">
              Or choose manually
            </div>
            <div className="flex flex-col gap-1">
              {serviceAreas.map((area) => (
                <button
                  key={area.name}
                  onClick={() => handleSelect(area.name)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gl-border-strong text-[12px] text-gl-text active:bg-gl-bg-muted transition-colors"
                >
                  {area.name}
                  {areaName === area.name && (
                    <IconCircleCheck size={16} className="text-gl-brand" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
