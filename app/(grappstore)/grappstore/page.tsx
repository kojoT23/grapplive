import Link from "next/link";
import { IconSearch, IconMessageCircle, IconShoppingCart } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { officialCatalogProducts } from "@/lib/mock-data/officialCatalog";

const categories: { label: string; slug: string }[] = [
  { label: "Fashion", slug: "fashion" },
  { label: "Phones", slug: "phones" },
  { label: "Home", slug: "home" },
  { label: "Beauty", slug: "beauty" },
];

export default function GrappStoreHomePage() {
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

      <div className="mx-3 md:mx-5 mb-4 bg-gl-brand rounded-lg px-3 py-3 flex items-center justify-between relative overflow-hidden">
        <div className="relative">
          <div className="text-[10px] font-semibold text-white/85 mb-0.5">FLASH DEALS</div>
          <div className="text-[14px] font-bold text-white">Up to 50% off</div>
          <div className="text-[10px] text-white/80">On top picks this week</div>
        </div>
      </div>

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

      <h3 className="px-3 md:px-5 pb-2 text-[13px] font-semibold text-gl-text">Discover &amp; shop</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-4">
        {officialCatalogProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
