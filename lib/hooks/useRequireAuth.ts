"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";

export function useRequireAuth(requiredRole?: "shop" | "sell") {
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
    if (requiredRole && activeRole !== requiredRole) {
      router.replace(activeRole === "sell" ? "/dashboard" : "/home");
    }
  }, [hasHydrated, isVerified, roles, activeRole, requiredRole, router]);

  return { isChecking: !hasHydrated };
}
