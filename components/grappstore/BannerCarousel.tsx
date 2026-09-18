"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconBolt, IconSparkles, IconTruckDelivery } from "@tabler/icons-react";

type BannerSlide = {
  id: string;
  icon: typeof IconBolt;
  eyebrow: string;
  headline: string;
  subtext: string;
  cta: string;
  href: string;
  secondaryCta?: string;
  secondaryHref?: string;
  background: string;
};

const bannerSlides: BannerSlide[] = [
  {
    id: "flash-deals",
    icon: IconBolt,
    eyebrow: "FLASH DEALS",
    headline: "Up to 50% off",
    subtext: "On top picks this week",
    cta: "Shop Now",
    href: "/grappstore/categories",
    // Points to the real Deals of the Day section further down this same
    // page — a second button only earns its place if it goes somewhere
    // meaningfully different, not just a second click to the same place.
    secondaryCta: "View Deals",
    secondaryHref: "#deals-of-the-day",
    background: "var(--color-gl-brand)",
  },
  {
    id: "new-arrivals",
    icon: IconSparkles,
    eyebrow: "NEW ARRIVALS",
    headline: "Just landed",
    subtext: "Fresh styles added every week",
    cta: "Explore",
    href: "/grappstore/categories",
    background: "var(--color-gl-navy)",
  },
  {
    id: "free-delivery",
    icon: IconTruckDelivery,
    eyebrow: "GRAPPLIVE GUARANTEED",
    headline: "Genuine, delivered fast",
    subtext: "3–5 days, backed by GRAPPlive",
    cta: "Shop Now",
    href: "/grappstore/categories",
    background: "var(--color-gl-green)",
  },
];

const AUTOPLAY_INTERVAL_MS = 4000;
const RESUME_AFTER_INTERACTION_MS = 6000;

export function BannerCarousel() {
  const [activeBanner, setActiveBanner] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeBannerRef = useRef(0);
  const lastInteractionRef = useRef(0);

  useEffect(() => {
    activeBannerRef.current = activeBanner;
  }, [activeBanner]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveBanner(index);
  };

  const markManualInteraction = () => {
    lastInteractionRef.current = Date.now();
  };

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      if (timeSinceInteraction < RESUME_AFTER_INTERACTION_MS) return;

      const container = scrollRef.current;
      if (!container) return;

      const nextIndex = (activeBannerRef.current + 1) % bannerSlides.length;
      container.scrollTo({ left: nextIndex * container.clientWidth, behavior: "smooth" });
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={markManualInteraction}
        onPointerDown={markManualInteraction}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide mx-3 md:mx-5 mb-2 rounded-xl"
      >
        {bannerSlides.map((slide) => {
          const Icon = slide.icon;
          return (
            // A plain div now, not a Link — with two real buttons inside,
            // making the whole card itself a link too would mean nesting
            // an anchor inside an anchor, which is invalid HTML and gives
            // unpredictable tap behavior. Each CTA is its own link instead.
            <div
              key={slide.id}
              className="w-full shrink-0 snap-center min-h-[180px] md:min-h-[220px] px-5 py-7 flex items-center justify-between relative overflow-hidden shadow-sm shadow-black/10"
              style={{ background: slide.background }}
            >
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -right-3 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90 mb-2">
                  <Icon size={14} className="fill-white" />
                  {slide.eyebrow}
                </div>
                <div className="text-[24px] font-bold text-white leading-tight mb-1.5 max-w-[220px]">
                  {slide.headline}
                </div>
                <div className="text-[12px] text-white/80 mb-4 max-w-[220px]">{slide.subtext}</div>
                <div className="flex items-center gap-2">
                  <Link
                    href={slide.href}
                    className="inline-block bg-white text-gl-brand text-[12px] font-bold px-4 py-2 rounded-md shadow-md shadow-black/15 active:scale-[0.97] transition-transform"
                  >
                    {slide.cta}
                  </Link>
                  {slide.secondaryCta && slide.secondaryHref && (
                    <Link
                      href={slide.secondaryHref}
                      className="inline-block border border-white/70 text-white text-[12px] font-semibold px-4 py-2 rounded-md active:bg-white/10 transition-colors"
                    >
                      {slide.secondaryCta}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {bannerSlides.map((slide, i) => (
          <div
            key={slide.id}
            className={`h-1.5 rounded-full transition-all ${
              i === activeBanner ? "w-4 bg-gl-brand" : "w-1.5 bg-gl-border-strong"
            }`}
          />
        ))}
      </div>
    </>
  );
}
