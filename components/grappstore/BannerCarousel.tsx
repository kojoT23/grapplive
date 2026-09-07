"use client";

import { useState } from "react";
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
  gradient: string;
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
    gradient: "linear-gradient(135deg, var(--color-gl-brand), #A30D5F)",
  },
  {
    id: "new-arrivals",
    icon: IconSparkles,
    eyebrow: "NEW ARRIVALS",
    headline: "Just landed",
    subtext: "Fresh styles added every week",
    cta: "Explore",
    href: "/grappstore/categories",
    gradient: "linear-gradient(135deg, #2B2E36, #4A4F5C)",
  },
  {
    id: "free-delivery",
    icon: IconTruckDelivery,
    eyebrow: "GRAPPLIVE GUARANTEED",
    headline: "Genuine, delivered fast",
    subtext: "3–5 days, backed by GRAPPlive",
    cta: "Shop Now",
    href: "/grappstore/categories",
    gradient: "linear-gradient(135deg, #2E6B4F, #3E8A67)",
  },
];

export function BannerCarousel() {
  const [activeBanner, setActiveBanner] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveBanner(index);
  };

  return (
    <>
      <div
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide mx-3 md:mx-5 mb-2 rounded-lg"
      >
        {bannerSlides.map((slide) => {
          const Icon = slide.icon;
          return (
            <Link
              key={slide.id}
              href={slide.href}
              className="w-full shrink-0 snap-center px-4 py-4 flex items-center justify-between relative overflow-hidden transition-transform active:scale-[0.98]"
              style={{ background: slide.gradient }}
            >
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex items-center gap-1 text-[10px] font-bold text-white/90 mb-1">
                  <Icon size={12} className="fill-white" />
                  {slide.eyebrow}
                </div>
                <div className="text-[18px] font-bold text-white leading-tight mb-0.5">{slide.headline}</div>
                <div className="text-[10px] text-white/80 mb-2.5">{slide.subtext}</div>
                <span className="inline-block bg-white text-gl-brand text-[10px] font-bold px-3 py-1.5 rounded-md">
                  {slide.cta}
                </span>
              </div>
            </Link>
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
