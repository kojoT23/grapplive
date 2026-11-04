"use client";

import { useState } from "react";
import { IconMapPin } from "@tabler/icons-react";
import { useLocationStore } from "@/lib/store/useLocationStore";
import { getCurrentPin, type PinResult } from "@/lib/utils/getCurrentPin";
import type { DeliveryDetailsForm as FormState } from "@/lib/hooks/useDeliveryDetailsForm";

const pinErrorMessages: Record<Extract<PinResult, { ok: false }>["reason"], string> = {
  denied: "Location is turned off for this site. Turn it on in your browser settings, or add a landmark instead.",
  unavailable: "Couldn't find your location. Try again outdoors, or add a landmark instead.",
  unsupported: "This browser can't share location. Add a landmark instead.",
  timeout: "That took too long. Try again, or add a landmark instead.",
};

// Name, digital address, landmark and a one-tap "share my current location"
// — what a rider needs to find the customer. Used by both checkouts.
export function DeliveryDetailsForm({ form }: { form: FormState }) {
  const areaName = useLocationStore((s) => s.areaName);
  const [isLocating, setIsLocating] = useState(false);
  const [pinError, setPinError] = useState("");
  const { details, errors } = form;

  const handleSharePin = async () => {
    setIsLocating(true);
    setPinError("");
    const result = await getCurrentPin();
    setIsLocating(false);
    if (result.ok) form.setPin(result.pin);
    else setPinError(pinErrorMessages[result.reason]);
  };

  return (
    <div className="border border-gl-border rounded-lg p-3 mb-4">
      <h2 className="text-[11px] font-semibold text-gl-text mb-0.5">Delivery details</h2>
      <p className="text-[9px] text-gl-text-secondary mb-2.5">
        {areaName ? `Delivering in ${areaName}. ` : ""}Your rider sees these only once they accept your order.
      </p>
      <input
        type="text"
        value={details.name}
        onChange={(e) => form.update("name", e.target.value)}
        placeholder="Your name"
        autoComplete="name"
        className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none mb-1 transition-colors focus:border-gl-brand"
      />
      {errors.name && <p className="text-[10px] text-gl-red mb-1">{errors.name}</p>}
      <input
        type="text"
        value={details.digitalAddress}
        onChange={(e) => form.update("digitalAddress", e.target.value)}
        placeholder="Digital address, e.g. GA-123-4567 (optional)"
        autoCapitalize="characters"
        className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none mt-1.5 mb-1 transition-colors focus:border-gl-brand"
      />
      {errors.digitalAddress && <p className="text-[10px] text-gl-red mb-1">{errors.digitalAddress}</p>}
      <textarea
        value={details.landmark}
        onChange={(e) => form.update("landmark", e.target.value)}
        placeholder="Landmark or directions, e.g. opposite the Shell station, blue gate"
        rows={2}
        className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none mt-1.5 transition-colors focus:border-gl-brand resize-none"
      />

      <div className="mt-2.5">
        {details.pin ? (
          <div className="flex items-center justify-between border border-gl-brand rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gl-brand">
              <IconMapPin size={14} /> Location shared
              <span className="font-normal text-gl-text-secondary">· within {details.pin.accuracyM} m</span>
            </div>
            <button onClick={() => form.setPin(undefined)} className="text-[10px] text-gl-text-secondary active:opacity-60">
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={handleSharePin}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-1.5 border border-gl-brand text-gl-brand rounded-lg py-2 text-[11px] font-semibold active:bg-gl-brand-soft-bg transition-colors disabled:opacity-60"
          >
            <IconMapPin size={14} /> {isLocating ? "Finding you…" : "Share my current location"}
          </button>
        )}
        <p className="text-[9px] text-gl-text-secondary mt-1">
          Only share this while you&apos;re at the place you want it delivered.
        </p>
        {pinError && <p className="text-[10px] text-gl-red mt-1">{pinError}</p>}
      </div>
      {errors.form && <p className="text-[10px] text-gl-red mt-1">{errors.form}</p>}
    </div>
  );
}
