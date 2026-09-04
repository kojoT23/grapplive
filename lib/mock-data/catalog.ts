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
  deliveryEstimate?: string;
  returnPolicyDays?: number;
  warranty?: string;
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
    deliveryEstimate: "2–5 days",
    returnPolicyDays: 7,
    warranty: "6 months",
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
