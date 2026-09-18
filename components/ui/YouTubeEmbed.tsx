"use client";

import { useState } from "react";
import Image from "next/image";
import { IconPlayerPlayFilled } from "@tabler/icons-react";

export function YouTubeEmbed({
  videoId,
  posterSrc,
  title,
  onPlay,
}: {
  videoId: string;
  posterSrc?: string;
  title: string;
  onPlay?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  if (isPlaying) {
    return (
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      onClick={handlePlay}
      className="absolute inset-0 w-full h-full"
      aria-label={`Play video: ${title}`}
    >
      {posterSrc ? (
        <Image src={posterSrc} alt={title} fill sizes="480px" className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 gl-shimmer" />
      )}
      <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded">
        VIDEO
      </span>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-black/45 flex items-center justify-center">
          <IconPlayerPlayFilled size={18} className="text-white ml-0.5" />
        </div>
      </div>
    </button>
  );
}
