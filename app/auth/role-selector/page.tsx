"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { useSellerIdentityStore } from "@/lib/store/useSellerIdentityStore";
import { IconShoppingBag, IconBuildingStore, IconMotorbike, IconCircleCheck, IconCircle } from "@tabler/icons-react";

export default function RoleSelectorPage() {
  const router = useRouter();
  const phone = useAppStore((s) => s.phone);
  const roles = useAppStore((s) => s.roles);
  const activeRole = useAppStore((s) => s.activeRole);
  const addRole = useAppStore((s) => s.addRole);

  const identitiesByPhone = useSellerIdentityStore((s) => s.identitiesByPhone);
  const getOrCreateSellerId = useSellerIdentityStore((s) => s.getOrCreateSellerId);

  // ROADMAP.md §1.1: picking "Sell" used to just set activeRole and route
  // straight to /dashboard — no seller identity ever got created, so
  // every seller page fell back to a hardcoded id regardless of who
  // signed up. A phone that's never picked "Sell" before needs one piece
  // of information a plain phone number can't supply: a shop name. This
  // prompt only appears for a genuinely new seller identity — anyone
  // whose phone already has one (including the demo seller) skips
  // straight through exactly as before.
  const [showShopNamePrompt, setShowShopNamePrompt] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopNameError, setShopNameError] = useState("");

  const isNewSeller = activeRole === "sell" && !identitiesByPhone[phone];

  const goToDashboard = (name: string) => {
    getOrCreateSellerId(phone, name);
    router.push("/dashboard");
  };

  const handleContinue = () => {
    if (activeRole === "sell") {
      if (isNewSeller) {
        setShowShopNamePrompt(true);
        return;
      }
      goToDashboard("");
      return;
    }
    router.push("/home");
  };

  const handleCreateShop = () => {
    if (!shopName.trim()) {
      setShopNameError("Enter a name for your shop");
      return;
    }
    goToDashboard(shopName);
  };

  if (showShopNamePrompt) {
    return (
      <div className="px-5 pt-7 pb-5">
        <h2 className="text-[14px] font-semibold text-gl-text mb-1">What&apos;s your shop called?</h2>
        <p className="text-[10px] text-gl-text-secondary mb-4">
          This is the name buyers will see on your storefront — you can change it anytime.
        </p>
        <input
          type="text"
          value={shopName}
          onChange={(e) => {
            setShopName(e.target.value);
            setShopNameError("");
          }}
          placeholder="e.g. Adjoa's Fashion House"
          className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[13px] text-gl-text outline-none mb-1 transition-colors focus:border-gl-brand"
          autoFocus
        />
        {shopNameError && <p className="text-[10px] text-gl-red mb-3">{shopNameError}</p>}
        {!shopNameError && <div className="mb-4" />}
        <button
          onClick={handleCreateShop}
          className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold mb-2.5 transition-transform active:scale-[0.98] active:opacity-90"
        >
          Create my shop
        </button>
        <button
          onClick={() => setShowShopNamePrompt(false)}
          className="w-full text-gl-text-secondary text-[11px] font-medium py-1 active:opacity-60 transition-opacity"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-5">
      <h2 className="text-[14px] font-semibold text-gl-text mb-1">
        How do you want to use GRAPPlive?
      </h2>
      <p className="text-[10px] text-gl-text-secondary mb-4">
        You can add another role anytime from your profile
      </p>

      <button
        onClick={() => addRole("shop")}
        className={`w-full border rounded-lg p-3 flex items-center gap-3 mb-2.5 transition-all active:scale-[0.98] ${
          activeRole === "shop" ? "border-gl-brand border-[1.5px]" : "border-gl-border"
        }`}
      >
        <div className="w-10 h-10 rounded-lg bg-gl-brand-soft-bg flex items-center justify-center shrink-0">
          <IconShoppingBag size={20} className="text-gl-brand-soft-text" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-[12px] font-semibold text-gl-text">Shop</div>
          <div className="text-[10px] text-gl-text-secondary">Browse, watch live sessions, buy</div>
        </div>
        {activeRole === "shop" ? (
          <IconCircleCheck size={18} className="text-gl-brand" />
        ) : (
          <IconCircle size={18} className="text-gl-bg-placeholder" />
        )}
      </button>

      <button
        onClick={() => addRole("sell")}
        className={`w-full border rounded-lg p-3 flex items-center gap-3 mb-2.5 transition-all active:scale-[0.98] ${
          activeRole === "sell" ? "border-gl-brand border-[1.5px]" : "border-gl-border"
        }`}
      >
        <div className="w-10 h-10 rounded-lg bg-gl-bg-muted flex items-center justify-center shrink-0">
          <IconBuildingStore size={20} className="text-gl-text-secondary" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-[12px] font-semibold text-gl-text">Sell</div>
          <div className="text-[10px] text-gl-text-secondary">List products, go live, get a dashboard</div>
        </div>
        {activeRole === "sell" ? (
          <IconCircleCheck size={18} className="text-gl-brand" />
        ) : (
          <IconCircle size={18} className="text-gl-bg-placeholder" />
        )}
      </button>

      <div className="w-full border border-gl-border rounded-lg p-3 flex items-center gap-3 mb-5 opacity-55">
        <div className="w-10 h-10 rounded-lg bg-gl-bg-muted flex items-center justify-center shrink-0">
          <IconMotorbike size={20} className="text-gl-text-secondary" />
        </div>
        <div className="flex-1">
          <div className="text-[12px] font-semibold text-gl-text">Deliver</div>
          <div className="text-[10px] text-gl-text-secondary">Coming soon</div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!activeRole}
        className="w-full bg-gl-brand disabled:opacity-40 text-white rounded-lg py-2.5 text-[13px] font-semibold transition-transform active:scale-[0.98] active:opacity-90"
      >
        Continue
      </button>
    </div>
  );
}
