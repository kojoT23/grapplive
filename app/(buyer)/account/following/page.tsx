"use client";

import Link from "next/link";
import { IconArrowLeft, IconRosetteDiscountCheck } from "@tabler/icons-react";
import { useFollowingStore } from "@/lib/store/useFollowingStore";
import { getSellerById } from "@/lib/mock-data/sellers";

export default function FollowingPage() {
  const sellerIds = useFollowingStore((s) => s.sellerIds);

  const sellers = sellerIds
    .map((id) => getSellerById(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/account" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">Following</h1>
      </div>

      {sellers.length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center">
          <div className="text-[11px] text-gl-text-secondary mb-3">
            You&apos;re not following any sellers yet.
          </div>
          <Link
            href="/home"
            className="inline-block bg-gl-brand text-white text-[11px] font-semibold px-4 py-2 rounded-lg active:opacity-80 transition-opacity"
          >
            Discover sellers
          </Link>
        </div>
      ) : (
        <div className="px-3 md:px-5">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/seller/${seller.id}`}
              className="flex items-center gap-2.5 py-2.5 border-b border-gl-bg-muted last:border-b-0 transition-colors active:bg-gl-bg-muted"
            >
              <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden gl-shimmer" />
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-gl-text flex items-center gap-1">
                  {seller.name}
                  <IconRosetteDiscountCheck size={12} className="text-gl-brand" />
                </div>
                <div className="text-[9px] text-gl-text-secondary">
                  {seller.ordersCompleted} orders completed
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
