"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconCamera, IconPhoto, IconX } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { officialCatalogProducts } from "@/lib/mock-data/officialCatalog";
import { productIllustrationByProductId } from "@/lib/mock-data/productIllustrations";

export default function PhotoSearchPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof officialCatalogProducts | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResults(null);
    setIsSearching(true);

    // No real visual-search backend exists yet — Phase 0 is frontend-only,
    // mock data throughout (AGENTS.md). This simulates a search and
    // returns real catalog products as "matches," the same honest-mockup
    // pattern the rest of the prototype already uses (checkout, live
    // broadcast), rather than pretending real image recognition exists.
    setTimeout(() => {
      setIsSearching(false);
      setResults(officialCatalogProducts);
    }, 1400);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResults(null);
    setIsSearching(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={18} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">Photo search</h1>
      </div>

      {!previewUrl && (
        <div className="px-3 md:px-5 pt-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gl-brand-soft-bg flex items-center justify-center mb-4">
            <IconCamera size={28} className="text-gl-brand" />
          </div>
          <p className="text-[12px] text-gl-text-secondary mb-6 max-w-[240px]">
            Snap a photo or choose one from your gallery — we&apos;ll find similar items on
            GrappStore.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-[260px] bg-gl-brand text-white text-[12px] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 active:opacity-80 transition-opacity mb-2.5"
          >
            <IconCamera size={16} />
            Take a photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-[260px] border border-gl-border-strong text-gl-text text-[12px] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 active:bg-gl-bg-muted transition-colors"
          >
            <IconPhoto size={16} />
            Choose from gallery
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="px-3 md:px-5">
          <div className="relative w-full h-[220px] rounded-lg overflow-hidden bg-gl-bg-muted mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Search photo" className="w-full h-full object-cover" />
            <button
              onClick={handleReset}
              aria-label="Remove photo"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center active:bg-black/70 transition-colors"
            >
              <IconX size={16} className="text-white" />
            </button>
          </div>

          {isSearching && (
            <div className="flex flex-col items-center py-8">
              <div className="w-8 h-8 border-2 border-gl-brand border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[11px] text-gl-text-secondary">Searching for similar items…</p>
            </div>
          )}

          {results && (
            <>
              <p className="text-[12px] font-semibold text-gl-text mb-3">
                {results.length} similar {results.length === 1 ? "item" : "items"} found
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4">
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    imageSrc={productIllustrationByProductId[product.id]}
                  />
                ))}
              </div>
              <button
                onClick={handleReset}
                className="w-full border border-gl-border-strong text-gl-text text-[12px] font-semibold py-2.5 rounded-lg active:bg-gl-bg-muted transition-colors"
              >
                Try another photo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
