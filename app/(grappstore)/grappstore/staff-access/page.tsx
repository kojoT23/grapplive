"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconShieldCheck, IconLock } from "@tabler/icons-react";
import { useAppStore } from "@/lib/store/useAppStore";

// NOT real security — this string ships in the client-side JS bundle, so
// anyone who opens dev tools or reads the bundle can find it in seconds.
// It exists only to stop casual/accidental access (someone stumbling
// onto this URL and clicking a button with no friction at all), not to
// stop anyone who's actually trying to get in. The real fix is server-
// side auth with an actual admin-approval flow, which doesn't exist yet
// because there's no backend. Deliberately not gated behind
// useRequireAuth either — this page's whole job is to grant the
// grapplive_staff role, so it needs to be reachable before someone has
// it. There's no real admin-approval flow yet; this whole page is a
// self-serve prototype stopgap for testing.
const STAFF_PASSPHRASE = "grapplive-staff-2026";

export default function GrappStoreStaffAccessPage() {
  const router = useRouter();
  const grantRole = useAppStore((s) => s.grantRole);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGrant = () => {
    if (passphrase.trim() !== STAFF_PASSPHRASE) {
      setError("Incorrect passphrase.");
      return;
    }
    setError(null);
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
      <p className="text-[11px] text-gl-text-secondary mb-1.5 max-w-[280px]">
        Prototype only — this grants your current session access to internal ops screens like
        Fulfillment and Add Product.
      </p>
      <p className="text-[10px] text-gl-text-muted mb-5 max-w-[280px]">
        The passphrase below is a speed bump, not real security — no real admin-approval flow
        exists yet.
      </p>

      <div className="w-full max-w-[260px] mb-1.5">
        <div className="flex items-center gap-2 border border-gl-border-strong rounded-lg px-3 py-2.5">
          <IconLock size={14} className="text-gl-text-secondary shrink-0" />
          <input
            type="password"
            value={passphrase}
            onChange={(e) => {
              setPassphrase(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Passphrase"
            className="flex-1 text-[12px] text-gl-text outline-none min-w-0"
          />
        </div>
      </div>
      {error && <p className="text-[10px] text-gl-red mb-3">{error}</p>}

      <button
        onClick={handleGrant}
        className="bg-gl-brand text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg active:opacity-80 transition-opacity mt-3"
      >
        Become GrappStore staff
      </button>
    </div>
  );
}

