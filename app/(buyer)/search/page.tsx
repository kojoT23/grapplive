"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconSearch, IconX } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { catalogProducts } from "@/lib/mock-data/catalog";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results =
    query.trim().length === 0
      ? []
      : catalogProducts.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sellerName.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-2.5">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity shrink-0">
          <IconArrowLeft size={18} className="text-gl-text" />
        </button>
        <div className="flex-1 bg-gl-bg-muted rounded-lg px-2.5 py-2 flex items-center gap-1.5">
          <IconSearch size={14} className="text-gl-text-secondary shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search GRAPPlive"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-[12px] text-gl-text placeholder:text-gl-text-secondary outline-none flex-1 min-w-0"
          />
          {query && (
            <button onClick={() => setQuery("")} className="shrink-0 active:opacity-60 transition-opacity">
              <IconX size={14} className="text-gl-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {query.trim().length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center text-[11px] text-gl-text-secondary">
          Search for products or sellers
        </div>
      ) : results.length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center text-[11px] text-gl-text-secondary">
          No results for &quot;{query}&quot;
        </div>
      ) : (
        <>
          <div className="px-3 md:px-5 pb-2 text-[10px] text-gl-text-secondary">
            {results.length} result{results.length === 1 ? "" : "s"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
