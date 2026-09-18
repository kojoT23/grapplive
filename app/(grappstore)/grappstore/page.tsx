import Image from "next/image";
import Link from "next/link";
import { IconSearch, IconMessageCircle, IconShoppingCart, IconDots, IconTruckDelivery, IconShieldCheck, IconRotateClockwise, IconPackage } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { BannerCarousel } from "@/components/grappstore/BannerCarousel";
import { DealsCountdown } from "@/components/grappstore/DealsCountdown";
import { ShopTheLook } from "@/components/grappstore/ShopTheLook";
import { VideoChannel } from "@/components/grappstore/VideoChannel";
import { WatchAndShopCard } from "@/components/grappstore/WatchAndShopCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PeekScrollRow } from "@/components/ui/PeekScrollRow";
import { officialCatalogProducts } from "@/lib/mock-data/officialCatalog";
import { grappStoreLooks, getLookProducts } from "@/lib/mock-data/grappstoreLooks";
import { productIllustrationByProductId } from "@/lib/mock-data/productIllustrations";
import { productVideoClipByProductId } from "@/lib/mock-data/productVideoClips";

const homeCategoryPreview: { label: string; slug: string; image: string }[] = [
  { label: "Women", slug: "women", image: "/categories/category-women.jpg" },
  { label: "Men", slug: "men", image: "/categories/category-men.jpg" },
  { label: "Children", slug: "children", image: "/categories/category-children.jpg" },
  { label: "Accessories", slug: "accessories", image: "/categories/category-accessories.jpg" },
];

const trustStats: { icon: typeof IconShieldCheck; value: string; label: string }[] = [
  { icon: IconPackage, value: "500+", label: "Genuine products" },
  { icon: IconTruckDelivery, value: "3–5 days", label: "Delivery" },
  { icon: IconShieldCheck, value: "12 mo", label: "Warranty" },
  { icon: IconRotateClockwise, value: "7 days", label: "Easy returns" },
];

const soldTodayByProductId: Record<string, number> = {
  "gs-1": 8,
  "gs-2": 15,
  "gs-3": 21,
  "gs-4": 6,
  "gs-5": 4,
  "gs-6": 11,
  "gs-7": 9,
};

export default function GrappStoreHomePage() {
  const dealProducts = officialCatalogProducts.filter((p) => p.discountPercent != null);
  const dealProductIds = new Set(dealProducts.map((p) => p.id));

  const featuredLook = grappStoreLooks[0];
  const featuredLookProductIds = new Set(
    featuredLook ? getLookProducts(featuredLook).map((p) => p.id) : []
  );

  const discoverProducts = officialCatalogProducts.filter(
    (p) => !dealProductIds.has(p.id) && !featuredLookProductIds.has(p.id)
  );
  const videoProducts = officialCatalogProducts.filter((p) => p.videoSlideIndex != null);

  return (
    <div>
      <div className="flex items-center gap-2 px-3 md:px-5 pt-2.5 pb-2">
        <div className="flex items-center gap-1.5 text-[15px] font-semibold text-gl-brand">
          Grappstore
        </div>
        <div className="flex-1" />
        <Link href="/grappstore/inbox" aria-label="Messages" className="transition-all duration-150 ease-out hover:scale-110 hover:text-gl-brand active:opacity-60">
          <IconMessageCircle size={20} className="text-gl-text-secondary" />
        </Link>
        <Link href="/grappstore/cart" aria-label="Cart" className="transition-all duration-150 ease-out hover:scale-110 hover:text-gl-brand active:opacity-60">
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

      <div className="mx-3 md:mx-5 mb-5 bg-gl-bg-muted rounded-lg py-4 grid grid-cols-4 divide-x divide-gl-border">
        {trustStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center px-1">
              <Icon size={18} className="text-gl-green mx-auto mb-1.5" />
              <div className="text-[15px] font-bold text-gl-text leading-tight tracking-tight">{stat.value}</div>
              <div className="text-[8.5px] text-gl-text-secondary leading-snug mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <RevealOnScroll>
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
              className="group text-center text-[9px] text-gl-text-secondary shrink-0 transition-transform active:scale-90"
            >
              <div className="w-[46px] h-[46px] md:w-14 md:h-14 rounded-full mx-auto mb-1 overflow-hidden relative ring-2 ring-transparent transition-all duration-200 ease-out group-hover:ring-gl-brand group-hover:scale-105">
                <Image src={cat.image} alt={cat.label} fill sizes="56px" className="object-cover" />
              </div>
              {cat.label}
            </Link>
          ))}
          <Link
            href="/grappstore/categories"
            className="group text-center text-[9px] text-gl-text-secondary shrink-0 transition-transform active:scale-90"
          >
            <div className="w-[46px] h-[46px] md:w-14 md:h-14 rounded-full mx-auto mb-1 bg-gl-bg-muted flex items-center justify-center transition-all duration-200 ease-out group-hover:scale-105 group-hover:bg-gl-border">
              <IconDots size={18} className="text-gl-text-secondary" />
            </div>
            More
          </Link>
        </div>
      </RevealOnScroll>

      {videoProducts.length > 0 && (
        <RevealOnScroll>
          <h3 className="px-3 md:px-5 pb-2 text-[13px] font-semibold text-gl-text">Watch &amp; shop</h3>
          <PeekScrollRow>
            {videoProducts.map((product) => (
              <WatchAndShopCard
                key={product.id}
                product={product}
                videoUrl={productVideoClipByProductId[product.id]}
                posterSrc={productIllustrationByProductId[product.id]}
              />
            ))}
          </PeekScrollRow>
        </RevealOnScroll>
      )}

      <RevealOnScroll>
        <h3 className="px-3 md:px-5 pb-2 text-[13px] font-semibold text-gl-text">GrappStore TV</h3>
        <VideoChannel />
      </RevealOnScroll>

      {dealProducts.length > 0 && (
        <RevealOnScroll>
          <div id="deals-of-the-day" className="flex items-center justify-between px-3 md:px-5 pb-2 scroll-mt-4">
            <h3 className="text-[13px] font-semibold text-gl-text">Deals of the day</h3>
            <DealsCountdown />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-4">
            {dealProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                soldToday={soldTodayByProductId[product.id]}
                imageSrc={productIllustrationByProductId[product.id]}
                flipOnHover
              />
            ))}
          </div>
        </RevealOnScroll>
      )}

      {featuredLook && (
        <RevealOnScroll>
          <h3 className="px-3 md:px-5 pb-2 text-[13px] font-semibold text-gl-text">Shop the look</h3>
          <ShopTheLook look={featuredLook} />
        </RevealOnScroll>
      )}

      {discoverProducts.length > 0 && (
        <RevealOnScroll>
          <h3 className="px-3 md:px-5 pb-2 text-[13px] font-semibold text-gl-text">Discover &amp; shop</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-4">
            {discoverProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                soldToday={soldTodayByProductId[product.id]}
                imageSrc={productIllustrationByProductId[product.id]}
              />
            ))}
          </div>
        </RevealOnScroll>
      )}
    </div>
  );
}
