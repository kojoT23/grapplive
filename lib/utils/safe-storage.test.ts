import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { safeJSONStorage } from "./safe-storage";

// This wrapper exists specifically so a localStorage failure (quota
// exceeded, blocked storage) degrades to "doesn't persist" instead of
// crashing the app — see the comment in safe-storage.ts and
// ROADMAP.md §8.2. These tests exist to make sure that guarantee holds
// even if the implementation changes later.
describe("safeJSONStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips a normal value through get/set", async () => {
    await safeJSONStorage?.setItem("test-key", { state: { foo: "bar" }, version: 0 });
    const result = await safeJSONStorage?.getItem("test-key");
    expect(result).toEqual({ state: { foo: "bar" }, version: 0 });
  });

  it("does not throw when localStorage.setItem throws (quota exceeded)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() =>
      safeJSONStorage?.setItem("test-key", { state: { foo: "bar" }, version: 0 })
    ).not.toThrow();
  });

  it("does not throw when localStorage.getItem throws (corrupted storage)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });

    expect(() => safeJSONStorage?.getItem("test-key")).not.toThrow();
  });

  it("returns null (not an error) when getItem throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });

    const result = await safeJSONStorage?.getItem("test-key");
    expect(result).toBeNull();
  });

  it("does not throw when localStorage.removeItem throws", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });

    expect(() => safeJSONStorage?.removeItem("test-key")).not.toThrow();
  });

  it("a failed write doesn't corrupt a previously-successful one", async () => {
    await safeJSONStorage?.setItem("test-key", { state: { count: 1 }, version: 0 });

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    await safeJSONStorage?.setItem("test-key", { state: { count: 2 }, version: 0 });
    vi.restoreAllMocks();

    // The failed write didn't persist, so the last successfully-stored
    // value is still what's there.
    const result = await safeJSONStorage?.getItem("test-key");
    expect(result).toEqual({ state: { count: 1 }, version: 0 });
  });
});
