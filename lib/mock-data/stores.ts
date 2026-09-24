export type StoreSocials = {
  whatsappNumber?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookHandle?: string;
};

export type Store = {
  sellerId: string;
  about: string;
  deliveryAreas: string[];
  followerCount: number;
  rating: number;
  reviewCount: number;
  responseRate: string;
  memberSince: string;
  socials?: StoreSocials;
};

export const stores: Record<string, Store> = {
  s1: {
    sellerId: "s1",
    about: "Contemporary ankara and kente-inspired fashion, made and shipped from Accra.",
    deliveryAreas: ["Accra", "Tema", "Kumasi"],
    followerCount: 1240,
    rating: 4.8,
    reviewCount: 312,
    responseRate: "96%",
    memberSince: "2022",
    // Same handles already on this seller's catalog products
    // (sellerSocials on each CatalogProduct) — pulled up to the store
    // level here as the real source of truth for store-wide editing.
    // The per-product duplication in catalog.ts is a known redundancy,
    // not fixed in this pass.
    socials: {
      whatsappNumber: "233241234567",
      instagramHandle: "amasfashionhouse",
      tiktokHandle: "amasfashionhouse",
    },
  },
  s2: {
    sellerId: "s2",
    about: "Genuine electronics and accessories, sourced and tested before listing.",
    deliveryAreas: ["Accra", "Kumasi"],
    followerCount: 640,
    rating: 4.6,
    reviewCount: 148,
    responseRate: "89%",
    memberSince: "2023",
    socials: {
      whatsappNumber: "233201234567",
      instagramHandle: "kojoelectronics",
      tiktokHandle: "kojoelectronics",
    },
  },
  s3: {
    sellerId: "s3",
    about: "Handmade shea butter and natural skincare from producers in Northern Ghana.",
    deliveryAreas: ["Accra", "Tamale"],
    followerCount: 410,
    rating: 4.9,
    reviewCount: 96,
    responseRate: "98%",
    memberSince: "2021",
    socials: {
      whatsappNumber: "233271234567",
    },
  },
};

export function getStoreBySellerId(sellerId: string): Store | undefined {
  return stores[sellerId];
}

