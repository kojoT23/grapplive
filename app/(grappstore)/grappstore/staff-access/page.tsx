"use client";

import { useRouter } from "next/navigation";
import { IconShieldCheck } from "@tabler/icons-react";
import { useAppStore } from "@/lib/store/useAppStore";

// Deliberately NOT gated behind useRequireAuth — this page's whole job is
// to grant the grapplive_staff role, so it needs to be reachable before
// someone has it. There's no real admin-approval flow yet; this is a
// self-serve prototype stopgap for testing.
export default function GrappStoreStaffAccessPage() {
  const router = useRouter();
  const grantRole = useAppStore((s) => s.grantRole);

  const handleGrant = () => {
    // grantRole adds the permission WITHOUT touching activeRole — unlike
    // addRole, which switches your active mode. grapplive_staff is a
    // standing permission, not a mode, so granting it shouldn't silently
    // switch you out of whatever shop/sell mode you were already in.
    grantRole("grapplive_staff");
    router.push("/grappstore/fulfillment");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <IconShieldCheck size={44} className="text-gl-brand mb-4" />
      <h1 className="text-[15px] font-semibold text-gl-text mb-1.5">GrappStore staff access</h1>
      <p className="text-[11px] text-gl-text-secondary mb-6 max-w-[260px]">
        Prototype only — no real admin-approval flow exists yet. This grants your current session
        access to internal ops screens like Fulfillment and Add Product.
      </p>
      <button
        onClick={handleGrant}
        className="bg-gl-brand text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg active:opacity-80 transition-opacity"
      >
        Become GrappStore staff
      </button>
    </div>
  );
}
