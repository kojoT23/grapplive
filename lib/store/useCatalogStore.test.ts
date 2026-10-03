import { describe, it, expect, beforeEach } from "vitest";
import { useCatalogStore, type NewCatalogProductInput } from "./useCatalogStore";
import { useAppStore } from "./useAppStore";
import { useSellerIdentityStore, DEMO_SELLER_ID } from "./useSellerIdentityStore";
import { catalogProducts } from "@/lib/mock-data/catalog";

function baseInput(overrides: Partial<NewCatalogProductInput> = {}): NewCatalogProductInput {
  return {
    name: "Test Product",
    priceGHS: 100,
    stockCount: 5,
    status: "live",
    category: "fashion",
    ...overrides,
  };
}

describe("useCatalogStore", () => {
  beforeEach(() => {
    // Reset every store this depends on to a known, isolated state —
    // these are module-level singletons, so without this, tests would
    // leak state into each other via import order.
    useCatalogStore.setState({ products: [...catalogProducts], hasHydrated: true });
    useAppStore.setState({ phone: "", isVerified: false, roles: [], activeRole: null });
    useSellerIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
  });

  describe("addProduct", () => {
    it("assigns a unique id following the existing p<n> pattern", () => {
      const id = useCatalogStore.getState().addProduct(baseInput());
      expect(id).toMatch(/^p\d+$/);
      expect(useCatalogStore.getState().products.some((p) => p.id === id)).toBe(true);
    });

    it("adds the new product to the front of the list", () => {
      const id = useCatalogStore.getState().addProduct(baseInput({ name: "Newest" }));
      expect(useCatalogStore.getState().products[0].id).toBe(id);
    });

    it("stamps the demo seller when no session exists", () => {
      const id = useCatalogStore.getState().addProduct(baseInput());
      const product = useCatalogStore.getState().products.find((p) => p.id === id);
      expect(product?.sellerId).toBe(DEMO_SELLER_ID);
    });

    it("stamps a genuinely new seller's own identity, not the demo seller's", () => {
      useSellerIdentityStore.getState().getOrCreateSellerId("+233501234567", "Kofi's Shop");
      // A second, different phone creates a second, non-demo identity —
      // see useSellerIdentityStore's own tests for the "first phone gets
      // the demo seller" rule this relies on.
      const newSellerId = useSellerIdentityStore
        .getState()
        .getOrCreateSellerId("+233559876543", "Ama's Boutique");
      useAppStore.setState({ phone: "+233559876543" });

      const id = useCatalogStore.getState().addProduct(baseInput());
      const product = useCatalogStore.getState().products.find((p) => p.id === id);
      expect(product?.sellerId).toBe(newSellerId);
      expect(product?.sellerName).toBe("Ama's Boutique");
      expect(product?.sellerId).not.toBe(DEMO_SELLER_ID);
    });

    it("ROADMAP.md §2.2: normalizes live + zero stock to out_of_stock", () => {
      const id = useCatalogStore
        .getState()
        .addProduct(baseInput({ status: "live", stockCount: 0 }));
      const product = useCatalogStore.getState().products.find((p) => p.id === id);
      expect(product?.status).toBe("out_of_stock");
    });

    it("keeps live status when stock is actually positive", () => {
      const id = useCatalogStore
        .getState()
        .addProduct(baseInput({ status: "live", stockCount: 10 }));
      const product = useCatalogStore.getState().products.find((p) => p.id === id);
      expect(product?.status).toBe("live");
    });

    it("does not touch draft status regardless of stock level", () => {
      const id = useCatalogStore
        .getState()
        .addProduct(baseInput({ status: "draft", stockCount: 0 }));
      expect(useCatalogStore.getState().products.find((p) => p.id === id)?.status).toBe("draft");
    });

    it("does not touch paused status regardless of stock level", () => {
      const id = useCatalogStore
        .getState()
        .addProduct(baseInput({ status: "paused", stockCount: 0 }));
      expect(useCatalogStore.getState().products.find((p) => p.id === id)?.status).toBe("paused");
    });
  });

  describe("updateProduct", () => {
    it("updates the matching product and leaves others untouched", () => {
      const id = useCatalogStore.getState().addProduct(baseInput({ name: "Original" }));
      const otherId = useCatalogStore.getState().products[1]?.id;

      useCatalogStore.getState().updateProduct(id, baseInput({ name: "Renamed" }));

      expect(useCatalogStore.getState().products.find((p) => p.id === id)?.name).toBe("Renamed");
      if (otherId) {
        expect(
          useCatalogStore.getState().products.find((p) => p.id === otherId)?.name
        ).not.toBe("Renamed");
      }
    });

    it("ROADMAP.md §2.2: auto-flips to out_of_stock when stock drops to zero", () => {
      const id = useCatalogStore
        .getState()
        .addProduct(baseInput({ status: "live", stockCount: 10 }));

      useCatalogStore.getState().updateProduct(id, baseInput({ status: "live", stockCount: 0 }));

      expect(useCatalogStore.getState().products.find((p) => p.id === id)?.status).toBe(
        "out_of_stock"
      );
    });

    it("ROADMAP.md §2.2: auto-flips back to live when restocked", () => {
      const id = useCatalogStore
        .getState()
        .addProduct(baseInput({ status: "live", stockCount: 0 })); // becomes out_of_stock

      useCatalogStore
        .getState()
        .updateProduct(id, baseInput({ status: "out_of_stock", stockCount: 10 }));

      expect(useCatalogStore.getState().products.find((p) => p.id === id)?.status).toBe("live");
    });

    it("is a no-op when the id doesn't match any product", () => {
      const before = useCatalogStore.getState().products;
      useCatalogStore.getState().updateProduct("does-not-exist", baseInput());
      expect(useCatalogStore.getState().products).toEqual(before);
    });
  });

  describe("deleteProduct", () => {
    it("removes exactly the matching product", () => {
      const id = useCatalogStore.getState().addProduct(baseInput());
      const countBefore = useCatalogStore.getState().products.length;

      useCatalogStore.getState().deleteProduct(id);

      expect(useCatalogStore.getState().products.length).toBe(countBefore - 1);
      expect(useCatalogStore.getState().products.some((p) => p.id === id)).toBe(false);
    });
  });
});
