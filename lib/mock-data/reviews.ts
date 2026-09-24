export type Review = {
  id: string;
  productId: string;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  date: string;
  verifiedPurchase: boolean;
};

export type RatingBreakdown = Record<1 | 2 | 3 | 4 | 5, number>;

// Breakdown totals are independent of the sample reviews below — same
// pattern as Jumia, which shows a full breakdown but only a handful of
// actual review snippets beneath it.
const ratingBreakdowns: Record<string, RatingBreakdown> = {
  p1: { 5: 240, 4: 58, 3: 9, 2: 3, 1: 2 },
  p2: { 5: 68, 4: 22, 3: 5, 2: 2, 1: 1 },
  p3: { 5: 82, 4: 11, 3: 2, 2: 1, 1: 0 },
  "gs-1": { 5: 40, 4: 15, 3: 4, 2: 1, 1: 1 },
  "gs-2": { 5: 61, 4: 20, 3: 5, 2: 2, 1: 1 },
  "gs-3": { 5: 70, 4: 20, 3: 5, 2: 2, 1: 1 },
  "gs-4": { 5: 42, 4: 14, 3: 3, 2: 1, 1: 1 },
};

export const reviews: Review[] = [
  {
    id: "r-p1-1",
    productId: "p1",
    authorName: "Efua A.",
    rating: 5,
    title: "Beautiful fabric",
    body: "The print is even more vivid in person. Fit true to size and the fabric feels premium, not thin like some ankara pieces I've bought before.",
    date: "24-08-2026",
    verifiedPurchase: true,
  },
  {
    id: "r-p1-2",
    productId: "p1",
    authorName: "Adjoa K.",
    rating: 4,
    title: "Lovely, slightly long",
    body: "Really nice dress, got many compliments. Runs a little long on me but nothing a tailor can't fix quickly.",
    date: "19-08-2026",
    verifiedPurchase: true,
  },
  {
    id: "r-p1-3",
    productId: "p1",
    authorName: "Yaa B.",
    rating: 5,
    title: "Exactly as pictured",
    body: "Delivery was fast and the dress matched the photos exactly. Will order from this seller again.",
    date: "12-08-2026",
    verifiedPurchase: true,
  },
  {
    id: "r-p2-1",
    productId: "p2",
    authorName: "Kwame O.",
    rating: 5,
    title: "Great sound for the price",
    body: "Bass is strong, connection is stable, battery easily lasts a full day of commuting.",
    date: "21-08-2026",
    verifiedPurchase: true,
  },
  {
    id: "r-p2-2",
    productId: "p2",
    authorName: "Nana Y.",
    rating: 3,
    title: "Decent, not amazing",
    body: "Sound is fine but call quality outdoors isn't as clear as I expected. Fine for music though.",
    date: "15-08-2026",
    verifiedPurchase: true,
  },
  {
    id: "r-gs-1-1",
    productId: "gs-1",
    authorName: "Kojo M.",
    rating: 5,
    title: "Charges fast",
    body: "Works perfectly with my phone, no overheating issues even after leaving it charging overnight.",
    date: "20-08-2026",
    verifiedPurchase: true,
  },
  {
    id: "r-gs-1-2",
    productId: "gs-1",
    authorName: "Abena T.",
    rating: 4,
    title: "Good, a bit bulky",
    body: "Does the job well, just slightly bigger than I expected for the desk.",
    date: "10-08-2026",
    verifiedPurchase: true,
  },
  {
    id: "r-gs-3-1",
    productId: "gs-3",
    authorName: "Kwabena F.",
    rating: 5,
    title: "Best earbuds I've owned",
    body: "The noise cancellation genuinely blocks out traffic noise. Battery life matches what's advertised too.",
    date: "22-08-2026",
    verifiedPurchase: true,
  },
  {
    id: "r-gs-3-2",
    productId: "gs-3",
    authorName: "Esi D.",
    rating: 5,
    title: "Worth the price",
    body: "Genuine product with a real warranty, that's what sold me on ordering from GrappStore directly.",
    date: "17-08-2026",
    verifiedPurchase: true,
  },
];

export function getReviewsByProductId(productId: string): Review[] {
  return reviews.filter((r) => r.productId === productId);
}

export function getRatingBreakdown(productId: string): RatingBreakdown | undefined {
  return ratingBreakdowns[productId];
}

// --- Seller storefront reviews (added for the /storefront Reviews tab) ---
// Deliberately a separate, simpler shape (ProductReview) from the
// GrappStore Review type above, not a replacement for it — the two power
// different UI (GrappStore's per-product rating-breakdown component vs.
// the seller dashboard's aggregated cross-product reviews tab). Kept in
// this same file since both are "reviews fixture data," but the export
// names are intentionally distinct to avoid ever colliding again.
export type ProductReview = {
  id: string;
  productId: string;
  reviewerName: string;
  rating: number;
  timeAgo: string;
  comment: string;
};

// A representative sample, not the full review count shown on the
// product/store cards (e.g. 312 is the real total; this is a curated set
// standing in for "top reviews," the way any real platform shows a
// subset rather than every review ever left).
export const productReviews: ProductReview[] = [
  {
    id: "spr1",
    productId: "p1",
    reviewerName: "Efua D.",
    rating: 5,
    timeAgo: "3 days ago",
    comment: "The print is even nicer in person and the fit was true to size. Got so many compliments wearing this to church.",
  },
  {
    id: "spr2",
    productId: "p1",
    reviewerName: "Nana Y.",
    rating: 5,
    timeAgo: "1 week ago",
    comment: "Fast delivery to Kumasi and the fabric quality is solid, not thin like some ankara pieces I've bought before.",
  },
  {
    id: "spr3",
    productId: "p1",
    reviewerName: "Abena K.",
    rating: 4,
    timeAgo: "2 weeks ago",
    comment: "Lovely dress. Runs a touch small in the shoulders so I'd size up if you're between sizes.",
  },
  {
    id: "spr4",
    productId: "p4",
    reviewerName: "Adjoa M.",
    rating: 5,
    timeAgo: "5 days ago",
    comment: "Comfortable enough to wear all day and the pockets are a nice touch. Will be ordering another color.",
  },
  {
    id: "spr5",
    productId: "p4",
    reviewerName: "Yaa B.",
    rating: 4,
    timeAgo: "3 weeks ago",
    comment: "Good quality jumpsuit, the waist fit is flattering. Delivery took a bit longer than the estimate though.",
  },
  {
    id: "spr6",
    productId: "p5",
    reviewerName: "Akosua T.",
    rating: 5,
    timeAgo: "1 week ago",
    comment: "Ordered this for a wedding and Ama got my measurements exactly right. The finishing is beautiful.",
  },
  {
    id: "spr7",
    productId: "p6",
    reviewerName: "Esi F.",
    rating: 4,
    timeAgo: "4 days ago",
    comment: "Good size and the fabric holds a wrap well without slipping. Would buy in another print.",
  },
];

// Aggregates a seller's reviews across all of their products. Newest-first
// isn't computable from "timeAgo" strings alone (fixture data, no real
// dates), so this returns them in listed order.
export function getReviewsForProducts(productIds: string[]): ProductReview[] {
  const idSet = new Set(productIds);
  return productReviews.filter((r) => idSet.has(r.productId));
}

