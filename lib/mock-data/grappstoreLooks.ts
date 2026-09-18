import type { CatalogProduct } from "./catalog";
import { officialCatalogProducts } from "./officialCatalog";

export type GrappStoreLook = {
  id: string;
  title: string;
  blurb: string;
  // References existing officialCatalog product ids — no new product data,
  // just a curated grouping on top of what already exists.
  productIds: string[];
};

export const grappStoreLooks: GrappStoreLook[] = [
  {
    id: "weekend-market-run",
    title: "Weekend market run",
    blurb: "Dress, carry, and glow — styled together",
    productIds: ["gs-2", "gs-7", "gs-4"],
  },
];

export function getLookProducts(look: GrappStoreLook): CatalogProduct[] {
  return look.productIds
    .map((id) => officialCatalogProducts.find((p) => p.id === id))
    .filter((p): p is CatalogProduct => Boolean(p));
}

export function getLookTotal(look: GrappStoreLook): number {
  return getLookProducts(look).reduce((sum, p) => sum + p.priceGHS, 0);
}
