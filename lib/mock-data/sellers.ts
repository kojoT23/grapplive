import { catalogProducts, type CatalogProduct } from "./catalog";

export type Seller = {
  id: string;
  name: string;
  ordersCompleted: number;
  replyTime: string;
  products: CatalogProduct[];
};

export function getSellerById(id: string): Seller | undefined {
  const sellerProducts = catalogProducts.filter((p) => p.sellerId === id);
  if (sellerProducts.length === 0) return undefined;

  const first = sellerProducts[0];
  return {
    id,
    name: first.sellerName,
    ordersCompleted: first.sellerOrdersCompleted,
    replyTime: first.sellerReplyTime,
    products: sellerProducts,
  };
}
