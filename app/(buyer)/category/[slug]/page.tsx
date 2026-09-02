import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { getProductsByCategory } from "@/lib/mock-data/catalog";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = getProductsByCategory(slug);

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/categories" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">{capitalize(slug)}</h1>
      </div>

      {products.length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center text-[11px] text-gl-text-secondary">
          No products in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
