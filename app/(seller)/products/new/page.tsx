"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCatalogStore } from "@/lib/store/useCatalogStore";
import type { ProductCategory, ProductStatus } from "@/lib/mock-data/catalog";

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
];

const categoryOptions: { value: ProductCategory; label: string }[] = [
  { value: "fashion", label: "Fashion" },
  { value: "phones", label: "Phones" },
  { value: "home", label: "Home" },
  { value: "beauty", label: "Beauty" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "children", label: "Children" },
  { value: "accessories", label: "Accessories" },
  { value: "electronics", label: "Electronics" },
];

export default function NewProductPage() {
  const { isChecking } = useRequireAuth("sell");
  const router = useRouter();
  const addProduct = useCatalogStore((s) => s.addProduct);

  const [name, setName] = useState("");
  const [priceGHS, setPriceGHS] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState<ProductStatus>("draft");
  const [category, setCategory] = useState<ProductCategory>("fashion");
  const [isSaving, setIsSaving] = useState(false);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const isValid = name.trim().length > 0 && Number(priceGHS) > 0 && Number(stock) >= 0;

  const handleSave = () => {
    if (!isValid) return;
    setIsSaving(true);
    const id = addProduct({
      name: name.trim(),
      priceGHS: Number(priceGHS),
      stockCount: Number(stock),
      status,
      category,
    });
    router.push(`/products/${id}`);
  };

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">Add product</h1>
      </div>

      <label className="block mb-3">
        <span className="text-[10px] font-semibold text-gl-text-secondary mb-1 block">Product name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kente-print ankara dress"
          className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[12px] text-gl-text outline-none"
        />
      </label>

      <div className="flex gap-2.5 mb-3">
        <label className="flex-1 block">
          <span className="text-[10px] font-semibold text-gl-text-secondary mb-1 block">Price (GHS)</span>
          <input
            type="number"
            value={priceGHS}
            onChange={(e) => setPriceGHS(e.target.value)}
            placeholder="0"
            className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[12px] text-gl-text outline-none"
          />
        </label>
        <label className="flex-1 block">
          <span className="text-[10px] font-semibold text-gl-text-secondary mb-1 block">Stock</span>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="0"
            className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[12px] text-gl-text outline-none"
          />
        </label>
      </div>

      <div className="mb-6">
        <span className="text-[10px] font-semibold text-gl-text-secondary mb-1.5 block">Status</span>
        <div className="flex gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`flex-1 text-[11px] font-semibold py-2 rounded-lg border transition-colors ${
                status === opt.value
                  ? "bg-gl-brand text-white border-gl-brand"
                  : "bg-white text-gl-text-secondary border-gl-border-strong"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block mb-6">
        <span className="text-[10px] font-semibold text-gl-text-secondary mb-1 block">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
          className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[12px] text-gl-text outline-none bg-white"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={handleSave}
        disabled={!isValid || isSaving}
        className="w-full bg-gl-brand disabled:opacity-40 text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-80 transition-opacity"
      >
        {isSaving ? "Saving…" : "Save product"}
      </button>
    </div>
  );
}
