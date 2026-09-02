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

      <button
        onClick={() => router.back()}
        className="absolute top-2.5 right-3 w-[22px] h-[22px] rounded-full bg-white/15 flex items-center justify-center active:bg-white/25 transition-colors"
      >
        <IconX size={12} className="text-white" />
      </button>

      <div className="absolute right-3 bottom-[150px] flex flex-col gap-3 items-center">
        <button className="active:scale-90 transition-transform">
          <IconHeart size={20} className="text-gl-brand" />
        </button>
        <button className="active:scale-90 transition-transform">
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

      <div className="h-[360px]" />
    </div>
  );
}
