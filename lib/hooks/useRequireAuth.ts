"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";

export function useRequireAuth(requiredRole?: "shop" | "sell" | "grapplive_staff") {
  const router = useRouter();
  const isVerified = useAppStore((s) => s.isVerified);
  const roles = useAppStore((s) => s.roles);
  const activeRole = useAppStore((s) => s.activeRole);
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isVerified) {
      router.replace("/auth/signup");
      return;
    }
    if (roles.length === 0 || !activeRole) {
      router.replace("/auth/role-selector");
      return;
    }
    if (requiredRole) {
      // "shop"/"sell" are mutually exclusive modes — you check whether
      // that's the mode you're currently in. "grapplive_staff" is a
      // standing permission — you check whether you hold it at all,
      // independent of whatever shop/sell mode is currently active. This
      // is the fix: previously grapplive_staff was checked the same way
      // as a mode, so switching to "sell" silently revoked access to
      // grapplive_staff-gated pages even though the role was still held.
      const isAuthorized =
        requiredRole === "grapplive_staff" ? roles.includes(requiredRole) : activeRole === requiredRole;

      if (!isAuthorized) {
        router.replace(activeRole === "sell" ? "/dashboard" : "/home");
      }
    }
  }, [hasHydrated, isVerified, roles, activeRole, requiredRole, router]);

  return { isChecking: !hasHydrated };
}
