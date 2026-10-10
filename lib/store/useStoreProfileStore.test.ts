import { describe, it, expect, beforeEach } from "vitest";
import {
  useStoreProfileStore,
  seedProfileFor,
  migrateStoreProfile,
} from "./useStoreProfileStore";
import { DEMO_SELLER_ID } from "./useSellerIdentityStore";
import { getStoreBySellerId } from "@/lib/mock-data/stores";

describe("useStoreProfileStore", () => {
  beforeEach(() => {
    useStoreProfileStore.setState({ profiles: {}, hasHydrated: true });
  });

  describe("seedProfileFor", () => {
    it("starts the demo seller from their static Store record", () => {
      const seed = seedProfileFor(DEMO_SELLER_ID);
      expect(seed.about).toBe(getStoreBySellerId(DEMO_SELLER_ID)?.about);
      expect(seed.logoDataUrl).toBeNull();
    });

    it("starts a genuinely new seller blank, not with the demo seller's profile", () => {
      const seed = seedProfileFor("s-brand-new");
      expect(seed.about).toBe("");
      expect(seed.socials).toEqual({});
    });
  });

  describe("per-seller isolation (the bug this store fix addresses)", () => {
    it("one seller's edit does not touch another seller's profile", () => {
      useStoreProfileStore.getState().updateAbout("seller-a", "Seller A's about");
      useStoreProfileStore.getState().updateAbout("seller-b", "Seller B's about");

      const { profiles } = useStoreProfileStore.getState();
      expect(profiles["seller-a"].about).toBe("Seller A's about");
      expect(profiles["seller-b"].about).toBe("Seller B's about");
    });

    it("editing one field keeps the seller's other fields (including seeded ones)", () => {
      useStoreProfileStore.getState().updateSocials(DEMO_SELLER_ID, { whatsappNumber: "0240000000" });

      const profile = useStoreProfileStore.getState().profiles[DEMO_SELLER_ID];
      expect(profile.socials.whatsappNumber).toBe("0240000000");
      // about was never edited, so it should still be the seeded value
      expect(profile.about).toBe(getStoreBySellerId(DEMO_SELLER_ID)?.about);
    });

    it("logo and banner can be set and cleared independently", () => {
      useStoreProfileStore.getState().updateLogo("seller-a", "data:image/jpeg;base64,AAA");
      useStoreProfileStore.getState().updateBanner("seller-a", "data:image/jpeg;base64,BBB");
      useStoreProfileStore.getState().updateLogo("seller-a", null);

      const profile = useStoreProfileStore.getState().profiles["seller-a"];
      expect(profile.logoDataUrl).toBeNull();
      expect(profile.bannerDataUrl).toBe("data:image/jpeg;base64,BBB");
    });
  });

  describe("migrateStoreProfile (old flat single-seller shape -> keyed by seller)", () => {
    it("moves old flat data under the demo seller, so existing edits aren't lost", () => {
      const migrated = migrateStoreProfile(
        {
          about: "My old edited about",
          socials: { instagramHandle: "oldhandle" },
          logoDataUrl: "data:image/png;base64,LOGO",
          bannerDataUrl: null,
        },
        0
      );

      expect(migrated.profiles[DEMO_SELLER_ID]).toEqual({
        about: "My old edited about",
        socials: { instagramHandle: "oldhandle" },
        logoDataUrl: "data:image/png;base64,LOGO",
        bannerDataUrl: null,
      });
    });

    it("gives an empty profiles map when there was nothing saved to migrate", () => {
      expect(migrateStoreProfile({}, 0)).toEqual({ profiles: {} });
      expect(migrateStoreProfile(undefined, 0)).toEqual({ profiles: {} });
    });

    it("leaves already-current-version data untouched", () => {
      const current = { profiles: { "seller-a": { about: "x", socials: {}, logoDataUrl: null, bannerDataUrl: null } } };
      expect(migrateStoreProfile(current, 1)).toEqual(current);
    });
  });
});
