"use client";

import { IconUserCheck, IconUserPlus } from "@tabler/icons-react";
import { useFollowingStore } from "@/lib/store/useFollowingStore";
import { useAuthGate } from "@/lib/hooks/useAuthGate";

export function SellerFollowButton({ sellerId }: { sellerId: string }) {
  const isFollowing = useFollowingStore((s) => s.isFollowing(sellerId));
  const toggle = useFollowingStore((s) => s.toggle);
  const requireAuth = useAuthGate();

  const handleClick = () => requireAuth(() => toggle(sellerId));

  return (
    <button
      onClick={handleClick}
      className={`w-full rounded-lg py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors active:opacity-80 ${
        isFollowing
          ? "bg-gl-bg-muted text-gl-text-secondary"
          : "bg-gl-brand text-white"
      }`}
    >
      {isFollowing ? (
        <>
          <IconUserCheck size={14} /> Following
        </>
      ) : (
        <>
          <IconUserPlus size={14} /> Follow
        </>
      )}
    </button>
  );
}
