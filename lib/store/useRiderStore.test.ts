import { describe, it, expect, beforeEach } from "vitest";
import { useRiderStore } from "./useRiderStore";

describe("useRiderStore", () => {
  beforeEach(() => {
    useRiderStore.setState({ onlineByRider: {}, hasHydrated: true });
  });

  it("riders start offline", () => {
    expect(useRiderStore.getState().isOnline("r1")).toBe(false);
  });

  it("going online is per rider", () => {
    useRiderStore.getState().setOnline("r1", true);
    expect(useRiderStore.getState().isOnline("r1")).toBe(true);
    expect(useRiderStore.getState().isOnline("r2")).toBe(false);
    useRiderStore.getState().setOnline("r1", false);
    expect(useRiderStore.getState().isOnline("r1")).toBe(false);
  });
});
