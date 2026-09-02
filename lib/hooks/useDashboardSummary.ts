"use client";

import { useEffect, useState } from "react";
import { dashboardSummary, lastLiveSession, type DashboardSummary, type LastLiveSession } from "@/lib/mock-data/dashboard";

type DashboardData = {
  summary: DashboardSummary;
  lastLive: LastLiveSession;
};

/**
 * Stands in for a real API call (e.g. GET /api/seller/dashboard).
 * Swap the body of this hook for a real fetch/React Query call later —
 * every component using it stays unchanged.
 */
export function useDashboardSummary() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // simulate network latency so loading states are actually exercised
    const timer = setTimeout(() => {
      setData({ summary: dashboardSummary, lastLive: lastLiveSession });
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}
