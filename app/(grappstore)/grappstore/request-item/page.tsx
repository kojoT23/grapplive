"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconLink, IconCircleCheck } from "@tabler/icons-react";
import { useAuthGate } from "@/lib/hooks/useAuthGate";

function isLikelyUrl(value: string) {
  return /^https?:\/\/.+\..+/i.test(value.trim());
}

export default function RequestItemPage() {
  const router = useRouter();
  const requireAuth = useAuthGate();
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [linkTouched, setLinkTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const linkIsValid = isLikelyUrl(link);
  const canSubmit = linkIsValid && description.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      setLinkTouched(true);
      return;
    }
    requireAuth(() => {
      setIsSubmitting(true);
      // No backend yet — this is a genuinely client-side confirmation only,
      // same Phase 0 scope as the rest of the prototype. Nothing here is
      // persisted; a real submission would post to a real endpoint once
      // one exists (see docs/API_Contract_Draft.md).
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
      }, 500);
    });
  };

  const handleRequestAnother = () => {
    setLink("");
    setDescription("");
    setNotes("");
    setLinkTouched(false);
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
        <IconCircleCheck size={48} className="text-gl-green mb-4" />
        <h1 className="text-[15px] font-semibold text-gl-text mb-1.5">Request sent</h1>
        <p className="text-[11px] text-gl-text-secondary mb-6 max-w-[260px]">
          GRAPPlive will look into sourcing this and get back to you with pricing and availability.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-[220px]">
          <button
            onClick={handleRequestAnother}
            className="bg-gl-brand text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg active:opacity-80 transition-opacity"
          >
            Request another item
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
        <h1 className="text-[14px] font-semibold text-gl-text">Request an item</h1>
      </div>

      <p className="text-[11px] text-gl-text-secondary mb-5">
        Found something on another site or social media that isn&apos;t on GrappStore yet? Paste
        the link and we&apos;ll look into sourcing it for you.
      </p>

      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gl-text mb-1.5 block">Product link</label>
        <div
          className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 transition-colors ${
            linkTouched && !linkIsValid ? "border-gl-red" : "border-gl-border-strong"
          }`}
        >
          <IconLink size={14} className="text-gl-text-secondary shrink-0" />
          <input
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onBlur={() => setLinkTouched(true)}
            placeholder="https://…"
            className="flex-1 text-[12px] text-gl-text outline-none bg-transparent min-w-0"
          />
        </div>
        {linkTouched && !linkIsValid && (
          <p className="text-[10px] text-gl-red mt-1">Paste a full link starting with https://</p>
        )}
      </div>

      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gl-text mb-1.5 block">What is it?</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Black leather crossbody bag"
          className="w-full text-[12px] text-gl-text border border-gl-border-strong rounded-lg px-3 py-2.5 outline-none"
        />
      </div>

      <div className="mb-6">
        <label className="text-[11px] font-semibold text-gl-text mb-1.5 block">
          Size, color, or other preferences <span className="text-gl-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything specific we should know"
          rows={3}
          className="w-full text-[12px] text-gl-text border border-gl-border-strong rounded-lg px-3 py-2.5 outline-none resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-gl-brand disabled:opacity-60 text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-80 transition-opacity"
      >
        {isSubmitting ? "Sending…" : "Send request"}
      </button>
    </div>
  );
}
