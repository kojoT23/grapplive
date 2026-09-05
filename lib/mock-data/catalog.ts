export type ProductOrigin = "third_party_seller" | "verified_producer" | "grapp_import";
export type ProductCategory = "fashion" | "phones" | "home" | "beauty";

export type SellerSocials = {
  whatsappNumber?: string;
  signalNumber?: string;
  telegramHandle?: string;
  tiktokHandle?: string;
  instagramHandle?: string;
};

export type VerifiedTier = "verified_producer" | "trusted_import" | "top_seller";
export type ProductSourceType = "marketplace" | "grapplive";

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductColorVariant = {
  label: string;
  hex: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  priceGHS: number;
  originalPriceGHS?: number;
  discountPercent?: number;
  sellerId: string;
  sellerName: string;
  sellerOrdersCompleted: number;
  sellerReplyTime: string;
  origin: ProductOrigin;
  category: ProductCategory;
  sellerSocials: SellerSocials;
  verifiedTier: VerifiedTier | null;
  sourceType: ProductSourceType;
  rating?: number;
  reviewCount?: number;
  imageCount?: number;
  videoSlideIndex?: number;
  deliveryEstimate?: string;
  returnPolicyDays?: number;
  warranty?: string;
  description?: string;
  specs?: ProductSpec[];
  boxContents?: string[];
  stockCount?: number;
  colorVariants?: ProductColorVariant[];
};

export const catalogProducts: CatalogProduct[] = [
  {
    id: "p1",
    name: "Kente-print ankara dress",
    priceGHS: 89,
    originalPriceGHS: 127,
    discountPercent: 30,
    sellerId: "s1",
    sellerName: "Ama's Fashion House",
    sellerOrdersCompleted: 312,
    sellerReplyTime: "~10 min",
    origin: "third_party_seller",
    category: "fashion",
    sellerSocials: {
      whatsappNumber: "233241234567",
      signalNumber: "233241234567",
      telegramHandle: "amasfashionhouse",
      tiktokHandle: "amasfashionhouse",
      instagramHandle: "amasfashionhouse",
    },
    verifiedTier: "top_seller",
    sourceType: "marketplace",
    rating: 4.8,
    reviewCount: 312,
    imageCount: 4,
    deliveryEstimate: "3–6 days",
    returnPolicyDays: 7,
    description:
      "A bold ankara dress with a modern kente-inspired print, tailored for an easy, flattering fit. Made from breathable cotton-blend fabric, perfect for church, parties, or everyday wear.\n\nThe fabric is pre-washed and colorfast, so the print stays vivid wash after wash. Fully lined at the bodice for comfort and shape.",
    specs: [
      { label: "Material", value: "Cotton-ankara blend" },
      { label: "Fit", value: "Regular, true to size" },
      { label: "Care", value: "Hand wash cold, line dry" },
      { label: "Available sizes", value: "S – XL" },
    ],
    boxContents: ["1 × Ankara dress"],
    stockCount: 14,
    colorVariants: [
      { label: "Red kente", hex: "#B8283C" },
      { label: "Gold kente", hex: "#D4A93A" },
      { label: "Green kente", hex: "#3B6B4F" },
    ],
  },
  {
    id: "p2",
    name: "Bluetooth earbuds",
    priceGHS: 145,
    originalPriceGHS: 170,
    discountPercent: 15,
    sellerId: "s2",
    sellerName: "Kojo Electronics",
    sellerOrdersCompleted: 148,
    sellerReplyTime: "~25 min",
    origin: "third_party_seller",
    category: "phones",
    sellerSocials: {
      whatsappNumber: "233201234567",
      signalNumber: "233201234567",
      telegramHandle: "kojoelectronics",
      tiktokHandle: "kojoelectronics",
      instagramHandle: "kojoelectronics",
    },
    verifiedTier: null,
    sourceType: "marketplace",
    rating: 4.5,
    reviewCount: 98,
    imageCount: 4,
    videoSlideIndex: 1,
    deliveryEstimate: "2–5 days",
    returnPolicyDays: 7,
    warranty: "6 months",
    description:
      "True wireless earbuds with active noise cancellation and up to 24 hours of total playtime with the charging case. Bluetooth 5.3 for a stable connection and low-latency gaming mode.\n\nTouch controls for play/pause, skip track, and answer calls. IPX5 sweat and splash resistant, built for workouts and daily commutes.",
    specs: [
      { label: "Bluetooth version", value: "5.3" },
      { label: "Battery life", value: "6 hrs (buds) / 24 hrs (with case)" },
      { label: "Water resistance", value: "IPX5" },
      { label: "Charging port", value: "USB-C" },
    ],
    boxContents: ["2 × Earbuds", "1 × Charging case", "1 × USB-C cable", "2 × Extra ear tip sizes"],
    stockCount: 27,
    colorVariants: [
      { label: "Black", hex: "#1A1A1A" },
      { label: "White", hex: "#F5F5F5" },
    ],
  },
  {
    id: "p3",
    name: "Shea butter gift set",
    priceGHS: 65,
    sellerId: "s3",
    sellerName: "Adjoa Beauty",
    sellerOrdersCompleted: 96,
    sellerReplyTime: "~15 min",
    origin: "verified_producer",
    category: "beauty",
    sellerSocials: {
      whatsappNumber: "233271234567",
    },
    verifiedTier: "verified_producer",
    sourceType: "marketplace",
    rating: 4.9,
    reviewCount: 96,
    imageCount: 4,
    deliveryEstimate: "3–6 days",
    returnPolicyDays: 7,
    description:
      "100% raw, unrefined shea butter sourced directly from producers in Northern Ghana, hand-blended with natural oils for deep moisturizing. No additives, no fragrance — just the real thing.\n\nComes as a 3-piece gift set: body butter, lip balm, and hair butter, all in reusable tins.",
    specs: [
      { label: "Ingredients", value: "100% raw shea butter, natural oils" },
      { label: "Set includes", value: "Body butter, lip balm, hair butter" },
      { label: "Shelf life", value: "12 months from production" },
    ],
    boxContents: ["1 × Body butter tin", "1 × Lip balm tin", "1 × Hair butter tin"],
    stockCount: 8,
  },
];

export function getProductById(id: string): CatalogProduct | undefined {
  return catalogProducts.find((p) => p.id === id);
}

export function getGrappVerifiedProducts(): CatalogProduct[] {
  return catalogProducts.filter((p) => p.verifiedTier !== null);
}

export function getProductsByCategory(category: string): CatalogProduct[] {
  return catalogProducts.filter((p) => p.category === category);
}
