"use client";

import { useState } from "react";
import Link from "next/link";
import { IconSearch, IconPlus } from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { sellerTabs } from "@/lib/nav/seller-tabs";
import type { SellerProduct, ProductStatus } from "@/lib/mock-data/products";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

const statusStyles: Record<ProductStatus, { label: string; bg: string; text: string }> = {
  live: { label: "Live", bg: "bg-gl-green-soft-bg", text: "text-gl-green-soft-text" },
  draft: { label: "Draft", bg: "bg-gl-amber-soft-bg", text: "text-gl-amber-soft-text" },
  out_of_stock: { label: "Out of stock", bg: "bg-gl-bg-muted", text: "text-gl-text-secondary" },
  paused: { label: "Paused", bg: "bg-gl-bg-muted", text: "text-gl-text-secondary" },
};

function ProductRow({ product }: { product: SellerProduct }) {
  const style = statusStyles[product.status];

  const detailLine = product.draftNote
    ? product.draftNote
    : product.isResellerItem && product.resellerMarkupGHS
    ? `${formatGHS(product.priceGHS)} · Reseller · GHS ${product.resellerMarkupGHS} markup`
    : `${formatGHS(product.priceGHS)} · ${product.stock} in stock`;

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex items-center gap-2 py-1.5 border-b border-gl-bg-muted last:border-b-0 transition-colors active:bg-gl-bg-muted"
    >
      <div className="w-[34px] h-[34px] bg-gl-bg-placeholder rounded-md shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-gl-text truncate">{product.name}</div>
        <div className="text-[9px] text-gl-text-secondary truncate">{detailLine}</div>
      </div>
      <span className={`text-[8px] px-1.5 py-0.5 rounded ${style.bg} ${style.text} shrink-0`}>
        {style.label}
      </span>
    </Link>
  );
}

export default function ProductsPage() {
  const { isChecking } = useRequireAuth("sell");
  const products = useProductsStore((s) => s.products);
  const [query, setQuery] = useState("");

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="pb-16">
      <div className="flex items-center justify-between px-3 md:px-5 pt-3.5 pb-2">
        <h1 className="text-[14px] font-semibold text-gl-text">Products</h1>
        <Link
          href="/products/new"
          className="bg-gl-brand text-white rounded-md px-2.5 py-1.5 text-[10px] font-semibold flex items-center gap-1 transition-opacity active:opacity-80"
        >
          <IconPlus size={12} />
          Add
        </Link>
      </div>

      <div className="mx-3 md:mx-5 mb-2 bg-gl-bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-1">
        <IconSearch size={12} className="text-gl-text-secondary shrink-0" />
        <input
          type="text"
          placeholder="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent text-[10px] text-gl-text placeholder:text-gl-text-secondary outline-none flex-1"
        />
      </div>

      <div className="px-3 md:px-5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-gl-text-secondary">
            {query ? `No products match "${query}"` : "No products yet."}
          </div>
        ) : (
          filtered.map((product) => <ProductRow key={product.id} product={product} />)
        )}
      </div>

      <TabBar tabs={sellerTabs} activeHref="/products" />
    </div>
  );
}
