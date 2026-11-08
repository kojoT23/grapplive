"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { useCurrentSellerId } from "@/lib/hooks/useCurrentSellerId";
import { useCurrentRider } from "@/lib/hooks/useCurrentRider";
import { useNow } from "@/lib/hooks/useNow";
import { buyerRecipient, riderRecipient, sellerRecipient } from "@/lib/mock-data/notifications";
import { NotificationsList } from "@/components/notifications/NotificationsList";

// Your inbox for the role you're using right now: as a shopper it's your
// orders; as a seller, your shop's orders and cash; as a rider, your jobs and
// cash. (Staff have their own, under the ops hub.)
export default function NotificationsPage() {
  const phone = useAppStore((s) => s.phone);
  const activeRole = useAppStore((s) => s.activeRole);
  const sellerId = useCurrentSellerId();
  const { rider } = useCurrentRider();
  const now = useNow();

  let recipient = "";
  let backHref = "/home";
  if (activeRole === "sell") {
    recipient = sellerRecipient(sellerId);
    backHref = "/dashboard";
  } else if (activeRole === "deliver") {
    recipient = rider ? riderRecipient(rider.id) : "";
    backHref = "/rider";
  } else if (phone) {
    recipient = buyerRecipient(phone);
  }

  if (!recipient) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-[12px] text-gl-text-secondary mb-3">Sign in to see your notifications.</p>
        <Link href="/auth/signup" className="text-[12px] font-semibold text-gl-brand active:opacity-60">
          Sign in
        </Link>
      </div>
    );
  }

  return <NotificationsList recipient={recipient} backHref={backHref} nowMs={now} />;
}
