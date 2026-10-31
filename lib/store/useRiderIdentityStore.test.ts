import { describe, it, expect, beforeEach } from "vitest";
import { useRiderIdentityStore, getCurrentRiderIdSync } from "./useRiderIdentityStore";
import { useAppStore } from "./useAppStore";

describe("useRiderIdentityStore", () => {
  beforeEach(() => {
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
    useAppStore.setState({ phone: "", isVerified: false, roles: [], activeRole: null });
  });

  describe("getOrCreateRiderId", () => {
    it("creates a new, empty rider from the details entered", () => {
      const id = useRiderIdentityStore
        .getState()
        .getOrCreateRiderId("+233501111111", { name: "  Kwesi  ", vehicle: "bicycle", area: "Tema" });

      const rider = useRiderIdentityStore.getState().identitiesByPhone["+233501111111"];
      expect(rider.id).toBe(id);
      expect(rider.name).toBe("Kwesi");
      expect(rider.vehicle).toBe("bicycle");
      expect(rider.area).toBe("Tema");
      expect(rider.tripsCompleted).toBe(0);
      expect(rider.rating).toBeNull();
    });

    it("returns the same id for the same phone and ignores later details", () => {
      const first = useRiderIdentityStore
        .getState()
        .getOrCreateRiderId("+233501111111", { name: "Kwesi", vehicle: "motorbike", area: "Accra" });
      const second = useRiderIdentityStore
        .getState()
        .getOrCreateRiderId("+233501111111", { name: "Someone Else", vehicle: "car", area: "Kumasi" });

      expect(second).toBe(first);
      expect(useRiderIdentityStore.getState().identitiesByPhone["+233501111111"].name).toBe("Kwesi");
    });

    it("gives different phones different riders (no shared data)", () => {
      const a = useRiderIdentityStore
        .getState()
        .getOrCreateRiderId("+233501111111", { name: "A", vehicle: "motorbike", area: "Accra" });
      const b = useRiderIdentityStore
        .getState()
        .getOrCreateRiderId("+233502222222", { name: "B", vehicle: "motorbike", area: "Accra" });

      expect(a).not.toBe(b);
      expect(Object.keys(useRiderIdentityStore.getState().identitiesByPhone)).toHaveLength(2);
    });

    it("falls back to a default name and the first service area when given bad input", () => {
      useRiderIdentityStore
        .getState()
        .getOrCreateRiderId("+233501111111", { name: "   ", vehicle: "car", area: "Atlantis" });

      const rider = useRiderIdentityStore.getState().identitiesByPhone["+233501111111"];
      expect(rider.name).toBe("Rider");
      expect(rider.area).toBe("Accra");
    });
  });

  describe("getCurrentRiderIdSync", () => {
    it("is null when nobody is signed in", () => {
      expect(getCurrentRiderIdSync()).toBeNull();
    });

    it("is null when the signed-in phone has no rider identity (no demo fallback)", () => {
      useAppStore.setState({ phone: "+233501111111" });
      expect(getCurrentRiderIdSync()).toBeNull();
    });

    it("resolves to the signed-in phone's rider", () => {
      const id = useRiderIdentityStore
        .getState()
        .getOrCreateRiderId("+233501111111", { name: "Kwesi", vehicle: "motorbike", area: "Accra" });
      useAppStore.setState({ phone: "+233501111111" });
      expect(getCurrentRiderIdSync()).toBe(id);
    });
  });
});
