import { create } from "zustand";
import { initialProducts, type SellerProduct } from "@/lib/mock-data/products";

type ProductsState = {
  products: SellerProduct[];
};

export const useProductsStore = create<ProductsState>(() => ({
  products: initialProducts,
}));
