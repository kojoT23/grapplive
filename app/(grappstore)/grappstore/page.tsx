"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconSearch, IconMessageCircle, IconShoppingCart, IconBolt } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { officialCatalogProducts } from "@/lib/mock-data/officialCatalog";

const categories: { label: string; slug: string }[] = [
  { label: "Fashion", slug: "fashion" },
  { label: "Phones", slug: "phones" },
  { label: "Home", slug: "home" },
  { label: "Beauty", slug: "beauty" },
];

// Deals of the Day countdown resets to this many seconds whenever it hits
// zero — a real backend would drive this from an actual deal end-time.
const DEAL_DURATION_SECONDS = 2 * 3600 + 15 * 60 + 45;

function formatCountdown(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return { hrs: pad(hrs), mins: pad(mins), secs: pad(secs) };
}

export default function GrappStoreHomePage() {
  const [secondsLeft, setSecondsLeft] = useState(DEAL_DURATION_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? DEAL_DURATION_SECONDS : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const countdown = formatCountdown(secondsLeft);
  const dealProducts = officialCatalogProducts.filter((p) => p.discountPercent != null);

  return (
    <div>
      <div className="flex items-center gap-2 px-3 md:px-5 pt-2.5 pb-2">
        <div className="flex items-center gap-1.5 text-[15px] font-semibold text-gl-brand">
          Grappstore
        </div>
        <div className="flex-1" />
        <Link href="/grappstore/inbox" aria-label="Messages" className="active:opacity-60 transition-opacity">
          <IconMessageCircle size={20} className="text-gl-text-secondary" />
        </Link>
        <Link href="/grappstore/cart" aria-label="Cart" className="active:opacity-60 transition-opacity">
          <IconShoppingCart size={20} className="text-gl-text-secondary" />
        </Link>
      </div>

      <Link
        href="/grappstore/search"
        className="mx-3 md:mx-5 mb-3 bg-gl-bg-muted rounded-lg px-2.5 py-2 flex items-center gap-1 text-[12px] text-gl-text-secondary transition-colors active:bg-gl-border"
      >
        <IconSearch size={14} />
        Search products, brands or stores…
      </Link>

      <Link
        href="/grappstore/categories"
        className="mx-3 md:mx-5 mb-4 rounded-lg px-4 py-4 flex items-center justify-between relative overflow-hidden transition-transform active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, var(--color-gl-brand), #A30D5F)" }}
      >
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-1 text-[10px] font-bold text-white/90 mb-1">
            <IconBolt size={12} className="fill-white" />
            FLASH DEALS
          </div>
          <div className="text-[18px] font-bold text-white leading-tight mb-0.5">Up to 50% off</div>
          <div className="text-[10px] text-white/80 mb-2.5">On top picks this week</div>
          <span className="inline-block bg-white text-gl-brand text-[10px] font-bold px-3 py-1.5 rounded-md">
            Shop Now
          </span>
        </div>
      </Link>

      <h3 className="px-3 md:px-5 pb-2 text-[13px] font-semibold text-gl-text">Shop by category</h3>
      <div className="flex gap-3.5 md:gap-5 px-3 md:px-5 pb-3.5 overflow-x-auto">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/grappstore/category/${cat.slug}`}
            className="text-center text-[9px] text-gl-text-secondary shrink-0 transition-transform active:scale-90"
          >
            <div className="w-[46px] h-[46px] md:w-14 md:h-14 rounded-full mx-auto mb-1 overflow-hidden gl-shimmer" />
            {cat.label}
          </Link>
        ))}
      </div>

      {dealProducts.length > 0 && (
        <>
          <div className="flex items-center justify-between px-3 md:px-5 pb-2">
            <h3 className="text-[13px] font-semibold text-gl-text">Deals of the day</h3>
            <div className="flex items-center gap-1">
              {[countdown.hrs, countdown.mins, countdown.secs].map((unit, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="bg-gl-text text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {unit}
                  </span>
                  {i < 2 && <span className="text-[10px] font-bold text-gl-text">:</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-4">
            {dealProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}

      <h3 className="px-3 md:px-5 pb-2 text-[13px] font-semibold text-gl-text">Discover &amp; shop</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-4">
        {officialCatalogProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
