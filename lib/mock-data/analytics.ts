export type BestSeller = {
  name: string;
  unitsSold: number;
};

export type RevenueSlice = {
  label: string;
  percent: number;
  colorVar: string; // CSS var name, reuses theme colors only
};

export const revenueGHS7Day = 1842;

export const revenueTrend = [45, 38, 42, 25, 30, 15, 8]; // relative points, low-to-high inverted for SVG y-coords

export const bestSellers: BestSeller[] = [
  { name: "Kente-print ankara dress", unitsSold: 18 },
  { name: "Bluetooth earbuds", unitsSold: 12 },
  { name: "Shea butter gift set", unitsSold: 9 },
];

export const revenueBreakdown: RevenueSlice[] = [
  { label: "Ankara dress", percent: 48, colorVar: "--color-gl-brand" },
  { label: "Earbuds", percent: 27, colorVar: "--color-gl-green" },
  { label: "Shea butter set", percent: 15, colorVar: "--color-gl-amber" },
  { label: "Others", percent: 10, colorVar: "--color-gl-navy" },
];

export const notMovingProducts = ["Beaded sandals", "Leather clutch bag"];

export const liveConversionPercent = 2.9;
export const directMomoConfirmationPercent = 88;
