"use client";

import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import {
  notificationsFor,
  unreadCount,
  useNotificationsStore,
} from "@/lib/store/useNotificationsStore";

function timeAgo(ms: number, nowMs: number): string {
  const minutes = Math.floor((nowMs - ms) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(ms).toLocaleDateString("en-GH", { day: "numeric", month: "short" });
}

// One person's inbox. Tapping a notification marks it read and goes to the
// screen it's about.
export function NotificationsList({
  recipient,
  title = "Notifications",
  backHref,
  nowMs,
}: {
  recipient: string;
  title?: string;
  backHref?: string;
  nowMs: number;
}) {
  const router = useRouter();
  const items = useNotificationsStore((s) => s.items);
  const hasHydrated = useNotificationsStore((s) => s.hasHydrated);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const mine = notificationsFor(items, recipient);
  const unread = unreadCount(items, recipient);

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-2">
        <button
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          aria-label="Back"
          className="active:opacity-60 transition-opacity"
        >
          <IconArrowLeft size={18} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text flex-1">{title}</h1>
        {unread > 0 && (
          <button
            onClick={() => markAllRead(recipient)}
            className="text-[11px] font-semibold text-gl-brand active:opacity-60"
          >
            Mark all read
          </button>
        )}
      </div>

      {!hasHydrated ? (
        <div className="px-5 py-8 text-center text-[12px] text-gl-text-secondary">Loading…</div>
      ) : mine.length === 0 ? (
        <div className="mx-3 md:mx-5 border border-dashed border-gl-border-strong rounded-lg px-4 py-10 text-center">
          <div className="text-[12px] font-semibold text-gl-text mb-1">Nothing yet</div>
          <div className="text-[10px] text-gl-text-secondary">
            Updates about your orders, deliveries and cash show up here.
          </div>
        </div>
      ) : (
        mine.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              markRead(n.id, recipient);
              if (n.href) router.push(n.href);
            }}
            className={`w-full text-left mx-3 md:mx-5 mb-2 border rounded-lg p-3 flex gap-2.5 active:bg-gl-bg-muted transition-colors ${
              n.readAt === undefined ? "border-gl-brand bg-gl-brand-soft-bg" : "border-gl-border"
            }`}
            style={{ width: "calc(100% - 1.5rem)" }}
          >
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt === undefined ? "bg-gl-brand" : "bg-transparent"}`}
            />
            <span className="flex-1">
              <span className="flex justify-between gap-2">
                <span className="text-[12px] font-semibold text-gl-text">{n.title}</span>
                <span className="text-[9px] text-gl-text-secondary shrink-0">{timeAgo(n.createdAt, nowMs)}</span>
              </span>
              <span className="block text-[11px] text-gl-text-secondary mt-0.5">{n.body}</span>
            </span>
          </button>
        ))
      )}
    </div>
  );
}
