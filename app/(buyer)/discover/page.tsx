"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconHeart, IconHeartFilled, IconMessageCircle, IconShare } from "@tabler/icons-react";
import { getProductById } from "@/lib/mock-data/catalog";

// ROADMAP.md §9.1: this page is still a single static mockup story, not
// a real feed — that larger question (build it out vs. retire it) wasn't
// settled, so the page itself is untouched. What WAS a clear call: the
// "1.2k" / "86" engagement counts next to Heart/Comment were hardcoded,
// fabricated numbers, not tied to anything real — exactly the
// "unnecessary social gamification" AGENTS.md §35 warns against. Removed
// them rather than build out a fake-but-bigger version. Heart is now a
// genuinely honest per-viewer toggle (makes no claim about anyone else's
// behavior); Share reuses the real native-share pattern already built
// for the storefront; Comment has no onClick — there's no comment system
// to honestly back it, so it stays a plain icon rather than a dead
// button pretending otherwise.
export default function DiscoverPage() {
  const router = useRouter();
  const featuredProduct = getProductById("p2");
  const [liked, setLiked] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/discover`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "GRAPPlive", url });
      } catch {
        // User dismissed the native share sheet — not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard blocked — nothing more useful to do client-side.
    }
  };

  return (
    <div className="bg-[#1A1A18] min-h-dvh relative">
      <div className="absolute top-2.5 left-0 right-0 flex justify-center gap-5 text-[11px]">
        <span className="text-white/55">Following</span>
        <span className="text-white font-semibold border-b-[1.5px] border-white pb-0.5">
          Discover
        </span>
      </div>

      <div className="absolute left-3 bottom-[130px] max-w-[200px]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-[22px] h-[22px] rounded-full overflow-hidden gl-shimmer" />
          <span className="text-[11px] text-white font-semibold">Adjoa Beauty</span>
        </div>
        <div className="text-[10px] text-white/85">Restocked the shea butter set today ✨</div>
      </div>

      <div className="absolute right-3 bottom-[130px] flex flex-col gap-3.5 items-center">
        <button
          onClick={() => setLiked((v) => !v)}
          className="text-center active:scale-90 transition-transform"
        >
          {liked ? (
            <IconHeartFilled size={22} className="text-gl-brand mx-auto" />
          ) : (
            <IconHeart size={22} className="text-white mx-auto" />
          )}
        </button>
        <button className="text-center active:scale-90 transition-transform">
          <IconMessageCircle size={20} className="text-white mx-auto" />
        </button>
        <button onClick={handleShare} className="active:scale-90 transition-transform">
          <IconShare size={20} className="text-white" />
        </button>
      </div>

      {featuredProduct && (
        <button
          onClick={() => router.push(`/product/${featuredProduct.id}`)}
          className="absolute left-3 right-3 bottom-3 bg-white rounded-lg p-2 flex items-center gap-2 active:bg-gl-bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-md shrink-0 overflow-hidden gl-shimmer" />
          <div className="flex-1 text-left">
            <div className="text-[10px] text-gl-text">{featuredProduct.name}</div>
            <div className="text-[11px] font-semibold text-gl-text">
              GHS {featuredProduct.priceGHS}
            </div>
          </div>
          <span className="bg-gl-brand text-white text-[10px] font-semibold px-3 py-1.5 rounded-md">
            Shop
          </span>
        </button>
      )}

      <div className="h-dvh" />
    </div>
  );
}
