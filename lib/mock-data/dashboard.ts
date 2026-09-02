export type DashboardSummary = {
  businessName: string;
  ordersNeedingAttention: number;
  attentionDetail: string;
  todaysSalesGHS: number;
  ordersToday: number;
};

export type LastLiveSession = {
  viewers: number;
  sales: number;
  conversionPercent: number;
};

export const dashboardSummary: DashboardSummary = {
  businessName: "Ama's Fashion House",
  ordersNeedingAttention: 2,
  attentionDetail: "1 awaiting confirmation, 1 ready to pack",
  todaysSalesGHS: 234,
  ordersToday: 5,
};

export const lastLiveSession: LastLiveSession = {
  viewers: 486,
  sales: 14,
  conversionPercent: 2.9,
};
