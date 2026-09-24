export type ProductStatus = "live" | "draft" | "out_of_stock" | "paused";

export type SellerProduct = {
  id: string;
  name: string;
  priceGHS: number;
  stock: number;
  status: ProductStatus;
  isResellerItem?: boolean;
  resellerMarkupGHS?: number;
  draftNote?: string; // e.g. "Needs 2 more photos"
  unitsSold?: number; // fixture metric for Best Selling ranking — no real sales pipeline yet
  originalPriceGHS?: number; // set alongside discountPercent to show a strike-through price
  discountPercent?: number;
  ratingAvg?: number; // fixture — no real reviews pipeline feeding this yet
  reviewCount?: number;
};

export const initialProducts: SellerProduct[] = [
  {
    id: "p1",
    name: "Kente-print ankara dress",
    priceGHS: 89,
    stock: 14,
    status: "live",
    unitsSold: 34,
    originalPriceGHS: 105,
    discountPercent: 15,
    ratingAvg: 4.7,
    reviewCount: 89,
  },
  {
    id: "p2",
    name: "Bluetooth earbuds",
    priceGHS: 145,
    stock: 8,
    status: "live",
    isResellerItem: true,
    resellerMarkupGHS: 20,
    unitsSold: 51,
    ratingAvg: 4.8,
    reviewCount: 56,
  },
  {
    id: "p3",
    name: "Beaded sandals",
    priceGHS: 55,
    stock: 0,
    status: "draft",
    draftNote: "Needs 2 more photos",
  },
];

