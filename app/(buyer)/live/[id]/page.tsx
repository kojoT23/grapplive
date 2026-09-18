"use client";

import { useRouter } from "next/navigation";
import { IconEye, IconX, IconHeart, IconShare } from "@tabler/icons-react";
import { getProductById } from "@/lib/mock-data/catalog";

type ChatMessage = { name: string; color: string; text: string };

const mockChat: ChatMessage[] = [
  { name: "Kwame", color: "#EF9F27", text: "is this true size?" },
  { name: "Abena", color: "#5DCAA5", text: "just bought mine 😍" },
  { name: "Yaw", color: "#85B7EB", text: "price for the blue one?" },
];

export default function LiveBroadcastPage() {
  const router = useRouter();
  const pinnedProduct = getProductById("p1");

  return (
    <div className="bg-[#1A1A18] min-h-dvh relative">
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
        <div className="bg-gl-red text-white text-[9px] font-semibold px-1.5 py-0.5 rounded gl-live-pulse">
          LIVE
        </div>
        <div className="bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
          <IconEye size={10} /> 486
        </div>
      </div>

      {/* Bumped from 22px to 36px — this is the button someone reaches for
          when they urgently want to back out of something, and it was the
          smallest tap target on the whole app. */}
      <button
        onClick={() => router.back()}
        aria-label="Close live broadcast"
        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25 transition-colors"
      >
        <IconX size={16} className="text-white" />
      </button>

      {/* These were bare icons with no defined tap zone at all — just the
          glyph itself. On a live overlay where people tap fast to react,
          that's the most fragile interaction on the page. Wrapped in a
          real ~40px hit area, same treatment as the close button, plus
          aria-labels to match every other icon-only button in the app. */}
      <div className="absolute right-3 bottom-[150px] flex flex-col gap-2 items-center">
        <button
          aria-label="Like"
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 active:bg-white/20 transition-all"
        >
          <IconHeart size={20} className="text-gl-brand" />
        </button>
        <button
          aria-label="Share"
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 active:bg-white/20 transition-all"
        >
          <IconShare size={18} className="text-white" />
        </button>
      </div>

      <div className="absolute left-3 bottom-[150px] w-[190px] text-[10px] text-white space-y-1">
        {mockChat.map((msg, i) => (
          <div key={i} className="opacity-90">
            <b style={{ color: msg.color }}>{msg.name}:</b> {msg.text}
          </div>
        ))}
      </div>

      {pinnedProduct && (
        <button
          onClick={() => router.push(`/product/${pinnedProduct.id}`)}
          className="absolute left-3 right-3 bottom-3 bg-white rounded-lg p-2 flex items-center gap-2 active:bg-gl-bg-muted transition-colors"
        >
          <div className="w-[34px] h-[34px] rounded-md shrink-0 overflow-hidden gl-shimmer" />
          <div className="flex-1 text-left">
            <div className="text-[10px] text-gl-text">{pinnedProduct.name}</div>
            <div className="text-[11px] font-semibold text-gl-text">
              GHS {pinnedProduct.priceGHS}
            </div>
          </div>
          <span className="bg-gl-brand text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-md">
            Buy now
          </span>
        </button>
      )}

      {/* Left as-is — unclear whether this reserved space below the fold is
          intentional (room for a future comments feed) or leftover.
          Flagging rather than removing; confirm before touching. */}
      <div className="h-[360px]" />
    </div>
  );
}
