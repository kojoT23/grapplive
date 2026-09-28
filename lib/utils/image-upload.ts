// Shared by anywhere in this app that lets someone upload an image and
// persist it client-side (store logo/banner in EditStorefrontSheet,
// product photos in the seller product forms). There's no real backend,
// so every uploaded image ends up as a base64 data URL inside a
// zustand/persist blob in localStorage.
//
// localStorage caps out around 5-10MB PER ORIGIN, TOTAL, shared across
// every persisted store on the site (cart, wishlist, orders, catalog...).
// A raw, uncompressed phone photo is routinely 3-8MB — a few of those
// would alone exceed the whole origin's quota and break every other
// store sharing it, not just image upload. compressImageFile exists to
// make that failure mode rare in practice by resizing + re-encoding
// before anything gets stored; MAX_IMAGE_BYTES below is a sanity check
// on the *raw upload*, not a guarantee of the final stored size.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // reject only pathologically large raw uploads — compression handles the rest

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Resizes to at most maxDimension on the long edge and re-encodes as JPEG
// at `quality`. A typical 3-8MB phone photo becomes roughly 100-300KB —
// call this instead of readFileAsDataUrl wherever an image will be
// persisted, not just previewed. Falls back to the uncompressed data URL
// if canvas/image decoding isn't available (very old browsers, some
// non-standard image formats) rather than failing the upload outright.
export async function compressImageFile(
  file: File,
  options?: { maxDimension?: number; quality?: number }
): Promise<string> {
  const maxDimension = options?.maxDimension ?? 900;
  const quality = options?.quality ?? 0.72;

  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Could not decode image"));
        el.src = objectUrl;
      });

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", quality);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    // Compression failed for some reason (unsupported format, decode
    // error) — fall back to the uncompressed upload rather than blocking
    // it entirely. Rare, and still bounded by MAX_IMAGE_BYTES.
    return readFileAsDataUrl(file);
  }
}
