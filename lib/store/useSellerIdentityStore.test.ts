import { describe, it, expect, beforeEach } from "vitest";
import {
  useSellerIdentityStore,
  getCurrentSellerIdSync,
  DEMO_SELLER_ID,
} from "./useSellerIdentityStore";
import { useAppStore } from "./useAppStore";

describe("useSellerIdentityStore", () => {
  beforeEach(() => {
    useSellerIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
    useAppStore.setState({ phone: "", isVerified: false, roles: [], activeRole: null });
  });

  describe("getOrCreateSellerId", () => {
    it("ROADMAP.md §1.1: the first phone ever inherits the demo seller", () => {
      const id = useSellerIdentityStore
        .getState()
        .getOrCreateSellerId("+233501111111", "Whatever Name");
      expect(id).toBe(DEMO_SELLER_ID);
    });

    it("the demo seller's name/stats come from the real fixture, not the entered name", () => {
      useSellerIdentityStore.getState().getOrCreateSellerId("+233501111111", "Ignored Name");
      const identity = useSellerIdentityStore.getState().identitiesByPhone["+233501111111"];
      // Whatever name the demo seller's fixture data actually has — the
      // point is it's NOT "Ignored Name", the name typed at signup.
      expect(identity.name).not.toBe("Ignored Name");
      expect(identity.ordersCompleted).toBeGreaterThan(0);
    });

    it("the actual bug this store fixes: a second, different phone does NOT inherit the demo seller", () => {
      useSellerIdentityStore.getState().getOrCreateSellerId("+233501111111", "First Seller");
      const secondId = useSellerIdentityStore
        .getState()
        .getOrCreateSellerId("+233502222222", "Second Seller");

      expect(secondId).not.toBe(DEMO_SELLER_ID);
    });

    it("a genuinely new seller gets their own entered name and zeroed stats", () => {
      useSellerIdentityStore.getState().getOrCreateSellerId("+233501111111", "First Seller");
      useSellerIdentityStore.getState().getOrCreateSellerId("+233502222222", "Second Seller");

      const identity = useSellerIdentityStore.getState().identitiesByPhone["+233502222222"];
      expect(identity.name).toBe("Second Seller");
      expect(identity.ordersCompleted).toBe(0);
    });

    it("is idempotent: calling it again for the same phone returns the same id", () => {
      // A different phone claims the demo slot first, so this test's own
      // phone is guaranteed to get a genuinely new identity rather than
      // silently inheriting the demo seller's fixture name.
      useSellerIdentityStore.getState().getOrCreateSellerId("+233500000000", "Demo Claimer");

      const firstCall = useSellerIdentityStore
        .getState()
        .getOrCreateSellerId("+233501111111", "A Name");
      const secondCall = useSellerIdentityStore
        .getState()
        .getOrCreateSellerId("+233501111111", "A Different Name Passed By Mistake");

      expect(secondCall).toBe(firstCall);
      // And the identity's actual stored name didn't change either — an
      // existing identity is returned as-is, the name argument is only
      // used the first time.
      expect(useSellerIdentityStore.getState().identitiesByPhone["+233501111111"].name).toBe(
        "A Name"
      );
    });

    it("falls back to 'My Store' if an empty name is given for a new (non-demo) seller", () => {
      useSellerIdentityStore.getState().getOrCreateSellerId("+233501111111", "First Seller");
      useSellerIdentityStore.getState().getOrCreateSellerId("+233502222222", "   ");

      expect(useSellerIdentityStore.getState().identitiesByPhone["+233502222222"].name).toBe(
        "My Store"
      );
    });
  });

  describe("getCurrentSellerIdSync", () => {
    it("falls back to the demo seller when no one is logged in", () => {
      expect(getCurrentSellerIdSync()).toBe(DEMO_SELLER_ID);
    });

    it("resolves to whichever identity the current phone already has", () => {
      const newId = useSellerIdentityStore.getState().getOrCreateSellerId("+233501111111", "A");
      useSellerIdentityStore.getState().getOrCreateSellerId("+233502222222", "B");
      useAppStore.setState({ phone: "+233501111111" });

      expect(getCurrentSellerIdSync()).toBe(newId);
    });

    it("does NOT create an identity — it's read-only", () => {
      useAppStore.setState({ phone: "+233509999999" });
      getCurrentSellerIdSync();
      expect(useSellerIdentityStore.getState().identitiesByPhone["+233509999999"]).toBeUndefined();
    });
  });
});
