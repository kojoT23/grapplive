"use client";

import { YouTubeEmbed } from "@/components/ui/YouTubeEmbed";
import {
  grappStoreChannelVideos,
  type ChannelVideoCategory,
} from "@/lib/mock-data/grappstoreChannelVideos";

// Category colors follow the existing brand semantics rather than being
// arbitrary: pink = promotional/action (an ad), navy = informational
// (news), green = helpful/trustworthy (a how-to).
const categoryConfig: Record<ChannelVideoCategory, { label: string; bg: string }> = {
  ad: { label: "Ad", bg: "var(--color-gl-brand)" },
  news: { label: "News", bg: "var(--color-gl-navy)" },
  instructional: { label: "How-to", bg: "var(--color-gl-green)" },
};

export function VideoChannel() {
  if (grappStoreChannelVideos.length === 0) return null;

  return (
    <div className="flex gap-2.5 px-3 md:px-5 pb-4 overflow-x-auto">
      {grappStoreChannelVideos.map((video) => {
        const cat = categoryConfig[video.category];
        return (
          <div key={video.id} className="w-[150px] shrink-0">
            <div className="w-full h-[95px] rounded-lg relative overflow-hidden mb-1.5">
              <YouTubeEmbed videoId={video.videoId} title={video.title} />
              {/* Rendered after YouTubeEmbed in the DOM so it paints above
                  both the button (pre-tap) and the iframe (post-tap)
                  without needing an explicit z-index. */}
              <span
                className="absolute top-1.5 right-1.5 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: cat.bg }}
              >
                {cat.label}
              </span>
            </div>
            <div className="text-[10px] text-gl-text leading-snug line-clamp-2">{video.title}</div>
          </div>
        );
      })}
    </div>
  );
}
