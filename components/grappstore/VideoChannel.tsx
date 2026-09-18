"use client";

import { useState } from "react";
import { YouTubeEmbed } from "@/components/ui/YouTubeEmbed";
import {
  grappStoreChannelVideos,
  type ChannelVideoCategory,
} from "@/lib/mock-data/grappstoreChannelVideos";

const categoryConfig: Record<ChannelVideoCategory, { label: string; bg: string }> = {
  ad: { label: "Ad", bg: "var(--color-gl-brand)" },
  news: { label: "News", bg: "var(--color-gl-navy)" },
  instructional: { label: "How-to", bg: "var(--color-gl-green)" },
};

export function VideoChannel() {
  const [active, setActive] = useState(0);
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());

  if (grappStoreChannelVideos.length === 0) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  };

  return (
    <>
      <div
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide mx-3 md:mx-5 mb-2 rounded-xl"
      >
        {grappStoreChannelVideos.map((video) => {
          const cat = categoryConfig[video.category];
          const isPlaying = playingIds.has(video.id);
          return (
            <div
              key={video.id}
              className="w-full shrink-0 snap-center min-h-[180px] md:min-h-[220px] relative overflow-hidden bg-black shadow-sm shadow-black/10"
            >
              <YouTubeEmbed
                videoId={video.videoId}
                title={video.title}
                onPlay={() => setPlayingIds((prev) => new Set(prev).add(video.id))}
              />
              {!isPlaying && (
                <>
                  <span
                    className="absolute top-3 left-3 text-white text-[10px] font-semibold px-2 py-1 rounded-md pointer-events-none"
                    style={{ background: cat.bg }}
                  >
                    {cat.label}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-3.5 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none">
                    <p className="text-[15px] font-semibold text-white leading-snug max-w-[240px]">
                      {video.title}
                    </p>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {grappStoreChannelVideos.map((video, i) => (
          <div
            key={video.id}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-4 bg-gl-brand" : "w-1.5 bg-gl-border-strong"
            }`}
          />
        ))}
      </div>
    </>
  );
}
