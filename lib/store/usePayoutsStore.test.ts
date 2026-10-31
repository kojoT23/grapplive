import { describe, it, expect, beforeEach } from "vitest";
import { usePayoutsStore, seedPayoutsFor, migratePayouts } from "./usePayoutsStore";
import { DEMO_SELLER_ID } from "./useSellerIdentityStore";
import { availableBalanceGHS, payoutHistory } from "@/lib/mock-data/payouts";

describe("usePayoutsStore", () => {
  beforeEach(() => {
    usePayoutsStore.setState({ payoutsBySeller: {}, hasHydrated: true });
  });

  describe("seedPayoutsFor", () => {
    it("starts the demo seller from the static fixtures", () => {
      const seed = seedPayoutsFor(DEMO_SELLER_ID);
      expect(seed.balanceGHS).toBe(availableBalanceGHS);
      expect(seed.history).toEqual(payoutHistory);
    });

    it("starts a genuinely new seller empty, not with the demo seller's money", () => {
      const seed = seedPayoutsFor("s-brand-new");
      expect(seed.balanceGHS).toBe(0);
      expect(seed.history).toEqual([]);
      expect(seed.momoDetails.numberMasked).toBe("");
      expect(seed.momoDetails.isVerified).toBe(false);
    });
  });

  describe("per-seller isolation (the bug this store fix addresses)", () => {
    it("one seller requesting a payout does not touch another seller's balance", () => {
      usePayoutsStore.getState().requestPayout(DEMO_SELLER_ID);

      const { payoutsBySeller } = usePayoutsStore.getState();
      expect(payoutsBySeller[DEMO_SELLER_ID].balanceGHS).toBe(0);
      expect(payoutsBySeller[DEMO_SELLER_ID].history[0].amountGHS).toBe(availableBalanceGHS);
      expect(payoutsBySeller["s-other"]).toBeUndefined();
      expect(seedPayoutsFor("s-other").balanceGHS).toBe(0);
    });

    it("a seller with no balance cannot create a payout record", () => {
      usePayoutsStore.getState().requestPayout("s-brand-new");
      expect(usePayoutsStore.getState().payoutsBySeller["s-brand-new"]).toBeUndefined();
    });

    it("changing one seller's MoMo number leaves another's untouched", () => {
      usePayoutsStore.getState().updateMomoNumber("seller-a", "024 XXX 1111");
      usePayoutsStore.getState().updateMomoNumber("seller-b", "055 XXX 2222");

      const { payoutsBySeller } = usePayoutsStore.getState();
      expect(payoutsBySeller["seller-a"].momoDetails.numberMasked).toBe("024 XXX 1111");
      expect(payoutsBySeller["seller-b"].momoDetails.numberMasked).toBe("055 XXX 2222");
    });
  });

  describe("updateMomoNumber", () => {
    it("sets a first number directly, unverified, with no cooling-off", () => {
      usePayoutsStore.getState().updateMomoNumber("s-new", "024 XXX 9999");
      const momo = usePayoutsStore.getState().payoutsBySeller["s-new"].momoDetails;
      expect(momo.numberMasked).toBe("024 XXX 9999");
      expect(momo.isVerified).toBe(false);
      expect(momo.pendingChange).toBeNull();
    });

    it("stages a change to an existing number behind the 24h cooling-off", () => {
      usePayoutsStore.getState().updateMomoNumber(DEMO_SELLER_ID, "055 XXX 0000");
      const momo = usePayoutsStore.getState().payoutsBySeller[DEMO_SELLER_ID].momoDetails;
      expect(momo.numberMasked).toBe("024 XXX 4567");
      expect(momo.pendingChange?.newNumberMasked).toBe("055 XXX 0000");
      expect(momo.pendingChange?.hoursRemaining).toBe(24);
    });
  });

  describe("migratePayouts (old flat single-seller shape -> keyed by seller)", () => {
    it("moves old flat data under the demo seller, so existing state isn't lost", () => {
      const migrated = migratePayouts(
        { balanceGHS: 0, history: [{ id: "x", amountGHS: 5, detail: "d", status: "paid_out" }] },
        0
      );
      expect(migrated.payoutsBySeller[DEMO_SELLER_ID].balanceGHS).toBe(0);
      expect(migrated.payoutsBySeller[DEMO_SELLER_ID].history).toHaveLength(1);
    });

    it("returns an empty map when there was nothing saved", () => {
      expect(migratePayouts({}, 0)).toEqual({ payoutsBySeller: {} });
    });

    it("passes already-current data through unchanged", () => {
      const data = { payoutsBySeller: { a: seedPayoutsFor("a") } };
      expect(migratePayouts(data, 1)).toBe(data);
    });
  });
});
