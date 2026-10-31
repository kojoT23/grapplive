"use client";

import { useRouter } from "next/navigation";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCurrentRider } from "@/lib/hooks/useCurrentRider";
import { useAppStore } from "@/lib/store/useAppStore";
import { riderTabs } from "@/lib/nav/rider-tabs";
import { riderVehicles } from "@/lib/store/useRiderIdentityStore";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gl-bg-muted last:border-b-0">
      <span className="text-[10px] text-gl-text-secondary">{label}</span>
      <span className="text-[12px] text-gl-text">{value}</span>
    </div>
  );
}

export default function RiderProfilePage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth("deliver");
  const { rider, hasHydrated } = useCurrentRider();
  const addRole = useAppStore((s) => s.addRole);
  const logout = useAppStore((s) => s.logout);

  if (isChecking || !hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const handleSwitchToShop = () => {
    addRole("shop"); // adopts the shop mode if not held yet, and switches to it
    router.push("/home");
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/signup");
  };

  return (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">Profile</h1>

      {rider && (
        <div className="mx-3 md:mx-5 mb-3 border border-gl-border rounded-lg px-3">
          <Row label="Name" value={rider.name} />
          <Row label="Phone" value={rider.phone} />
          <Row
            label="Vehicle"
            value={riderVehicles.find((v) => v.value === rider.vehicle)?.label ?? rider.vehicle}
          />
          <Row label="Area" value={rider.area} />
        </div>
      )}

      <div className="mx-3 md:mx-5 flex flex-col gap-2">
        <button
          onClick={handleSwitchToShop}
          className="w-full border border-gl-border-strong text-gl-text text-[12px] font-semibold py-2.5 rounded-lg active:bg-gl-bg-muted transition-colors"
        >
          Switch to shopping
        </button>
        <button
          onClick={handleLogout}
          className="w-full text-gl-red text-[12px] font-semibold py-2.5 active:opacity-60 transition-opacity"
        >
          Log out
        </button>
      </div>

      <TabBar tabs={riderTabs} activeHref="/rider/profile" />
    </div>
  );
}
