"use client";

import Link from "next/link";
import { IconBell } from "@tabler/icons-react";
import { unreadCount, useNotificationsStore } from "@/lib/store/useNotificationsStore";

// A bell with the number of unread notifications for one recipient (a buyer, a
// seller, a rider or staff). Tapping it opens their inbox.
export function NotificationBell({ recipient, href = "/notifications" }: { recipient: string; href?: string }) {
  const count = useNotificationsStore((s) => unreadCount(s.items, recipient));

  return (
    <Link
      href={href}
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className="relative shrink-0 p-1 active:opacity-60 transition-opacity"
    >
      <IconBell size={20} className="text-gl-text" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-gl-red text-white text-[9px] font-semibold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
