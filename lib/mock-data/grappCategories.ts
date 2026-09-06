import type { ProductCategory } from "./catalog";

// Category tiles are a navigation facade into filtered product lists —
// not products themselves. Counts here match the reference mockup
// exactly; they are display labels, not live counts of the sample
// catalog (which only has a handful of seed products).
export type GrappCategoryTile = {
  slug: ProductCategory;
  label: string;
  productCount: number;
  bgColor: string;
  imageSrc: string;
};

export const grappCategoryTiles: GrappCategoryTile[] = [
  { slug: "women", label: "Women", productCount: 1253, bgColor: "#F3D2DE", imageSrc: "/categories/category-women.jpg" },
  { slug: "men", label: "Men", productCount: 984, bgColor: "#CFDAE8", imageSrc: "/categories/category-men.jpg" },
  { slug: "children", label: "Children", productCount: 842, bgColor: "#F6E7B8", imageSrc: "/categories/category-children.jpg" },
  { slug: "accessories", label: "Accessories", productCount: 625, bgColor: "#E8DCC7", imageSrc: "/categories/category-accessories.jpg" },
  { slug: "beauty", label: "Beauty", productCount: 532, bgColor: "#F0DDE6", imageSrc: "/categories/category-beauty.jpg" },
  { slug: "electronics", label: "Electronics", productCount: 742, bgColor: "#2B2E36", imageSrc: "/categories/category-electronics.jpg" },
];
