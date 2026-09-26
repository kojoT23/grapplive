"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandFacebook,
  IconLayoutGrid,
  IconFlame,
  IconSparkles,
  IconEyeOff,
  IconCheck,
  IconTools,
  IconBroadcast,
} from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useBuyerRequestsStore, type BuyerRequest } from "@/lib/store/useBuyerRequestsStore";
import { useStoreProfileStore } from "@/lib/store/useStoreProfileStore";
import { getSellerById } from "@/lib/mock-data/sellers";
import { type CatalogProduct } from "@/lib/mock-data/catalog";
import { getReviewsForProducts } from "@/lib/mock-data/reviews";
import { SellerReplyModal } from "@/components/ui/SellerReplyModal";
import { EditStorefrontSheet } from "@/components/ui/EditStorefrontSheet";

// No real auth/session yet, so the logged-in seller is hardcoded to the
// one real seller id ("s1", Ama's Fashion House) that both catalog.ts and
// stores.ts already agree on — same placeholder-id pattern used elsewhere
// in this build (e.g. payouts, product ids) until real auth exists.
const CURRENT_SELLER_ID = "s1";

const contentTabs = ["Home", "Products", "Collections", "Deals", "Reviews", "About"] as const;
type ContentTab = (typeof contentTabs)[number];

// Only Home, Reviews, and About have real data behind them right now.
// The others get an honest "not built yet" placeholder rather than
// silently showing nothing when clicked.
const unbuiltTabs = new Set<ContentTab>(["Products", "Collections", "Deals"]);

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

const requestStatusConfig = {
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

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function SectionHeader({
  icon,
  title,
  action,
  actionHref,
  accentClass = "bg-gl-brand-soft-bg text-gl-brand",
}: {
  icon: React.ReactNode;
  title: string;
  action?: string;
  actionHref?: string;
  accentClass?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 md:px-5 pb-2 pt-3">
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${accentClass}`}>
          {icon}
        </span>
        <h3 className="text-[13px] font-semibold text-gl-text">{title}</h3>
      </div>
      {action &&
        (actionHref ? (
          <Link href={actionHref} className="text-[10px] font-semibold text-gl-brand shrink-0">
            {action}
          </Link>
        ) : (
          <span className="text-[10px] font-semibold text-gl-brand shrink-0">{action}</span>
        ))}
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const isLowStock = typeof product.stockCount === "number" && product.stockCount > 0 && product.stockCount <= 5;

  return (
    <Link href={`/products/${product.id}`} className="w-[118px] shrink-0">
      <div className="w-full h-[90px] rounded-lg gl-shimmer relative overflow-hidden mb-1.5">
        {product.verifiedTier === "top_seller" && (
          <span className="absolute top-1 left-1 bg-white text-gl-text text-[8px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <IconStarFilled size={7} className="text-gl-amber" />
            Top seller
          </span>
        )}
      </div>
      <div className="text-[10px] text-gl-text leading-snug line-clamp-2 mb-0.5">{product.name}</div>
      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="text-[10px] font-semibold text-gl-brand">GHS {product.priceGHS}</span>
        {product.originalPriceGHS && (
          <span className="text-[8px] text-gl-text-muted line-through">GHS {product.originalPriceGHS}</span>
        )}
      </div>
      {isLowStock && (
        <div className="text-[8px] font-semibold text-gl-amber mb-0.5">Only {product.stockCount} left</div>
      )}
      {typeof product.rating === "number" && (
        <span className="flex items-center gap-0.5 text-[8px] text-gl-text-secondary">
          <IconStarFilled size={8} className="text-gl-amber" />
          {product.rating} ({fmt(product.reviewCount ?? 0)})
        </span>
      )}
    </Link>
  );
}

function ProductRow({
  title,
  icon,
  accentClass,
  products,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  accentClass: string;
  products: CatalogProduct[];
  emptyLabel: string;
}) {
  return (
    <>
      <SectionHeader icon={icon} title={title} action="View all" actionHref="/products" accentClass={accentClass} />
      {products.length === 0 ? (
        <div className="px-3 md:px-5 pb-4 text-[11px] text-gl-text-secondary">{emptyLabel}</div>
      ) : (
        <div className="flex gap-2.5 px-3 md:px-5 pb-4 overflow-x-auto">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

type ChecklistItem = {
  label: string;
  done: boolean;
};

function SetupChecklist({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return (
    <div className="bg-white rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-gl-text">Store setup</span>
        <span className="text-[10px] font-semibold text-gl-brand">{percent}% complete</span>
      </div>
      <div className="h-1.5 bg-gl-bg-muted rounded-full overflow-hidden mb-3">
        <div className="h-full bg-gl-brand rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.done ? (
              <div className="w-4 h-4 rounded-full bg-gl-green flex items-center justify-center shrink-0">
                <IconCheck size={10} className="text-white" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border border-gl-border-strong shrink-0" />
            )}
            <span className={`text-[10.5px] ${item.done ? "text-gl-text" : "text-gl-text-secondary"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <IconStarFilled key={i} size={11} className={i < rating ? "text-gl-amber" : "text-gl-bg-placeholder"} />
      ))}
    </div>
  );
}

export default function SellerStorefrontPage() {
  const { isChecking } = useRequireAuth("sell");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ContentTab>("Home");
  const [showEditSheet, setShowEditSheet] = useState(false);

  const seller = getSellerById(CURRENT_SELLER_ID);
  const store = seller?.store;
  const sellerProducts = seller?.products ?? [];
  const sellerReviews = getReviewsForProducts(sellerProducts.map((p) => p.id));

  // Editable profile state — seeded from the real Store record, real
  // edits (including uploaded images) persist across reloads.
  // hasHydrated guards against showing an empty/seed value flash before
  // localStorage rehydrates.
  const profileHasHydrated = useStoreProfileStore((s) => s.hasHydrated);
  const profileAbout = useStoreProfileStore((s) => s.about);
  const profileSocials = useStoreProfileStore((s) => s.socials);
  const logoDataUrl = useStoreProfileStore((s) => s.logoDataUrl);
  const bannerDataUrl = useStoreProfileStore((s) => s.bannerDataUrl);
  const displayAbout = profileHasHydrated ? profileAbout : store?.about ?? "";
  const displaySocials = profileHasHydrated ? profileSocials : store?.socials ?? {};
  const displayLogo = profileHasHydrated ? logoDataUrl : null;
  const displayBanner = profileHasHydrated ? bannerDataUrl : null;

  const bestSelling = [...sellerProducts].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)).slice(0, 6);
  const latestProducts = sellerProducts.slice(0, 6);
  const totalReviews = sellerProducts.reduce((sum, p) => sum + (p.reviewCount ?? 0), 0);

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

  const storeName = seller?.name ?? "My Store";
  const deliveryAreas = store?.deliveryAreas ?? [];
  const visibleAreas = deliveryAreas.slice(0, 2);
  const extraAreaCount = deliveryAreas.length - visibleAreas.length;

  const hasAnySocial = Boolean(
    displaySocials.whatsappNumber ||
      displaySocials.instagramHandle ||
      displaySocials.tiktokHandle ||
      displaySocials.facebookHandle
  );

  const checklistItems: ChecklistItem[] = [
    { label: "Store description added", done: displayAbout.trim().length > 0 },
    { label: "Social links added", done: hasAnySocial },
    { label: "Delivery areas set", done: deliveryAreas.length > 0 },
    { label: "Audio requests enabled", done: true },
    { label: "Store logo added", done: !!displayLogo },
    { label: "Store banner added", done: !!displayBanner },
  ];

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={18} className="text-gl-text" />
        </button>
        <div className="flex-1 flex items-center gap-1.5">
          <h1 className="text-[14px] font-semibold text-gl-text">My storefront</h1>
          <span className="flex items-center gap-1 bg-gl-bg-muted text-gl-text-secondary text-[8px] font-semibold px-1.5 py-0.5 rounded-full">
            <IconEyeOff size={9} />
            Seller view
          </span>
        </div>
        <Link
          href={`/seller/${CURRENT_SELLER_ID}`}
          className="text-[11px] font-semibold text-gl-brand active:opacity-70 transition-opacity"
        >
          View store
        </Link>
      </div>

      <div className="mx-3 md:mx-5 mb-3 rounded-xl overflow-hidden">
        <div className="h-[92px] relative overflow-hidden bg-gl-bg-muted">
          {displayBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayBanner} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gl-shimmer relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" preserveAspectRatio="none">
                <defs>
                  <pattern id="storefront-banner-weave" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#storefront-banner-weave)" className="text-gl-text" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
        <div className="bg-gl-brand px-4 pt-0 pb-4 relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="storefront-weave" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="14" stroke="white" strokeWidth="2" />
                <line x1="7" y1="0" x2="7" y2="14" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#storefront-weave)" />
          </svg>

          <div className="relative flex items-end gap-3 mb-3 -mt-7">
            <div className="w-16 h-16 rounded-full bg-white ring-4 ring-gl-brand overflow-hidden flex items-center justify-center shrink-0 text-[22px] font-bold text-gl-brand">
              {displayLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                storeName.charAt(0)
              )}
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-semibold text-white truncate">{storeName}</span>
                <IconCircleCheck size={14} className="text-white shrink-0" />
              </div>
              {displayAbout && <div className="text-[10px] text-white/80 line-clamp-1">{displayAbout}</div>}
            </div>
          </div>
          <div className="relative flex flex-wrap gap-1.5 mb-3">
            {visibleAreas.map((area) => (
              <span key={area} className="flex items-center gap-1 bg-white/15 text-white text-[9px] px-2 py-1 rounded-full">
                <IconMapPin size={10} />
                {area}
              </span>
            ))}
            {extraAreaCount > 0 && (
              <span className="flex items-center bg-white/15 text-white text-[9px] px-2 py-1 rounded-full">
                +{extraAreaCount} more
              </span>
            )}
            {store?.memberSince && (
              <span className="flex items-center gap-1 bg-white/15 text-white text-[9px] px-2 py-1 rounded-full">
                <IconCalendar size={10} />
                Member since {store.memberSince}
              </span>
            )}
            {typeof store?.rating === "number" && (
              <span className="flex items-center gap-1 bg-white/15 text-white text-[9px] px-2 py-1 rounded-full">
                <IconStarFilled size={10} />
                {store.rating} ({fmt(store.reviewCount)})
              </span>
            )}
          </div>
          <div className="relative flex gap-2">
            <button
              onClick={() => setShowEditSheet(true)}
              className="flex-1 bg-white text-gl-brand text-[11px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
            >
              <IconPencil size={13} />
              Edit storefront
            </button>
            <button className="w-10 h-9 bg-white/15 rounded-lg flex items-center justify-center active:bg-white/25 transition-colors">
              <IconShare size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-3 md:mx-5 mb-4 bg-gl-bg-muted rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
          <IconEyeOff size={11} className="text-gl-text-muted" />
          <span className="text-[9px] font-semibold text-gl-text-muted uppercase tracking-wide">
            Seller tools — not visible to buyers
          </span>
        </div>

        <Link
          href="/storefront/go-live"
          className="flex items-center justify-center gap-1.5 w-full bg-gl-brand text-white text-[11px] font-semibold py-2.5 rounded-lg mb-3 active:opacity-80 transition-opacity"
        >
          <IconBroadcast size={14} />
          Schedule a live session
        </Link>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-lg py-2.5 text-center">
            <div className="text-[14px] font-semibold text-gl-text">{sellerProducts.length}</div>
            <div className="text-[8px] text-gl-text-secondary">Live products</div>
          </div>
          <div className="bg-white rounded-lg py-2.5 text-center">
            <div className="text-[14px] font-semibold text-gl-text">{fmt(totalReviews)}</div>
            <div className="text-[8px] text-gl-text-secondary">Total reviews</div>
          </div>
          <div className="bg-white rounded-lg py-2.5 text-center">
            <div className="text-[14px] font-semibold text-gl-text">{requests.length}</div>
            <div className="text-[8px] text-gl-text-secondary">Buyer requests</div>
          </div>
        </div>

        <SetupChecklist items={checklistItems} />

        <div className="flex items-center gap-2 px-0.5 pb-1.5">
          <span className="w-6 h-6 rounded-md bg-gl-navy/10 text-gl-navy flex items-center justify-center shrink-0">
            <IconMicrophone size={12} />
          </span>
          <h3 className="text-[12px] font-semibold text-gl-text">Buyer requests</h3>
        </div>
        <p className="px-0.5 pb-2 text-[10px] text-gl-text-secondary">
          Customers can send a voice message or request a video call about any product.
        </p>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg py-5 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-gl-bg-muted flex items-center justify-center mb-1.5">
              <IconMicrophone size={14} className="text-gl-text-muted" />
            </div>
            <p className="text-[10.5px] text-gl-text-secondary px-6">
              No requests yet — they&apos;ll show up here as buyers ask about your products.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg px-2.5">
            {requests.map((req) => {
              const status = requestStatusConfig[req.status];
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
      </div>

      <div className="flex gap-4 px-3 md:px-5 border-b border-gl-border overflow-x-auto">
        {contentTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 pt-1 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-gl-brand text-gl-brand"
                : "border-transparent text-gl-text-secondary active:text-gl-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Home" && (
        <>
          <SectionHeader
            icon={<IconPlayerPlayFilled size={12} />}
            title="Featured videos"
            action="View all"
            accentClass="bg-gl-brand-soft-bg text-gl-brand"
          />
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

          <SectionHeader
            icon={<IconLayoutGrid size={12} />}
            title="Shop by category"
            accentClass="bg-gl-amber-soft-bg text-gl-amber-soft-text"
          />
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

          <ProductRow
            title="Best selling products"
            icon={<IconFlame size={12} />}
            accentClass="bg-gl-green-soft-bg text-gl-green-soft-text"
            products={bestSelling}
            emptyLabel="No products yet."
          />
          <ProductRow
            title="Latest products"
            icon={<IconSparkles size={12} />}
            accentClass="bg-gl-brand-soft-bg text-gl-brand"
            products={latestProducts}
            emptyLabel="No products yet."
          />
        </>
      )}

      {activeTab === "Reviews" && (
        <div className="px-3 md:px-5 pt-3 pb-4">
          <div className="flex items-center gap-2 mb-3">
            {typeof store?.rating === "number" && (
              <>
                <span className="text-[20px] font-bold text-gl-text">{store.rating}</span>
                <div>
                  <StarRow rating={Math.round(store.rating)} />
                  <div className="text-[9px] text-gl-text-secondary">{fmt(store.reviewCount)} total reviews</div>
                </div>
              </>
            )}
          </div>
          {sellerReviews.length === 0 ? (
            <p className="text-[11px] text-gl-text-secondary">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sellerReviews.map((review) => {
                const product = sellerProducts.find((p) => p.id === review.productId);
                return (
                  <div key={review.id} className="border-b border-gl-bg-muted pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gl-text">{review.reviewerName}</span>
                      <span className="text-[9px] text-gl-text-muted">{review.timeAgo}</span>
                    </div>
                    <StarRow rating={review.rating} />
                    {product && <p className="text-[9px] text-gl-text-muted mt-1">On: {product.name}</p>}
                    <p className="text-[10.5px] text-gl-text-secondary leading-relaxed mt-1.5">{review.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "About" && (
        <div className="px-3 md:px-5 pt-3 pb-4">
          <p className="text-[11.5px] text-gl-text-secondary leading-relaxed mb-4">
            {displayAbout || "No store description yet."}
          </p>

          <h4 className="text-[10px] font-semibold text-gl-text-secondary uppercase tracking-wide mb-1.5">
            Delivery areas
          </h4>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {deliveryAreas.length === 0 ? (
              <span className="text-[10px] text-gl-text-muted">Not set</span>
            ) : (
              deliveryAreas.map((area) => (
                <span key={area} className="flex items-center gap-1 bg-gl-bg-muted text-gl-text-secondary text-[9px] px-2 py-1 rounded-full">
                  <IconMapPin size={10} />
                  {area}
                </span>
              ))
            )}
          </div>

          <h4 className="text-[10px] font-semibold text-gl-text-secondary uppercase tracking-wide mb-1.5">Socials</h4>
          {!hasAnySocial ? (
            <span className="text-[10px] text-gl-text-muted">Not set</span>
          ) : (
            <div className="flex flex-col gap-1.5">
              {displaySocials.whatsappNumber && (
                <div className="flex items-center gap-2 text-[11px] text-gl-text">
                  <IconBrandWhatsapp size={14} className="text-gl-green" />
                  {displaySocials.whatsappNumber}
                </div>
              )}
              {displaySocials.instagramHandle && (
                <div className="flex items-center gap-2 text-[11px] text-gl-text">
                  <IconBrandInstagram size={14} className="text-gl-brand" />@{displaySocials.instagramHandle}
                </div>
              )}
              {displaySocials.tiktokHandle && (
                <div className="flex items-center gap-2 text-[11px] text-gl-text">
                  <IconBrandTiktok size={14} className="text-gl-text" />@{displaySocials.tiktokHandle}
                </div>
              )}
              {displaySocials.facebookHandle && (
                <div className="flex items-center gap-2 text-[11px] text-gl-text">
                  <IconBrandFacebook size={14} className="text-gl-navy" />
                  {displaySocials.facebookHandle}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {unbuiltTabs.has(activeTab) && (
        <div className="mx-3 md:mx-5 mt-3 border border-dashed border-gl-border rounded-lg py-8 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-full bg-gl-bg-muted flex items-center justify-center mb-2">
            <IconTools size={16} className="text-gl-text-muted" />
          </div>
          <p className="text-[11px] text-gl-text-secondary px-6">
            {activeTab} isn&apos;t built yet — this tab is honestly marked rather than showing
            nothing.
          </p>
        </div>
      )}

      {activeTab === "Home" && (
        <div className="mx-3 md:mx-5 mt-2 border border-dashed border-gl-border rounded-lg p-3 flex items-start gap-2">
          <IconMicrophone size={14} className="text-gl-text-muted shrink-0 mt-0.5" />
          <p className="text-[10px] text-gl-text-secondary">
            The grapplive_staff redirect bug is next. Logo/banner uploads are now real and
            persisted (capped at 2MB, stored as base64).
          </p>
        </div>
      )}

      {replyTarget && (
        <SellerReplyModal
          isOpen={!!replyTarget}
          onClose={() => setReplyTarget(null)}
          buyerLabel={`buyer ${maskedPhone(replyTarget.buyerPhone)}`}
          onSend={handleSendReply}
        />
      )}

      <EditStorefrontSheet isOpen={showEditSheet} onClose={() => setShowEditSheet(false)} />
    </div>
  );
}
