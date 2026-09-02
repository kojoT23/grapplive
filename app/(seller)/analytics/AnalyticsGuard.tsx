"use client";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";

// Small client island: only the auth check needs to run in the browser
// (it reads localStorage-backed state). Everything else on this route
// is static, server-rendered content passed in as children.
export function AnalyticsGuard({ children }: { children: React.ReactNode }) {
  const { isChecking } = useRequireAuth("sell");

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
