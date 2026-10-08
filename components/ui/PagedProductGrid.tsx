"use client";

import { ProductCard } from "@/components/ui/ProductCard";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { usePagedList } from "@/lib/hooks/usePagedList";
import type { CatalogProduct } from "@/lib/mock-data/catalog";

export function PagedProductGrid({
  products,
  pageSize,
}: {
  products: CatalogProduct[];
  pageSize?: number;
}) {
  const { visible, hasMore, loadMore } = usePagedList(products, pageSize);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {hasMore && <LoadMoreButton onClick={loadMore} />}
    </>
  );
}
