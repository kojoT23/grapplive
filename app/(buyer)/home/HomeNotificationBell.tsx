"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { buyerRecipient } from "@/lib/mock-data/notifications";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// The buyer's bell on Home. Shown only once signed in (a buyer's inbox belongs
// to their phone number).
export function HomeNotificationBell() {
  const phone = useAppStore((s) => s.phone);
  if (!phone) return null;
  return <NotificationBell recipient={buyerRecipient(phone)} />;
}
