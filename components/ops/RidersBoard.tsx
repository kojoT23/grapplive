"use client";

import { useState } from "react";
import { useRiderIdentityStore, riderVehicles } from "@/lib/store/useRiderIdentityStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { useCashLedgerStore, heldTotal } from "@/lib/store/useCashLedgerStore";
import { useDeliveryStore, activeDeliveryFor } from "@/lib/store/useDeliveryStore";
import type { RiderIdentity } from "@/lib/store/useRiderIdentityStore";

function RiderCard({ rider }: { rider: RiderIdentity }) {
  const online = useRiderStore((s) => s.onlineByRider[rider.id] === true);
  const suspended = useRiderStore((s) => s.suspendedByRider[rider.id] === true);
  const staffSetSuspended = useRiderStore((s) => s.staffSetSuspended);
  const entries = useCashLedgerStore((s) => s.entries);
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  const held = heldTotal(entries, rider.id);
  const active = activeDeliveryFor(deliveries, rider.id);
  const vehicle = riderVehicles.find((v) => v.value === rider.vehicle)?.label ?? rider.vehicle;

  const toggle = () => {
    if (!suspended && !confirming) {
      setConfirming(true);
      return;
    }
    const result = staffSetSuspended(rider.id, !suspended);
    setMessage(result === "ok" ? (suspended ? "Reinstated." : "Suspended.") : "Only GRAPPlive staff can do this.");
    setConfirming(false);
  };

  return (
    <div className={`mx-3 md:mx-5 mb-2 border rounded-lg p-3 ${suspended ? "border-gl-red" : "border-gl-border"}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="text-[12px] font-semibold text-gl-text">{rider.name}</div>
        <span className={`text-[10px] font-semibold ${suspended ? "text-gl-red" : online ? "text-gl-green" : "text-gl-text-secondary"}`}>
          {suspended ? "Suspended" : online ? "Online" : "Offline"}
        </span>
      </div>
      <div className="text-[10px] text-gl-text-secondary mt-0.5">
        {rider.phone} · {vehicle} · {rider.area} · {rider.tripsCompleted} trips ·{" "}
        {rider.rating === null ? "no rating yet" : `★ ${rider.rating.toFixed(1)}`}
      </div>
      <div className="text-[10px] text-gl-text-secondary">
        {held > 0 ? `Holding GHS ${held.toLocaleString("en-GH")} cash` : "No cash held"}
        {active ? ` · on a delivery (${active.sellerName} → ${active.dropoffArea})` : ""}
      </div>
      <button
        onClick={toggle}
        className={`mt-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
          suspended ? "bg-gl-brand text-white active:opacity-90" : "border border-gl-border-strong text-gl-red active:bg-gl-bg-muted"
        }`}
      >
        {suspended ? "Reinstate rider" : confirming ? "Tap again to suspend" : "Suspend rider"}
      </button>
      {message && <span className="text-[10px] text-gl-text-secondary ml-2">{message}</span>}
    </div>
  );
}

export function RidersBoard() {
  const identities = useRiderIdentityStore((s) => s.identitiesByPhone);
  const riders = Object.values(identities).sort((a, b) => a.name.localeCompare(b.name));

  return riders.length === 0 ? (
    <div className="mx-3 md:mx-5 border border-dashed border-gl-border-strong rounded-lg px-4 py-8 text-center text-[11px] text-gl-text-secondary">
      No riders have signed up yet.
    </div>
  ) : (
    <div>
      {riders.map((r) => (
        <RiderCard key={r.id} rider={r} />
      ))}
    </div>
  );
}
