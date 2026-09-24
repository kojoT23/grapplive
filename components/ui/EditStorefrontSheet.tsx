"use client";

import { useState, useEffect, useRef } from "react";
import {
  IconX,
  IconBrandWhatsapp,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandFacebook,
  IconCheck,
  IconPhoto,
  IconTrash,
} from "@tabler/icons-react";
import { useStoreProfileStore } from "@/lib/store/useStoreProfileStore";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB — localStorage has a hard
// ~5-10MB origin-wide quota, so an uncapped upload could silently blow
// through it. Capping here rather than discovering that failure later.

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ImageUploadRow({
  label,
  preview,
  onChange,
  onRemove,
  aspectClass,
}: {
  label: string;
  preview: string | null;
  onChange: (file: File) => void;
  onRemove: () => void;
  aspectClass: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError("That image is over 2MB — please pick a smaller file.");
      return;
    }
    setError(null);
    onChange(file);
  };

  return (
    <div className="mb-4">
      <label className="block text-[10px] font-semibold text-gl-text-secondary mb-1.5">{label}</label>
      <div
        className={`w-full ${aspectClass} rounded-lg border border-dashed border-gl-border-strong relative overflow-hidden ${
          preview ? "" : "bg-gl-bg-muted"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gl-text-muted">
            <IconPhoto size={22} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <button
          onClick={() => inputRef.current?.click()}
          className="text-[10px] font-semibold text-gl-brand active:opacity-70 transition-opacity"
        >
          {preview ? "Replace" : "Upload"}
        </button>
        {preview && (
          <button
            onClick={onRemove}
            className="flex items-center gap-1 text-[10px] font-semibold text-gl-text-secondary active:opacity-70 transition-opacity"
          >
            <IconTrash size={11} />
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-[9px] text-gl-red mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}

export function EditStorefrontSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const about = useStoreProfileStore((s) => s.about);
  const socials = useStoreProfileStore((s) => s.socials);
  const logoDataUrl = useStoreProfileStore((s) => s.logoDataUrl);
  const bannerDataUrl = useStoreProfileStore((s) => s.bannerDataUrl);
  const updateAbout = useStoreProfileStore((s) => s.updateAbout);
  const updateSocials = useStoreProfileStore((s) => s.updateSocials);
  const updateLogo = useStoreProfileStore((s) => s.updateLogo);
  const updateBanner = useStoreProfileStore((s) => s.updateBanner);

  const [aboutInput, setAboutInput] = useState(about);
  const [whatsapp, setWhatsapp] = useState(socials.whatsappNumber ?? "");
  const [instagram, setInstagram] = useState(socials.instagramHandle ?? "");
  const [tiktok, setTiktok] = useState(socials.tiktokHandle ?? "");
  const [facebook, setFacebook] = useState(socials.facebookHandle ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(logoDataUrl);
  const [bannerPreview, setBannerPreview] = useState<string | null>(bannerDataUrl);
  const [saved, setSaved] = useState(false);

  // Reset the form to the current saved values each time the sheet opens,
  // so a closed-without-saving edit doesn't linger in local state.
  useEffect(() => {
    if (isOpen) {
      setAboutInput(about);
      setWhatsapp(socials.whatsappNumber ?? "");
      setInstagram(socials.instagramHandle ?? "");
      setTiktok(socials.tiktokHandle ?? "");
      setFacebook(socials.facebookHandle ?? "");
      setLogoPreview(logoDataUrl);
      setBannerPreview(bannerDataUrl);
      setSaved(false);
    }
  }, [isOpen, about, socials, logoDataUrl, bannerDataUrl]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateAbout(aboutInput.trim());
    updateSocials({
      whatsappNumber: whatsapp.trim() || undefined,
      instagramHandle: instagram.trim() || undefined,
      tiktokHandle: tiktok.trim() || undefined,
      facebookHandle: facebook.trim() || undefined,
    });
    updateLogo(logoPreview);
    updateBanner(bannerPreview);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl px-4 pt-5 pb-6 relative"
      >
        <div className="w-9 h-1 bg-gl-border-strong rounded-full mx-auto mb-3 absolute left-1/2 -translate-x-1/2 top-2" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-semibold text-gl-text">Edit storefront</span>
          <button onClick={onClose} aria-label="Close" className="active:opacity-60 transition-opacity">
            <IconX size={18} className="text-gl-text-secondary" />
          </button>
        </div>

        <ImageUploadRow
          label="Store logo"
          preview={logoPreview}
          aspectClass="h-[72px] w-[72px] rounded-full mx-auto"
          onChange={(file) => readFileAsDataUrl(file).then(setLogoPreview)}
          onRemove={() => setLogoPreview(null)}
        />

        <ImageUploadRow
          label="Store banner"
          preview={bannerPreview}
          aspectClass="h-[92px]"
          onChange={(file) => readFileAsDataUrl(file).then(setBannerPreview)}
          onRemove={() => setBannerPreview(null)}
        />

        <label className="block text-[10px] font-semibold text-gl-text-secondary mb-1.5">
          Store description
        </label>
        <textarea
          value={aboutInput}
          onChange={(e) => setAboutInput(e.target.value)}
          rows={3}
          placeholder="Tell buyers what your store sells and what makes it worth a follow."
          className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none focus:border-gl-brand mb-4 resize-none"
        />

        <div className="text-[10px] font-semibold text-gl-text-secondary mb-2">Socials</div>
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2 border border-gl-border-strong rounded-lg px-3 py-2">
            <IconBrandWhatsapp size={15} className="text-gl-green shrink-0" />
            <input
              type="tel"
              inputMode="numeric"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp number"
              className="flex-1 text-[12px] text-gl-text outline-none min-w-0"
            />
          </div>
          <div className="flex items-center gap-2 border border-gl-border-strong rounded-lg px-3 py-2">
            <IconBrandInstagram size={15} className="text-gl-brand shrink-0" />
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="Instagram handle"
              className="flex-1 text-[12px] text-gl-text outline-none min-w-0"
            />
          </div>
          <div className="flex items-center gap-2 border border-gl-border-strong rounded-lg px-3 py-2">
            <IconBrandTiktok size={15} className="text-gl-text shrink-0" />
            <input
              type="text"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="TikTok handle"
              className="flex-1 text-[12px] text-gl-text outline-none min-w-0"
            />
          </div>
          <div className="flex items-center gap-2 border border-gl-border-strong rounded-lg px-3 py-2">
            <IconBrandFacebook size={15} className="text-gl-navy shrink-0" />
            <input
              type="text"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="Facebook page (optional)"
              className="flex-1 text-[12px] text-gl-text outline-none min-w-0"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-gl-brand text-white text-[12px] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
        >
          {saved ? (
            <>
              <IconCheck size={14} />
              Saved
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </div>
  );
}

