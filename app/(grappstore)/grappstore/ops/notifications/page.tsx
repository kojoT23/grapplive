"use client";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useNow } from "@/lib/hooks/useNow";
import { STAFF_RECIPIENT } from "@/lib/mock-data/notifications";
import { NotificationsList } from "@/components/notifications/NotificationsList";

// GRAPPlive staff's shared inbox: new GrappStore orders, cash disputes and
// anything else that needs support.
export default function StaffNotificationsPage() {
  const { isChecking } = useRequireAuth("grapplive_staff");
  const now = useNow();

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  return <NotificationsList recipient={STAFF_RECIPIENT} title="Staff notifications" backHref="/grappstore/ops" nowMs={now} />;
}
