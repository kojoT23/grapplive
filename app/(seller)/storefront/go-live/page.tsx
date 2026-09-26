"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconClock,
  IconCheck,
  IconChevronRight,
  IconBroadcast,
  IconBrandTiktok,
  IconBrandInstagram,
  IconBrandFacebook,
  IconExternalLink,
} from "@tabler/icons-react";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { useStoreProfileStore } from "@/lib/store/useStoreProfileStore";
import { useLiveSessionStore, type Platform as SessionPlatform } from "@/lib/store/useLiveSessionStore";

type Platform = "tiktok" | "instagram" | "facebook";

const platformConfig: Record<
  Platform,
  { label: string; icon: typeof IconBrandTiktok; iconClass: string }
> = {
  tiktok: { label: "TikTok", icon: IconBrandTiktok, iconClass: "text-gl-text" },
  instagram: { label: "Instagram", icon: IconBrandInstagram, iconClass: "text-gl-brand" },
  facebook: { label: "Facebook", icon: IconBrandFacebook, iconClass: "text-gl-navy" },
};

type ScheduledSession = {
  date: string;
  time: string;
  productId: string;
  platform: Platform;
};

export default function GoLivePage() {
  const router = useRouter();
  const products = useProductsStore((s) => s.products);
  const productsHasHydrated = useProductsStore((s) => s.hasHydrated);

  const socialsHasHydrated = useStoreProfileStore((s) => s.hasHydrated);
  const socials = useStoreProfileStore((s) => s.socials);

  const existingSession = useLiveSessionStore((s) => s.session);
  const scheduleSession = useLiveSessionStore((s) => s.scheduleSession);
  const clearSession = useLiveSessionStore((s) => s.clearSession);
  const sessionHasHydrated = useLiveSessionStore((s) => s.hasHydrated);

  const now = new Date();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [productId, setProductId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledSession | null>(null);

  // If a session is already scheduled (persisted from a previous visit to
  // this page), show the confirmation view for it instead of a blank form.
  // Runs as an effect, not during render, so it doesn't fight React's
  // hydration pass the way a bare in-render setState would.
  useEffect(() => {
    if (sessionHasHydrated && existingSession && !scheduled) {
      setScheduled({
        date: existingSession.date,
        time: existingSession.time,
        productId: existingSession.productId,
        platform: existingSession.platform,
      });
    }
  }, [sessionHasHydrated, existingSession, scheduled]);

  const pinnableProducts = products.filter((p) => p.status === "live");
  const selectedProduct = pinnableProducts.find((p) => p.id === productId) ?? null;

  const availablePlatforms = (["tiktok", "instagram", "facebook"] as Platform[]).filter((key) => {
    if (key === "tiktok") return Boolean(socials.tiktokHandle);
    if (key === "instagram") return Boolean(socials.instagramHandle);
    return Boolean(socials.facebookHandle);
  });

  const handleForPlatform = (key: Platform) =>
    key === "tiktok" ? socials.tiktokHandle : key === "instagram" ? socials.instagramHandle : socials.facebookHandle;

  const handleSchedule = () => {
    if (!day || !month || !year || !hour || !minute) {
      setError("Pick a date and time for your session.");
      return;
    }
    const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    let hour24 = parseInt(hour, 10) % 12;
    if (period === "PM") hour24 += 12;
    const time = `${String(hour24).padStart(2, "0")}:${minute}`;

    if (!productId) {
      setError("Choose a product to pin to this session.");
      return;
    }
    if (!platform) {
      setError("Choose which platform you'll go live on.");
      return;
    }
    const sessionDateTime = new Date(`${date}T${time}`);
    if (sessionDateTime.getTime() < Date.now()) {
      setError("That time has already passed — pick a time in the future.");
      return;
    }
    setError(null);
    const product = products.find((p) => p.id === productId);
    scheduleSession({
      sellerId: "s1",
      date,
      time,
      productId,
      productName: product?.name ?? "",
      platform: platform as SessionPlatform,
    });
    setScheduled({ date, time, productId, platform });
  };

  const handleCancelScheduled = () => {
    clearSession();
    setScheduled(null);
    setDay("");
    setMonth("");
    setYear(String(now.getFullYear()));
    setHour("");
    setMinute("");
    setPeriod("AM");
    setProductId(null);
    setPlatform(null);
  };

  if (scheduled) {
    const product = products.find((p) => p.id === scheduled.productId);
    const dateTime = new Date(`${scheduled.date}T${scheduled.time}`);
    const platformInfo = platformConfig[scheduled.platform];
    const PlatformIcon = platformInfo.icon;
    const platformHandle = handleForPlatform(scheduled.platform);

    return (
      <div className="px-4 pt-4 pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-6 active:opacity-60 transition-opacity"
        >
          <IconArrowLeft size={14} /> Back
        </button>

        <div className="flex flex-col items-center text-center pt-4 pb-6">
          <div className="w-14 h-14 rounded-full bg-gl-green/10 flex items-center justify-center mb-3">
            <IconCheck size={26} className="text-gl-green" />
          </div>
          <div className="text-[15px] font-semibold text-gl-text mb-1">Live session scheduled</div>
          <div className="text-[11px] text-gl-text-secondary px-4">
            GRAPPlive doesn&apos;t host video — when it&apos;s time, start the broadcast
            yourself on {platformInfo.label}. This is just your reminder and pinned product.
          </div>
        </div>

        <div className="border border-gl-border rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <IconCalendarEvent size={14} className="text-gl-text-secondary" />
            <span className="text-[12px] text-gl-text">
              {dateTime.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <IconClock size={14} className="text-gl-text-secondary" />
            <span className="text-[12px] text-gl-text">
              {dateTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <PlatformIcon size={14} className={platformInfo.iconClass} />
            <span className="text-[12px] text-gl-text">
              Going live on {platformInfo.label}
              {platformHandle ? ` (@${platformHandle})` : ""}
            </span>
          </div>
          {product && (
            <div className="flex items-center justify-between border-t border-gl-border pt-2 mt-2">
              <span className="text-[11px] text-gl-text-secondary">Pinned product</span>
              <span className="text-[12px] font-semibold text-gl-text">{product.name}</span>
            </div>
          )}
        </div>

        <p className="text-[9px] text-gl-text-muted mb-4">
          This is stored on your device only — it won&apos;t show up if you open GRAPPlive on a
          different device, since there&apos;s no real backend yet. On this device, buyers who
          visit your live page will see this schedule.
        </p>

        <button
          onClick={handleCancelScheduled}
          className="w-full border border-gl-border-strong text-gl-text rounded-lg py-2.5 text-[12px] font-semibold active:bg-gl-bg-muted transition-colors"
        >
          Cancel and reschedule
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-4 active:opacity-60 transition-opacity"
      >
        <IconArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-2 mb-1">
        <IconBroadcast size={18} className="text-gl-brand" />
        <h1 className="text-[15px] font-semibold text-gl-text">Schedule a live session</h1>
      </div>
      <p className="text-[11px] text-gl-text-secondary mb-5">
        Set a date and time, and pin one product buyers will see featured when the session
        starts.
      </p>

      <div className="mb-3">
        <label className="text-[11px] font-semibold text-gl-text mb-1.5 block">Date</label>
        <div className="flex items-center gap-2 border border-gl-border rounded-lg px-3 py-2.5">
          <IconCalendarEvent size={14} className="text-gl-text-secondary shrink-0" />
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              if (error) setError(null);
            }}
            className="text-[12px] text-gl-text bg-transparent outline-none flex-1"
          >
            <option value="">Month</option>
            {[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ].map((label, i) => (
              <option key={label} value={String(i + 1)}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={day}
            onChange={(e) => {
              setDay(e.target.value);
              if (error) setError(null);
            }}
            className="text-[12px] text-gl-text bg-transparent outline-none w-14"
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d)}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              if (error) setError(null);
            }}
            className="text-[12px] text-gl-text bg-transparent outline-none w-20"
          >
            {[now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-[11px] font-semibold text-gl-text mb-1.5 block">Time</label>
        <div className="flex items-center gap-2 border border-gl-border rounded-lg px-3 py-2.5">
          <IconClock size={14} className="text-gl-text-secondary shrink-0" />
          <select
            value={hour}
            onChange={(e) => {
              setHour(e.target.value);
              if (error) setError(null);
            }}
            className="text-[12px] text-gl-text bg-transparent outline-none w-14"
          >
            <option value="">--</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={String(h)}>
                {h}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-gl-text-secondary">:</span>
          <select
            value={minute}
            onChange={(e) => {
              setMinute(e.target.value);
              if (error) setError(null);
            }}
            className="text-[12px] text-gl-text bg-transparent outline-none w-14"
          >
            <option value="">--</option>
            {["00", "15", "30", "45"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as "AM" | "PM");
              if (error) setError(null);
            }}
            className="text-[12px] text-gl-text bg-transparent outline-none w-16"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-[11px] font-semibold text-gl-text mb-1.5 block">
          Pinned product
        </label>
        <button
          onClick={() => setShowProductPicker(true)}
          className="w-full flex items-center justify-between border border-gl-border rounded-lg px-3 py-2.5 active:bg-gl-bg-muted transition-colors"
        >
          <span
            className={`text-[12px] ${selectedProduct ? "text-gl-text font-semibold" : "text-gl-text-muted"}`}
          >
            {selectedProduct ? selectedProduct.name : "Choose a product"}
          </span>
          <IconChevronRight size={14} className="text-gl-text-secondary" />
        </button>
      </div>

      <div className="mb-3">
        <label className="text-[11px] font-semibold text-gl-text mb-1.5 block">
          Going live on
        </label>

        {!socialsHasHydrated ? (
          <div className="text-[11px] text-gl-text-secondary py-2">Loading your socials…</div>
        ) : availablePlatforms.length === 0 ? (
          <div className="border border-dashed border-gl-border rounded-lg p-3">
            <p className="text-[11px] text-gl-text-secondary mb-2">
              Add a TikTok, Instagram or Facebook link to your storefront first — GRAPPlive
              hands buyers off to wherever you actually go live.
            </p>
            <button
              onClick={() => router.push("/storefront")}
              className="flex items-center gap-1 text-[11px] font-semibold text-gl-brand active:opacity-70 transition-opacity"
            >
              Go to storefront <IconExternalLink size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowPlatformPicker(true)}
            className="w-full flex items-center justify-between border border-gl-border rounded-lg px-3 py-2.5 active:bg-gl-bg-muted transition-colors"
          >
            {platform ? (
              <span className="flex items-center gap-2 text-[12px] text-gl-text font-semibold">
                {(() => {
                  const PlatformIcon = platformConfig[platform].icon;
                  return <PlatformIcon size={14} className={platformConfig[platform].iconClass} />;
                })()}
                {platformConfig[platform].label}
              </span>
            ) : (
              <span className="text-[12px] text-gl-text-muted">Choose a platform</span>
            )}
            <IconChevronRight size={14} className="text-gl-text-secondary" />
          </button>
        )}
      </div>

      {error && <div className="text-[10px] text-gl-red mb-3">{error}</div>}

      <button
        onClick={handleSchedule}
        className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[12px] font-semibold mt-2 active:opacity-80 transition-opacity"
      >
        Schedule session
      </button>

      {showProductPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full max-w-[480px] md:max-w-[380px] max-h-[70vh] overflow-y-auto bg-white rounded-t-2xl md:rounded-2xl p-5 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-gl-text">Choose a product</h2>
              <button
                onClick={() => setShowProductPicker(false)}
                className="text-[11px] text-gl-text-secondary active:opacity-60 transition-opacity"
              >
                Close
              </button>
            </div>

            {!productsHasHydrated ? (
              <div className="text-[11px] text-gl-text-secondary py-4 text-center">
                Loading your products…
              </div>
            ) : pinnableProducts.length === 0 ? (
              <div className="text-[11px] text-gl-text-secondary py-4 text-center">
                You don&apos;t have any live products to pin yet. Publish a product first.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pinnableProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProductId(p.id);
                      setShowProductPicker(false);
                      setError(null);
                    }}
                    className={`w-full flex items-center justify-between border rounded-lg p-3 active:bg-gl-bg-muted transition-colors ${
                      p.id === productId ? "border-gl-brand" : "border-gl-border"
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-[12px] font-semibold text-gl-text">{p.name}</div>
                      <div className="text-[9px] text-gl-text-secondary">
                        GHS {p.priceGHS} · {p.stock} in stock
                      </div>
                    </div>
                    {p.id === productId && <IconCheck size={16} className="text-gl-brand" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showPlatformPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full max-w-[480px] md:max-w-[380px] bg-white rounded-t-2xl md:rounded-2xl p-5 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-gl-text">Choose a platform</h2>
              <button
                onClick={() => setShowPlatformPicker(false)}
                className="text-[11px] text-gl-text-secondary active:opacity-60 transition-opacity"
              >
                Close
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {availablePlatforms.map((key) => {
                const info = platformConfig[key];
                const PlatformIcon = info.icon;
                const handle = handleForPlatform(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setPlatform(key);
                      setShowPlatformPicker(false);
                      setError(null);
                    }}
                    className={`w-full flex items-center justify-between border rounded-lg p-3 active:bg-gl-bg-muted transition-colors ${
                      key === platform ? "border-gl-brand" : "border-gl-border"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <PlatformIcon size={18} className={info.iconClass} />
                      <div>
                        <div className="text-[12px] font-semibold text-gl-text">{info.label}</div>
                        {handle && <div className="text-[9px] text-gl-text-secondary">@{handle}</div>}
                      </div>
                    </div>
                    {key === platform && <IconCheck size={16} className="text-gl-brand" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
