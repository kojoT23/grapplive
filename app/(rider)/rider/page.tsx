"use client";

import Link from "next/link";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCurrentRider } from "@/lib/hooks/useCurrentRider";
import { riderTabs } from "@/lib/nav/rider-tabs";

export default function RiderJobsPage() {
  const { isChecking } = useRequireAuth("deliver");
  const { rider, hasHydrated } = useCurrentRider();

  if (isChecking || !hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  // Signed in with the "deliver" role but no rider profile on this phone
  // (role selector normally creates it before routing here).
  if (!rider) {
    return (
      <div className="px-5 pt-8">
        <h1 className="text-[14px] font-semibold text-gl-text mb-1">Finish setting up</h1>
        <p className="text-[11px] text-gl-text-secondary mb-4">
          Add your name, vehicle and area to start delivering.
        </p>
        <Link
          href="/auth/role-selector"
          className="block text-center w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-90"
        >
          Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="px-3 md:px-5 pt-3.5 pb-2">
        <div className="text-[13px] text-gl-text-secondary">Rider</div>
        <div className="text-[15px] font-semibold text-gl-text">{rider.name}</div>
      </div>

      <div className="mx-3 md:mx-5 mb-3 grid grid-cols-3 gap-2">
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Trips</div>
          <div className="text-[14px] font-semibold text-gl-text">{rider.tripsCompleted}</div>
        </div>
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Rating</div>
          <div className="text-[14px] font-semibold text-gl-text">
            {rider.rating === null ? "—" : rider.rating.toFixed(1)}
          </div>
        </div>
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Area</div>
          <div className="text-[14px] font-semibold text-gl-text">{rider.area}</div>
        </div>
      </div>

      <div className="mx-3 md:mx-5 border border-dashed border-gl-border-strong rounded-lg px-4 py-8 text-center">
        <div className="text-[12px] font-semibold text-gl-text mb-1">No delivery jobs yet</div>
        <div className="text-[10px] text-gl-text-secondary">
          Delivery requests will show up here once they&apos;re switched on.
        </div>
      </div>

      <TabBar tabs={riderTabs} activeHref="/rider" />
    </div>
  );
}
