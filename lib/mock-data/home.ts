export type Product = {
  id: string;
  name: string;
  price: number;
  discountPercent?: number;
};

export type Seller = {
  id: string;
  name: string;
};

export type LiveSession = {
  id: string;
  sellerId: string;
};

export const featuredProducts: Product[] = [
  { id: "p1", name: "Kente-print ankara dress", price: 89, discountPercent: 30 },
  { id: "p2", name: "Bluetooth earbuds", price: 145, discountPercent: 15 },
];

export const spotlightSellers: Seller[] = [
  { id: "s1", name: "Ama's Fashion" },
  { id: "s2", name: "Kojo Electronics" },
  { id: "s3", name: "Adjoa Beauty" },
];

export const liveSessions: LiveSession[] = [
  { id: "l1", sellerId: "s1" },
  { id: "l2", sellerId: "s3" },
];

export const categories = ["Fashion", "Phones", "Home", "Beauty"] as const;
