"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCircleCheck,
  IconMapPin,
  IconCalendar,
  IconStarFilled,
  IconShare,
  IconPencil,
  IconPlayerPlayFilled,
  IconDots,
  IconMicrophone,
  IconVideo,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useBuyerRequestsStore, type BuyerRequest } from "@/lib/store/useBuyerRequestsStore";
import { SellerReplyModal } from "@/components/ui/SellerReplyModal";

const contentTabs = ["Home", "Products", "Collections", "Deals", "Reviews", "About"] as const;

const storeProfile = {
  name: "Akosua Boutique",
  tagline: "Trendy. Affordable. Yours.",
  location: "Accra, Ghana",
  joined: "May 2023",
  rating: 4.8,
  reviewCount: 256,
};

const featuredVideos = [
  { id: "v1", title: "New Ankara Collection", priceGHS: 180, durationLabel: "0:26" },
  { id: "v2", title: "3 Ways to Style This Dress", priceGHS: 165, durationLabel: "0:32" },
  { id: "v3", title: "Weekend Deals You'll Love", priceGHS: 120, durationLabel: "0:29" },
];

const storeCategories = [
  { label: "Dresses", count: 28 },
  { label: "Tops", count: 36 },
  { label: "Bottoms", count: 24 },
  { label: "Jumpsuits", count: 18 },
  { label: "Shoes", count: 22 },
  { label: "Bags", count: 15 },
];

const statusConfig = {
  new: { label: "New", bgClass: "bg-gl-brand-soft-bg", textClass: "text-gl-brand-soft-text" },
  replied: { label: "Replied", bgClass: "bg-gl-green-soft-bg", textClass: "text-gl-green-soft-text" },
  closed: { label: "Closed", bgClass: "bg-gl-bg-muted", textClass: "text-gl-text-secondary" },
} as const;

function maskedPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone || "Unknown";
  return `•••${digits.slice(-4)}`;
}

function whatsAppLink(phone: string, productName: string) {
  const digits = phone.replace(/\D/g, "");
  const text = encodeURIComponent(`Hi, following up on your video call request about "${productName}"`);
  return `https://wa.me/${digits}?text=${text}`;
}

export default function SellerStorefrontPage() {
  const { isChecking } = useRequireAuth("sell");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof contentTabs)[number]>("Home");

  // Not filtered by seller id — this prototype supports one seller
  // account's worth of test data at a time, so every request currently in
  // the store belongs to whoever's testing. A real multi-seller build
  // would filter by the logged-in seller's id here.
  const requests = useBuyerRequestsStore((s) => s.requests);
  const markReplied = useBuyerRequestsStore((s) => s.markReplied);
  const [replyTarget, setReplyTarget] = useState<BuyerRequest | null>(null);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const handleSendReply = (audioUrl: string) => {
    if (!replyTarget) return;
    markReplied(replyTarget.id, audioUrl);
  };

  const handleCallOnWhatsApp = (req: BuyerRequest) => {
    window.open(whatsAppLink(req.buyerPhone, req.productName), "_blank");
    markReplied(req.id);
  };

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={18} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text flex-1">My storefront</h1>
        <button className="text-[11px] font-semibold text-gl-brand active:opacity-70 transition-opacity">
          View store
        </button>
      </div>

      <div className="mx-3 md:mx-5 mb-4 bg-gl-brand rounded-xl p-4 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 text-[20px] font-bold text-gl-brand">
            {storeProfile.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-semibold text-white truncate">{storeProfile.name}</span>
              <IconCircleCheck size={14} className="text-white shrink-0" />
            </div>
            <div className="text-[10px] text-white/80">{storeProfile.tagline}</div>
          </div>
        </div>
        <div className="relative flex flex-wrap gap-1.5 mb-3">
          <span className="flex items-center gap-1 bg-white/15 text-white text-[9px] px-2 py-1 rounded-full">
            <IconMapPin size={10} />
            {storeProfile.location}
          </span>
          <span className="flex items-center gap-1 bg-white/15 text-white text-[9px] px-2 py-1 rounded-full">
            <IconCalendar size={10} />
            Joined {storeProfile.joined}
          </span>
          <span className="flex items-center gap-1 bg-white/15 text-white text-[9px] px-2 py-1 rounded-full">
            <IconStarFilled size={10} />
            {storeProfile.rating} ({storeProfile.reviewCount})
          </span>
        </div>
        <div className="relative flex gap-2">
          <button className="flex-1 bg-white text-gl-brand text-[11px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity">
            <IconPencil size={13} />
            Edit storefront
          </button>
          <button className="w-10 h-9 bg-white/15 rounded-lg flex items-center justify-center active:bg-white/25 transition-colors">
            <IconShare size={14} className="text-white" />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 px-3 md:px-5 pb-4 overflow-x-auto">
        {contentTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-gl-brand text-white"
                : "bg-gl-bg-muted text-gl-text-secondary active:bg-gl-border"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 md:px-5 pb-2">
        <h3 className="text-[13px] font-semibold text-gl-text">Featured videos</h3>
        <span className="text-[10px] font-semibold text-gl-brand">View all</span>
      </div>
      <div className="flex gap-2.5 px-3 md:px-5 pb-4 overflow-x-auto">
        {featuredVideos.map((video) => (
          <div key={video.id} className="w-[130px] shrink-0">
            <div className="w-full h-[100px] rounded-lg gl-shimmer relative overflow-hidden mb-1.5">
              <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded">
                {video.durationLabel}
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-black/45 flex items-center justify-center">
                  <IconPlayerPlayFilled size={14} className="text-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="text-[10px] text-gl-text leading-snug line-clamp-2 mb-0.5">{video.title}</div>
            <div className="text-[10px] font-semibold text-gl-brand">GHS {video.priceGHS}</div>
          </div>
        ))}
      </div>

      {/* Buyer requests — real data now, from useBuyerRequestsStore. Audio
          requests play back real recorded audio; video-call requests get
          a real wa.me deep link using the buyer's phone captured at
          request time (useAppStore.phone), pre-filled with product
          context. */}
      <div className="px-3 md:px-5 pb-2">
        <h3 className="text-[13px] font-semibold text-gl-text">Buyer requests</h3>
        <p className="text-[10px] text-gl-text-secondary">
          Customers can send a voice message or request a video call about any product.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="px-3 md:px-5 py-6 text-center text-[11px] text-gl-text-secondary">
          No requests yet.
        </div>
      ) : (
        <div className="px-3 md:px-5 pb-1.5">
          {requests.map((req) => {
            const status = statusConfig[req.status];
            return (
              <div key={req.id} className="py-2.5 border-b border-gl-bg-muted last:border-b-0">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gl-bg-muted flex items-center justify-center shrink-0">
                    {req.type === "video_call" ? (
                      <IconVideo size={14} className="text-gl-navy" />
                    ) : (
                      <IconMicrophone size={14} className="text-gl-brand" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-semibold text-gl-text truncate">
                        Buyer {maskedPhone(req.buyerPhone)}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${status.bgClass} ${status.textClass}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gl-text-secondary truncate">Re: {req.productName}</p>
                  </div>
                </div>

                {req.type === "audio" && req.audioUrl && (
                  <div className="ml-[42px]">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio src={req.audioUrl} controls className="w-full h-8 mb-2" />
                    <button
                      onClick={() => setReplyTarget(req)}
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-gl-brand active:opacity-70 transition-opacity"
                    >
                      <IconMicrophone size={12} />
                      Reply with voice
                    </button>
                  </div>
                )}

                {req.type === "video_call" && (
                  <div className="ml-[42px]">
                    <button
                      onClick={() => handleCallOnWhatsApp(req)}
                      className="flex items-center gap-1.5 bg-gl-green text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg active:opacity-80 transition-opacity"
                    >
                      <IconBrandWhatsapp size={13} />
                      Call on WhatsApp
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h3 className="px-3 md:px-5 pb-2 pt-2 text-[13px] font-semibold text-gl-text">Shop by category</h3>
      <div className="flex gap-3.5 px-3 md:px-5 pb-4 overflow-x-auto">
        {storeCategories.map((cat) => (
          <div key={cat.label} className="text-center text-[9px] text-gl-text-secondary shrink-0">
            <div className="w-[46px] h-[46px] rounded-full mx-auto mb-1 gl-shimmer" />
            <div>{cat.label}</div>
            <div className="text-gl-text-muted">({cat.count})</div>
          </div>
        ))}
        <div className="text-center text-[9px] text-gl-text-secondary shrink-0">
          <div className="w-[46px] h-[46px] rounded-full mx-auto mb-1 bg-gl-bg-muted flex items-center justify-center">
            <IconDots size={18} className="text-gl-text-secondary" />
          </div>
          More
        </div>
      </div>

      <div className="mx-3 md:mx-5 mt-2 border border-dashed border-gl-border rounded-lg p-3 flex items-start gap-2">
        <IconMicrophone size={14} className="text-gl-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-gl-text-secondary">
          Products, store analytics, and the setup checklist are next — those need real product
          and store data this pass didn&apos;t have yet.
        </p>
      </div>

      {replyTarget && (
        <SellerReplyModal
          isOpen={!!replyTarget}
          onClose={() => setReplyTarget(null)}
          buyerLabel={`buyer ${maskedPhone(replyTarget.buyerPhone)}`}
          onSend={handleSendReply}
        />
      )}
    </div>
  );
}
