"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconCircleCheck, IconAlertTriangle } from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";

type ProductStatus = "live" | "draft" | "paused";

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
];

const categoryOptions = ["women", "men", "children", "accessories", "beauty", "electronics"] as const;

export default function GrappStoreNewProductPage() {
  // Gated behind "grapplive_staff" — distinct from the marketplace's
  // "sell" role, same reasoning as fulfillment.tsx. Still a self-serve
  // prototype grant with no real admin-approval flow behind it.
  const { isChecking } = useRequireAuth("grapplive_staff");
  const router = useRouter();

  const [name, setName] = useState("");
  const [priceGHS, setPriceGHS] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("women");
  const [status, setStatus] = useState<ProductStatus>("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
    }, 500);
  };

  const handleAddAnother = () => {
    setName("");
    setPriceGHS("");
    setStock("");
    setCategory("women");
    setStatus("draft");
    setIsSaved(false);
  };

  if (isSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
        <IconCircleCheck size={44} className="text-gl-green mb-4" />
        <h1 className="text-[15px] font-semibold text-gl-text mb-1.5">Product saved</h1>
        <p className="text-[11px] text-gl-text-secondary mb-4 max-w-[260px]">
          This form is a mockup — GrappStore&apos;s catalog isn&apos;t backed by a real store yet,
          so this product won&apos;t appear on Home, Categories, or search.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-[220px]">
          <button
            onClick={handleAddAnother}
            className="bg-gl-brand text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg active:opacity-80 transition-opacity"
          >
            Add another product
          </button>
          <button
            onClick={() => router.push("/grappstore")}
            className="text-gl-text-secondary text-[12px] font-medium px-6 py-2.5 rounded-lg active:opacity-70 transition-opacity"
          >
            Back to GrappStore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={18} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">Add GrappStore product</h1>
      </div>

      <div className="flex items-start gap-2 bg-gl-amber-soft-bg border border-gl-amber/30 rounded-lg px-3 py-2.5 mb-4">
        <IconAlertTriangle size={14} className="text-gl-amber-soft-text shrink-0 mt-0.5" />
        <p className="text-[10px] text-gl-amber-soft-text leading-relaxed">
          Prototype only — products added here don&apos;t appear in the live catalog yet.
        </p>
      </div>

      <label className="block mb-3">
        <span className="text-[10px] font-semibold text-gl-text-secondary mb-1 block">Product name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Wireless charger"
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

      <label className="block mb-3">
        <span className="text-[10px] font-semibold text-gl-text-secondary mb-1 block">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as (typeof categoryOptions)[number])}
          className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[12px] text-gl-text outline-none bg-white capitalize"
        >
          {categoryOptions.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
      </label>

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
