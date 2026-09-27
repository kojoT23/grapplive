// Shared by anywhere in this app that lets someone upload an image and
// persist it client-side (store logo/banner in EditStorefrontSheet,
// product photos in the seller product forms). There's no real backend,
// so every uploaded image ends up as a base64 data URL inside a
// zustand/persist blob in localStorage.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB — localStorage has a
// hard ~5-10MB origin-wide quota, so uncapped uploads could silently blow
// through it. Capping here rather than discovering that failure later.

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
