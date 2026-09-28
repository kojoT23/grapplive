"use client";

import { useRef, useState } from "react";
import { IconPhoto, IconPlus, IconTrash } from "@tabler/icons-react";
import { MAX_IMAGE_BYTES, compressImageFile } from "@/lib/utils/image-upload";

const MAX_PHOTOS = 4;

function Slot({
  preview,
  isThumbnail,
  onUpload,
  onRemove,
}: {
  preview: string | null;
  isThumbnail: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError("That photo is too large — try a smaller one.");
      return;
    }
    setError(null);
    onUpload(file);
  };

  return (
    <div className="w-[74px] shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-[74px] h-[74px] rounded-lg border border-dashed border-gl-border-strong relative overflow-hidden bg-gl-bg-muted flex items-center justify-center"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Product photo" className="w-full h-full object-cover" />
        ) : (
          <IconPlus size={16} className="text-gl-text-muted" />
        )}
        {isThumbnail && preview && (
          <span className="absolute top-1 left-1 bg-white/95 text-gl-text text-[7px] font-semibold px-1 py-0.5 rounded">
            Cover
          </span>
        )}
      </button>
      {preview && (
        <button
          type="button"
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-0.5 text-[9px] text-gl-text-secondary mt-1 active:opacity-60 transition-opacity"
        >
          <IconTrash size={10} />
          Remove
        </button>
      )}
      {error && <p className="text-[8px] text-gl-red mt-0.5 leading-tight">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}

// Up to MAX_PHOTOS base64 data URLs. The first image is the card
// thumbnail everywhere this product shows up (ProductCard, search
// results, etc.) — same "first = cover" convention as most marketplace
// apps, made explicit with the "Cover" label on that slot.
export function ProductImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const handleUpload = async (index: number, file: File) => {
    const dataUrl = await compressImageFile(file);
    const next = [...images];
    next[index] = dataUrl;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const slotCount = Math.min(images.length + 1, MAX_PHOTOS);

  return (
    <div className="mb-3">
      <span className="text-[10px] font-semibold text-gl-text-secondary mb-1.5 flex items-center gap-1.5 block">
        <IconPhoto size={12} />
        Photos ({images.length}/{MAX_PHOTOS})
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: slotCount }, (_, i) => (
          <Slot
            key={i}
            preview={images[i] ?? null}
            isThumbnail={i === 0}
            onUpload={(file) => handleUpload(i, file)}
            onRemove={() => handleRemove(i)}
          />
        ))}
      </div>
    </div>
  );
}
