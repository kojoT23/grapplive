"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Wraps a horizontally-scrolling row of fixed-width cards and gives it
// "card-stack" depth: whichever card is centered scales to full size/
// opacity, neighbors shrink and fade slightly. Uses plain scroll-position
// math (same technique BannerCarousel already uses for its dot indicators)
// rather than CSS scroll-driven animation features, since those aren't
// reliably supported in Safari yet.
//
// Direct DOM style mutation instead of React state — this runs on every
// scroll tick, and re-rendering the whole row on each tick would be far
// more expensive than just writing style.transform/opacity straight to
// each child element.
export function PeekScrollRow({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.children) as HTMLElement[];

    const update = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(containerCenter - itemCenter);
        const maxDistance = containerRect.width / 2 + itemRect.width / 2;
        const proximity = Math.max(0, 1 - distance / Math.max(maxDistance, 1));
        const scale = 0.9 + proximity * 0.1;
        const opacity = 0.65 + proximity * 0.35;
        item.style.transform = `scale(${scale})`;
        item.style.opacity = `${opacity}`;
      });
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex gap-2.5 px-3 md:px-5 pb-4 overflow-x-auto snap-x snap-proximity scrollbar-hide"
    >
      {children}
    </div>
  );
}
