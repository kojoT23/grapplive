import Link from "next/link";
import { IconSearch, IconMapPin, IconChevronRight } from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { ProductCard } from "@/components/ui/ProductCard";
import { buyerTabs } from "@/lib/nav/buyer-tabs";
import { spotlightSellers, liveSessions, categories } from "@/lib/mock-data/home";
import { catalogProducts } from "@/lib/mock-data/catalog";

export default function HomePage() {
  return (
    <div className="pb-16">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-2.5 pb-1.5">
        <Link
          href="/search"
          className="flex-1 bg-gl-bg-muted rounded-lg px-2.5 py-2 flex items-center gap-1 text-[12px] text-gl-text-secondary transition-colors active:bg-gl-border"
        >
          <IconSearch size={14} />
          Search GRAPPlive
        </Link>
        <button className="flex items-center gap-1 text-[11px] font-semibold text-gl-text active:opacity-60 transition-opacity">
          <IconMapPin size={13} />
          Accra
        </button>
      </div>

      <p className="px-3 md:px-5 pb-1 pt-1 text-[12px] text-gl-text">
        Welcome back — here&apos;s what&apos;s happening
      </p>

      <div className="h-px bg-gl-border mx-3 md:mx-5 my-2.5" />

      <h3 className="px-3 md:px-5 pb-1 text-[13px] font-semibold text-gl-text">Live now</h3>
      <div className="flex gap-2 md:gap-3 px-3 md:px-5 pb-2.5 overflow-x-auto">
        {liveSessions.map((session) => (
          <Link
            key={session.id}
            href={`/live/${session.id}`}
            className="w-20 h-[100px] md:w-28 md:h-[140px] rounded-lg relative shrink-0 transition-transform active:scale-95 gl-shimmer overflow-hidden"
          >
            <span className="absolute top-1.5 left-1.5 bg-gl-red text-white text-[9px] font-semibold px-1.5 py-0.5 rounded gl-live-pulse">
              LIVE
            </span>
          </Link>
        ))}
      </div>

      <div className="h-px bg-gl-border mx-3 md:mx-5 mb-2.5" />

      <h3 className="px-3 md:px-5 pb-1 text-[13px] font-semibold text-gl-text">Meet the sellers</h3>
      <div className="flex gap-2.5 md:gap-4 px-3 md:px-5 pb-2.5 overflow-x-auto">
        {spotlightSellers.map((seller) => (
          <Link
            key={seller.id}
            href={`/seller/${seller.id}`}
            className="text-center shrink-0 w-[52px] md:w-16 transition-transform active:scale-95"
          >
            <div className="w-[46px] h-[46px] md:w-14 md:h-14 rounded-full mx-auto mb-1 border-[1.5px] border-gl-brand overflow-hidden gl-shimmer" />
            <div className="text-[9px] text-gl-text-secondary">{seller.name}</div>
          </Link>
        ))}
      </div>

      <div className="h-px bg-gl-border mx-3 md:mx-5 mb-2.5" />

      <div className="mx-3 md:mx-5 mb-2.5 bg-gl-brand-soft-bg rounded-lg px-3 py-2.5 flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-gl-text">Today&apos;s Market</div>
          <div className="text-[10px] text-gl-text-secondary">Up to 40% off electronics</div>
        </div>
        <div className="bg-gl-brand text-white text-[10px] font-semibold px-2 py-1 rounded">
          02:14:09
        </div>
      </div>

      <Link
        href="/verified"
        className="mx-3 md:mx-5 mb-2.5 bg-[#0B0B0B] rounded-lg px-3 py-2.5 flex items-center justify-between relative overflow-hidden transition-transform active:scale-[0.98]"
      >
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gl-brand/25" />
        <div className="relative">
          <div className="text-[12px] font-medium text-white">GRAPP Verified</div>
          <div className="text-[9px] text-white/70">Verified producers · trusted imports · top sellers</div>
        </div>
        <IconChevronRight size={16} className="relative text-white/80" />
      </Link>

      <div className="flex gap-3.5 md:gap-5 px-3 md:px-5 pb-2.5 overflow-x-auto">
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/category/${cat.toLowerCase()}`}
            className="text-center text-[9px] text-gl-text-secondary shrink-0 transition-transform active:scale-90"
          >
            <div className="w-[38px] h-[38px] md:w-12 md:h-12 rounded-full mx-auto mb-1 overflow-hidden gl-shimmer" />
            {cat}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-3">
        {catalogProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <TabBar tabs={buyerTabs} activeHref="/home" />
    </div>
  );
}
