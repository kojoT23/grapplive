import { describe, it, expect, beforeEach } from "vitest";
import { useLiveSessionStore, migrateLiveSessions, type LiveSession } from "./useLiveSessionStore";

const session = (sellerId: string, productId = "p1"): LiveSession => ({
  sellerId,
  date: "2030-01-01",
  time: "18:00",
  platform: "tiktok",
  productId,
  productName: `Product ${productId}`,
});

describe("useLiveSessionStore", () => {
  beforeEach(() => {
    useLiveSessionStore.setState({ sessions: {}, hasHydrated: true });
  });

  describe("per-seller isolation (the bug this store fix addresses)", () => {
    it("a second seller scheduling does not overwrite the first seller's session", () => {
      useLiveSessionStore.getState().scheduleSession(session("seller-a", "pa"));
      useLiveSessionStore.getState().scheduleSession(session("seller-b", "pb"));

      const { sessions } = useLiveSessionStore.getState();
      expect(sessions["seller-a"].productId).toBe("pa");
      expect(sessions["seller-b"].productId).toBe("pb");
    });

    it("a seller with no session has no slot, even when another seller has one", () => {
      useLiveSessionStore.getState().scheduleSession(session("seller-a"));
      expect(useLiveSessionStore.getState().sessions["seller-b"]).toBeUndefined();
    });

    it("clearing one seller's session leaves the other's in place", () => {
      useLiveSessionStore.getState().scheduleSession(session("seller-a"));
      useLiveSessionStore.getState().scheduleSession(session("seller-b"));
      useLiveSessionStore.getState().clearSession("seller-a");

      const { sessions } = useLiveSessionStore.getState();
      expect(sessions["seller-a"]).toBeUndefined();
      expect(sessions["seller-b"]).toBeDefined();
    });

    it("rescheduling replaces only that seller's own session", () => {
      useLiveSessionStore.getState().scheduleSession(session("seller-a", "old"));
      useLiveSessionStore.getState().scheduleSession(session("seller-a", "new"));
      expect(useLiveSessionStore.getState().sessions["seller-a"].productId).toBe("new");
    });
  });

  describe("migrateLiveSessions (old single-session shape -> keyed by seller)", () => {
    it("moves the old session into its own seller's slot", () => {
      const migrated = migrateLiveSessions({ session: session("s1") }, 0);
      expect(migrated.sessions["s1"].productId).toBe("p1");
    });

    it("returns an empty map when no session was saved", () => {
      expect(migrateLiveSessions({ session: null }, 0)).toEqual({ sessions: {} });
      expect(migrateLiveSessions({}, 0)).toEqual({ sessions: {} });
    });

    it("passes already-current data through unchanged", () => {
      const data = { sessions: { a: session("a") } };
      expect(migrateLiveSessions(data, 1)).toBe(data);
    });
  });
});
