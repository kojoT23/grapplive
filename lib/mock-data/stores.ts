export type Store = {
  sellerId: string;
  about: string;
  deliveryAreas: string[];
  followerCount: number;
  rating: number;
  reviewCount: number;
  responseRate: string;
  memberSince: string;
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
  },
};

export function getStoreBySellerId(sellerId: string): Store | undefined {
  return stores[sellerId];
}
