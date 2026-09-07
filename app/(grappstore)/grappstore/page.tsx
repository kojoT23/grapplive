import Link from "next/link";
import { IconSearch, IconMessageCircle, IconShoppingCart, IconDots, IconPlayerPlayFilled, IconTruckDelivery, IconShieldCheck, IconRotateClockwise, IconPackage } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { BannerCarousel } from "@/components/grappstore/BannerCarousel";
import { DealsCountdown } from "@/components/grappstore/DealsCountdown";
import { officialCatalogProducts } from "@/lib/mock-data/officialCatalog";

const homeCategoryPreview: { label: string; slug: string }[] = [
  { label: "Women", slug: "women" },
  { label: "Men", slug: "men" },
  { label: "Children", slug: "children" },
  { label: "Accessories", slug: "accessories" },
];

const trustStats: { icon: typeof IconShieldCheck; value: string; label: string }[] = [
  { icon: IconPackage, value: "500+", label: "Genuine products" },
  { icon: IconTruckDelivery, value: "3–5 days", label: "Delivery" },
  { icon: IconShieldCheck, value: "12 mo", label: "Warranty" },
  { icon: IconRotateClockwise, value: "7 days", label: "Easy returns" },
];

export default function GrappStoreHomePage() {
  const dealProducts = officialCatalogProducts.filter((p) => p.discountPercent != null);
  const videoProducts = officialCatalogProducts.filter((p) => p.videoSlideIndex != null);

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

      <BannerCarousel />

      {/* Trust-stat band — given its own quiet section with breathing room,
          large numbers, a soft background and dividers, rather than being
          squeezed into a tight row where it read as a footnote. */}
      <div className="mx-3 md:mx-5 mb-5 bg-gl-bg-muted rounded-lg py-4 grid grid-cols-4 divide-x divide-gl-border">
        {trustStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center px-1">
              <Icon size={18} className="text-gl-brand mx-auto mb-1.5" />
              <div className="text-[15px] font-bold text-gl-text leading-tight tracking-tight">{stat.value}</div>
              <div className="text-[8.5px] text-gl-text-secondary leading-snug mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-3 md:px-5 pb-2">
        <h3 className="text-[13px] font-semibold text-gl-text">Shop by category</h3>
        <Link href="/grappstore/categories" className="text-[10px] font-semibold text-gl-brand active:opacity-70 transition-opacity">
          View all
        </Link>
      </div>
      <div className="flex gap-3.5 md:gap-5 px-3 md:px-5 pb-3.5 overflow-x-auto">
        {homeCategoryPreview.map((cat) => (
          <Link
            key={cat.slug}
            href={`/grappstore/category/${cat.slug}`}
            className="text-center text-[9px] text-gl-text-secondary shrink-0 transition-transform active:scale-90"
          >
            <div className="w-[46px] h-[46px] md:w-14 md:h-14 rounded-full mx-auto mb-1 overflow-hidden gl-shimmer" />
            {cat.label}
          </Link>
        ))}
        <Link
          href="/grappstore/categories"
          className="text-center text-[9px] text-gl-text-secondary shrink-0 transition-transform active:scale-90"
        >
          <div className="w-[46px] h-[46px] md:w-14 md:h-14 rounded-full mx-auto mb-1 bg-gl-bg-muted flex items-center justify-center">
            <IconDots size={18} className="text-gl-text-secondary" />
          </div>
          More
        </Link>
      </div>

      {videoProducts.length > 0 && (
        <>
          <h3 className="px-3 md:px-5 pb-2 text-[13px] font-semibold text-gl-text">Watch &amp; shop</h3>
          <div className="flex gap-2.5 px-3 md:px-5 pb-4 overflow-x-auto">
            {videoProducts.map((product) => (
              <Link
                key={product.id}
                href={`/grappstore/product/${product.id}`}
                className="w-[120px] shrink-0 transition-transform active:scale-95"
              >
                <div className="w-full h-[150px] rounded-lg gl-shimmer relative overflow-hidden mb-1.5">
                  <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded">
                    VIDEO
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-black/45 flex items-center justify-center">
                      <IconPlayerPlayFilled size={14} className="text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gl-text leading-snug line-clamp-2 mb-0.5">{product.name}</div>
                <div className="text-[10px] font-semibold text-gl-text">GHS {product.priceGHS}</div>
              </Link>
            ))}
          </div>
        </>
      )}

      {dealProducts.length > 0 && (
        <>
          <div className="flex items-center justify-between px-3 md:px-5 pb-2">
            <h3 className="text-[13px] font-semibold text-gl-text">Deals of the day</h3>
            <DealsCountdown />
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
