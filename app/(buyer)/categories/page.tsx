import Link from "next/link";
import { TabBar } from "@/components/ui/TabBar";
import { ProductCard } from "@/components/ui/ProductCard";
import { buyerTabs } from "@/lib/nav/buyer-tabs";
import { categories } from "@/lib/mock-data/home";
import { catalogProducts } from "@/lib/mock-data/catalog";

export default function CategoriesPage() {
  return (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">
        Categories
      </h1>

      <div className="grid grid-cols-2 gap-2 px-3 md:px-5 pb-4">
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/category/${cat.toLowerCase()}`}
            className="bg-gl-bg-muted rounded-lg p-4 text-center transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-full mx-auto mb-2 overflow-hidden gl-shimmer" />
            <div className="text-[11px] font-semibold text-gl-text">{cat}</div>
          </Link>
        ))}
      </div>

      <div className="h-px bg-gl-border mx-3 md:mx-5 mb-3" />

      <h2 className="px-3 md:px-5 pb-2 text-[12px] font-semibold text-gl-text">
        All products
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-3">
        {catalogProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <TabBar tabs={buyerTabs} activeHref="/categories" />
    </div>
  );
}
