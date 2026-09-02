"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { IconShoppingBag, IconBuildingStore, IconMotorbike, IconCircleCheck, IconCircle } from "@tabler/icons-react";

export default function RoleSelectorPage() {
  const router = useRouter();
  const roles = useAppStore((s) => s.roles);
  const activeRole = useAppStore((s) => s.activeRole);
  const addRole = useAppStore((s) => s.addRole);

  const handleContinue = () => {
    if (activeRole === "sell") router.push("/dashboard");
    else router.push("/home");
  };

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
