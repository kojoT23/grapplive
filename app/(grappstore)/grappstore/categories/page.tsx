import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { categories } from "@/lib/mock-data/home";
import { officialCatalogProducts } from "@/lib/mock-data/officialCatalog";

export default function GrappStoreCategoriesPage() {
  return (
    <div>
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">
        Categories
      </h1>

      <div className="grid grid-cols-2 gap-2 px-3 md:px-5 pb-4">
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/grappstore/category/${cat.toLowerCase()}`}
            className="bg-gl-bg-muted rounded-lg p-4 text-center transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-full mx-auto mb-2 overflow-hidden gl-shimmer" />
            <div className="text-[11px] font-semibold text-gl-text">{cat}</div>
          </Link>
        ))}
      </div>

      <div className="h-px bg-gl-border mx-3 md:mx-5 mb-3" />

      <h2 className="px-3 md:px-5 pb-2 text-[12px] font-semibold text-gl-text">
        All GrappStore products
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-3">
        {officialCatalogProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
