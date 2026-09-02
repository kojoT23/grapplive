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
};

export const initialProducts: SellerProduct[] = [
  {
    id: "p1",
    name: "Kente-print ankara dress",
    priceGHS: 89,
    stock: 14,
    status: "live",
  },
  {
    id: "p2",
    name: "Bluetooth earbuds",
    priceGHS: 145,
    stock: 8,
    status: "live",
    isResellerItem: true,
    resellerMarkupGHS: 20,
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
