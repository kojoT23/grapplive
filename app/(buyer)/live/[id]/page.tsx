"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconClock,
  IconBrandTiktok,
  IconBrandInstagram,
  IconBrandFacebook,
  IconExternalLink,
} from "@tabler/icons-react";
import { getSellerById } from "@/lib/mock-data/sellers";
import { getProductById } from "@/lib/mock-data/catalog";
import { useLiveSessionStore, type Platform } from "@/lib/store/useLiveSessionStore";

const platformConfig: Record<
  Platform,
  { label: string; icon: typeof IconBrandTiktok; iconClass: string; buildUrl: (handle: string) => string }
> = {
  tiktok: {
    label: "TikTok",
    icon: IconBrandTiktok,
    iconClass: "text-white",
    buildUrl: (handle) => `https://www.tiktok.com/@${handle}`,
  },
  instagram: {
    label: "Instagram",
    icon: IconBrandInstagram,
    iconClass: "text-white",
    buildUrl: (handle) => `https://www.instagram.com/${handle}`,
  },
  facebook: {
    label: "Facebook",
    icon: IconBrandFacebook,
    iconClass: "text-white",
    buildUrl: (handle) => `https://www.facebook.com/${handle}`,
  },
};

export default function LiveHandoffPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sellerId = params.id;

  const seller = getSellerById(sellerId);
  const session = useLiveSessionStore((s) => s.session);
  const sessionHasHydrated = useLiveSessionStore((s) => s.hasHydrated);

  const hasSessionForThisSeller = session && session.sellerId === sellerId;

  // The product pinned at schedule time comes from the seller's own
  // inventory (useProductsStore), which isn't unified with the buyer
  // catalog (catalog.ts) yet — see the note in useLiveSessionStore.ts.
  // Resolve it defensively: if it doesn't exist in the buyer catalog,
  // fall back to the name captured at schedule time instead of a dead link.
  const pinnedCatalogProduct = hasSessionForThisSeller
    ? getProductById(session.productId)
    : undefined;

  return (
    <div className="bg-[#1A1A18] min-h-dvh relative px-4 pt-4 pb-8">
      <button
        onClick={() => router.back()}
        aria-label="Back"
        className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25 transition-colors mb-6"
      >
        <IconArrowLeft size={16} className="text-white" />
      </button>

      {!seller ? (
        <div className="text-[12px] text-white/70 text-center pt-12">Seller not found.</div>
      ) : !sessionHasHydrated ? (
        <div className="text-[12px] text-white/70 text-center pt-12">Loading…</div>
      ) : !hasSessionForThisSeller ? (
        <div className="flex flex-col items-center text-center pt-16">
          <div className="text-[14px] font-semibold text-white mb-1.5">
            {seller.name} isn&apos;t live right now
          </div>
          <p className="text-[11px] text-white/60 px-6">
            No live session is scheduled at the moment. Check back later, or follow their
            storefront to see it as soon as one is announced.
          </p>
          <Link
            href={`/seller/${seller.id}`}
            className="mt-5 text-[11px] font-semibold text-gl-brand active:opacity-70 transition-opacity"
          >
            View {seller.name}&apos;s storefront
          </Link>
        </div>
      ) : (
        (() => {
          const info = platformConfig[session.platform];
          const PlatformIcon = info.icon;
          const handle = seller.store?.socials?.[
            session.platform === "tiktok"
              ? "tiktokHandle"
              : session.platform === "instagram"
                ? "instagramHandle"
                : "facebookHandle"
          ];
          const dateTime = new Date(`${session.date}T${session.time}`);
          const isUpcoming = dateTime.getTime() > Date.now();

          return (
            <div className="flex flex-col items-center text-center pt-6">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <PlatformIcon size={30} className={info.iconClass} />
              </div>

              <div className="text-[15px] font-semibold text-white mb-1">
                {isUpcoming ? `${seller.name} is going live on ${info.label}` : `${seller.name} went live on ${info.label}`}
              </div>
              <p className="text-[11px] text-white/60 px-6 mb-5">
                GRAPPlive doesn&apos;t host video here — this opens {seller.name}&apos;s real{" "}
                {info.label} profile, where the broadcast actually happens.
              </p>

              <div className="w-full bg-white/5 rounded-lg p-3 mb-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <IconCalendarEvent size={13} className="text-white/50" />
                  <span className="text-[11px] text-white/80">
                    {dateTime.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <IconClock size={13} className="text-white/50" />
                  <span className="text-[11px] text-white/80">
                    {dateTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {(pinnedCatalogProduct || session.productName) && (
                <Link
                  href={pinnedCatalogProduct ? `/product/${session.productId}` : "#"}
                  className="w-full bg-white rounded-lg p-2.5 flex items-center gap-2.5 mb-4 active:bg-gl-bg-muted transition-colors"
                >
                  <div className="w-[38px] h-[38px] rounded-md shrink-0 overflow-hidden gl-shimmer" />
                  <div className="flex-1 text-left">
                    <div className="text-[10px] text-gl-text-secondary">Featured product</div>
                    <div className="text-[11px] font-semibold text-gl-text">
                      {pinnedCatalogProduct?.name ?? session.productName}
                    </div>
                  </div>
                </Link>
              )}

              {handle ? (
                <Link
                  href={info.buildUrl(handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gl-brand text-white rounded-lg py-3 text-[13px] font-semibold flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
                >
                  Open on {info.label}
                  <IconExternalLink size={14} />
                </Link>
              ) : (
                <p className="text-[10px] text-white/40">
                  {seller.name} hasn&apos;t linked a {info.label} profile.
                </p>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
}
