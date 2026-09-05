"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconTrash } from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useProductsStore } from "@/lib/store/useProductsStore";
import type { ProductStatus } from "@/lib/mock-data/products";

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "paused", label: "Paused" },
];

export default function EditProductPage() {
  const { isChecking } = useRequireAuth("sell");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const products = useProductsStore((s) => s.products);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const deleteProduct = useProductsStore((s) => s.deleteProduct);

  const product = products.find((p) => p.id === params.id);

  const [name, setName] = useState("");
  const [priceGHS, setPriceGHS] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState<ProductStatus>("draft");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPriceGHS(String(product.priceGHS));
      setStock(String(product.stock));
      setStatus(product.status);
    }
  }, [product]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-3 md:px-5 pt-3.5">
        <Link href="/products" className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-4 active:opacity-60 transition-opacity">
          <IconArrowLeft size={14} /> Back
        </Link>
        <div className="text-[12px] text-gl-text-secondary">Product not found.</div>
      </div>
    );
  }

  const isValid = name.trim().length > 0 && Number(priceGHS) > 0 && Number(stock) >= 0;

  const handleSave = () => {
    if (!isValid) return;
    setIsSaving(true);
    updateProduct(product.id, {
      name: name.trim(),
      priceGHS: Number(priceGHS),
      stock: Number(stock),
      status,
      isResellerItem: product.isResellerItem,
      resellerMarkupGHS: product.resellerMarkupGHS,
      draftNote: product.draftNote,
    });
    router.push("/products");
  };

  const handleDelete = () => {
    deleteProduct(product.id);
    router.push("/products");
  };

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="active:opacity-60 transition-opacity">
            <IconArrowLeft size={18} className="text-gl-text" />
          </button>
          <h1 className="text-[14px] font-semibold text-gl-text">Edit product</h1>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-gl-red active:opacity-60 transition-opacity"
          aria-label="Delete product"
        >
          <IconTrash size={18} />
        </button>
      </div>

      <label className="block mb-3">
        <span className="text-[10px] font-semibold text-gl-text-secondary mb-1 block">Product name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[12px] text-gl-text outline-none"
          />
        </label>
        <label className="flex-1 block">
          <span className="text-[10px] font-semibold text-gl-text-secondary mb-1 block">Stock</span>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[12px] text-gl-text outline-none"
          />
        </label>
      </div>

      <div className="mb-6">
        <span className="text-[10px] font-semibold text-gl-text-secondary mb-1.5 block">Status</span>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`text-[11px] font-semibold py-2 rounded-lg border transition-colors ${
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
        {isSaving ? "Saving…" : "Save changes"}
      </button>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full max-w-[480px] md:max-w-[360px] bg-white rounded-t-2xl md:rounded-2xl p-5 pb-6">
            <h2 className="text-[13px] font-semibold text-gl-text mb-1.5">Delete this product?</h2>
            <p className="text-[11px] text-gl-text-secondary mb-4">
              This can&apos;t be undone. Buyers will no longer be able to find this listing.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-gl-border-strong text-gl-text rounded-lg py-2.5 text-[12px] font-semibold active:bg-gl-bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-gl-red text-white rounded-lg py-2.5 text-[12px] font-semibold active:opacity-80 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
