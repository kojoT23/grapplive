"use client";

import Link from "next/link";
import { IconBroadcast } from "@tabler/icons-react";
import { useLiveSessionStore } from "@/lib/store/useLiveSessionStore";

// Client component, same reason SellerFollowButton.tsx is one: the parent
// page.tsx is a Server Component, but the live session lives in a
// localStorage-backed Zustand store, which only exists on the client.
export function SellerLiveBanner({ sellerId }: { sellerId: string }) {
  const session = useLiveSessionStore((s) => s.session);
  const hasHydrated = useLiveSessionStore((s) => s.hasHydrated);

  if (!hasHydrated) return null;
  if (!session || session.sellerId !== sellerId) return null;

  const dateTime = new Date(`${session.date}T${session.time}`);
  const isUpcoming = dateTime.getTime() > Date.now();

  return (
    <Link
      href={`/live/${sellerId}`}
      className="mx-3 md:mx-5 mb-3 flex items-center gap-2 bg-gl-red/10 border border-gl-red/20 rounded-lg px-3 py-2.5 active:bg-gl-red/15 transition-colors"
    >
      <div className="w-7 h-7 rounded-full bg-gl-red flex items-center justify-center shrink-0 gl-live-pulse">
        <IconBroadcast size={13} className="text-white" />
      </div>
      <div className="flex-1">
        <div className="text-[11px] font-semibold text-gl-text">
          {isUpcoming ? "Live session scheduled" : "Recently went live"}
        </div>
        <div className="text-[9px] text-gl-text-secondary">
          {dateTime.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
          {dateTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>
      <span className="text-[10px] font-semibold text-gl-brand shrink-0">View</span>
    </Link>
  );
}
