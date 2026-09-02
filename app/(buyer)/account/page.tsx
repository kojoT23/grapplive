"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconUserCircle,
  IconQrcode,
  IconGift,
  IconShoppingBag,
  IconHeart,
  IconMapPin,
  IconTicket,
  IconUserPlus,
  IconHelpCircle,
  IconBuildingStore,
  IconLogout,
  IconChevronRight,
  IconX,
  IconPencil,
} from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { buyerTabs } from "@/lib/nav/buyer-tabs";
import { useAppStore } from "@/lib/store/useAppStore";
import { profileStats, recentlyViewedProductIds } from "@/lib/mock-data/profile";
import { getProductById } from "@/lib/mock-data/catalog";

function StatItem({ value, label, href }: { value: number; label: string; href: string }) {
  return (
    <Link href={href} className="flex-1 text-center active:opacity-60 transition-opacity">
      <div className="text-[15px] font-semibold text-gl-text">{value}</div>
      <div className="text-[9px] text-gl-text-secondary">{label}</div>
    </Link>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <div className="w-11 h-11 rounded-full bg-gl-bg-muted flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[9px] text-gl-text-secondary text-center leading-tight w-14">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
    >
      {content}
    </button>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const phone = useAppStore((s) => s.phone);
  const roles = useAppStore((s) => s.roles);
  const activeRole = useAppStore((s) => s.activeRole);
  const setActiveRole = useAppStore((s) => s.setActiveRole);
  const addRole = useAppStore((s) => s.addRole);
  const logout = useAppStore((s) => s.logout);
  const [showQrModal, setShowQrModal] = useState(false);

  const hasSellRole = roles.includes("sell");

  const handleSwitchToSell = () => {
    setActiveRole("sell");
    router.push("/dashboard");
  };

  const handleBecomeSeller = () => {
    addRole("sell");
    router.push("/dashboard");
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/signup");
  };

  const recentlyViewed = recentlyViewedProductIds
    .map((id) => getProductById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="pb-16">
      <div className="bg-[#0B0B0B] px-3 md:px-5 pt-5 pb-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-gl-brand/20" />
        <div className="relative flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0 border-2 border-white/20">
            <IconUserCircle size={34} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold text-white truncate">
                {phone || "Guest"}
              </span>
              <IconPencil size={12} className="text-white/50 shrink-0" />
            </div>
            <div className="text-[10px] text-white/60">
              {activeRole === "sell" ? "Selling on GRAPPlive" : "Shopping on GRAPPlive"}
            </div>
          </div>
          <button
            onClick={() => setShowQrModal(true)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 active:bg-white/20 transition-colors"
          >
            <IconQrcode size={16} className="text-white" />
          </button>
        </div>

        <div className="relative flex mt-4 border-t border-white/10 pt-3">
          <StatItem value={profileStats.ordersCount} label="Orders" href="/account/orders" />
          <StatItem value={profileStats.wishlistCount} label="Wishlist" href="/account/wishlist" />
          <StatItem
            value={profileStats.followingSellersCount}
            label="Following"
            href="/account/following"
          />
        </div>
      </div>

      <Link
        href="/account/rewards"
        className="mx-3 md:mx-5 -mt-3 relative bg-gradient-to-r from-gl-brand to-[#993556] rounded-xl p-3.5 flex items-center justify-between active:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2.5">
          <IconGift size={20} className="text-white" />
          <div>
            <div className="text-[12px] font-semibold text-white">
              {profileStats.points} points
            </div>
            <div className="text-[9px] text-white/80">Redeem on your next order</div>
          </div>
        </div>
        <IconChevronRight size={16} className="text-white/80" />
      </Link>

      <div className="grid grid-cols-4 gap-y-4 px-3 md:px-5 pt-5 pb-4">
        <QuickAction
          icon={<IconShoppingBag size={18} className="text-gl-text-secondary" />}
          label="My Orders"
          href="/account/orders"
        />
        <QuickAction
          icon={<IconHeart size={18} className="text-gl-text-secondary" />}
          label="Wishlist"
        />
        <QuickAction
          icon={<IconMapPin size={18} className="text-gl-text-secondary" />}
          label="Addresses"
        />
        <QuickAction
          icon={<IconTicket size={18} className="text-gl-text-secondary" />}
          label="Coupons"
        />
        <QuickAction
          icon={<IconUserPlus size={18} className="text-gl-text-secondary" />}
          label="Invite Friends"
        />
        <QuickAction
          icon={<IconHelpCircle size={18} className="text-gl-text-secondary" />}
          label="Help Center"
        />
        {hasSellRole ? (
          <QuickAction
            icon={<IconBuildingStore size={18} className="text-gl-brand" />}
            label="Switch to Selling"
            onClick={handleSwitchToSell}
          />
        ) : (
          <QuickAction
            icon={<IconBuildingStore size={18} className="text-gl-brand" />}
            label="Start Selling"
            onClick={handleBecomeSeller}
          />
        )}
        <QuickAction
          icon={<IconLogout size={18} className="text-gl-red" />}
          label="Log Out"
          onClick={handleLogout}
        />
      </div>

      {recentlyViewed.length > 0 && (
        <>
          <div className="h-px bg-gl-border mx-3 md:mx-5 mb-3" />
          <h3 className="px-3 md:px-5 pb-2 text-[12px] font-semibold text-gl-text">
            Recently viewed
          </h3>
          <div className="flex gap-2 px-3 md:px-5 pb-3 overflow-x-auto">
            {recentlyViewed.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="w-24 shrink-0 transition-transform active:scale-95"
              >
                <div className="h-20 rounded-lg mb-1 overflow-hidden gl-shimmer" />
                <div className="text-[9px] text-gl-text truncate">{product.name}</div>
                <div className="text-[10px] font-semibold text-gl-text">
                  GHS {product.priceGHS}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="w-full max-w-[300px] bg-white rounded-2xl p-5 text-center relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 active:opacity-60 transition-opacity"
            >
              <IconX size={16} className="text-gl-text-secondary" />
            </button>
            <div className="w-16 h-16 rounded-full bg-gl-bg-muted mx-auto mb-2 flex items-center justify-center">
              <IconUserCircle size={30} className="text-gl-text-secondary" />
            </div>
            <div className="text-[13px] font-semibold text-gl-text mb-3">{phone || "Guest"}</div>
            <div className="w-40 h-40 bg-gl-bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
              <IconQrcode size={64} className="text-gl-text-muted" />
            </div>
            <p className="text-[9px] text-gl-text-secondary">
              Scan to view this profile on GRAPPlive
            </p>
          </div>
        </div>
      )}

      <TabBar tabs={buyerTabs} activeHref="/account" />
    </div>
  );
}
