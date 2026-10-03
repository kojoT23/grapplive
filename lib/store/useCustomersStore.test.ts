import { describe, it, expect, beforeEach } from "vitest";
import { useCustomersStore } from "./useCustomersStore";
import { initialCustomers } from "@/lib/mock-data/customers";

describe("useCustomersStore", () => {
  beforeEach(() => {
    useCustomersStore.setState({
      customers: initialCustomers.map((c) => ({ ...c, tags: [...c.tags] })),
      selectedIds: new Set(),
      isSelectMode: false,
      hasHydrated: true,
    });
    localStorage.clear();
  });

  describe("addTag", () => {
    it("adds a tag to the matching customer only", () => {
      const targetId = initialCustomers[0].id;
      const otherId = initialCustomers[1].id;

      useCustomersStore.getState().addTag(targetId, "VIP");

      expect(
        useCustomersStore.getState().customers.find((c) => c.id === targetId)?.tags
      ).toContain("VIP");
      expect(
        useCustomersStore.getState().customers.find((c) => c.id === otherId)?.tags
      ).not.toContain("VIP");
    });

    it("does not add a duplicate tag", () => {
      const targetId = initialCustomers[0].id;
      useCustomersStore.getState().addTag(targetId, "Wholesale"); // already a tag on c1

      const tags = useCustomersStore.getState().customers.find((c) => c.id === targetId)?.tags;
      expect(tags?.filter((t) => t === "Wholesale").length).toBe(1);
    });

    it("ignores an empty or whitespace-only tag", () => {
      const targetId = initialCustomers[0].id;
      const before = useCustomersStore.getState().customers.find((c) => c.id === targetId)?.tags;

      useCustomersStore.getState().addTag(targetId, "   ");

      expect(
        useCustomersStore.getState().customers.find((c) => c.id === targetId)?.tags
      ).toEqual(before);
    });
  });

  describe("updateNotes", () => {
    it("updates notes on the matching customer only", () => {
      const targetId = initialCustomers[0].id;
      const otherId = initialCustomers[1].id;

      useCustomersStore.getState().updateNotes(targetId, "Called about a delayed order.");

      expect(
        useCustomersStore.getState().customers.find((c) => c.id === targetId)?.notes
      ).toBe("Called about a delayed order.");
      expect(
        useCustomersStore.getState().customers.find((c) => c.id === otherId)?.notes
      ).not.toBe("Called about a delayed order.");
    });
  });

  describe("selection", () => {
    it("toggleSelected adds then removes an id", () => {
      const id = initialCustomers[0].id;
      useCustomersStore.getState().toggleSelected(id);
      expect(useCustomersStore.getState().selectedIds.has(id)).toBe(true);

      useCustomersStore.getState().toggleSelected(id);
      expect(useCustomersStore.getState().selectedIds.has(id)).toBe(false);
    });

    it("toggleSelectMode clears any existing selection", () => {
      useCustomersStore.getState().toggleSelected(initialCustomers[0].id);
      useCustomersStore.getState().toggleSelectMode();
      expect(useCustomersStore.getState().selectedIds.size).toBe(0);
    });

    it("sendBulkMessage reports the count and clears selection + select mode", () => {
      useCustomersStore.getState().toggleSelected(initialCustomers[0].id);
      useCustomersStore.getState().toggleSelected(initialCustomers[1].id);
      useCustomersStore.setState({ isSelectMode: true });

      const result = useCustomersStore.getState().sendBulkMessage("Hello!");

      expect(result.sentTo).toBe(2);
      expect(useCustomersStore.getState().selectedIds.size).toBe(0);
      expect(useCustomersStore.getState().isSelectMode).toBe(false);
    });
  });

  describe("ROADMAP.md §1.4: Customer is seller-scoped data", () => {
    it("every fixture customer has a sellerId", () => {
      for (const c of useCustomersStore.getState().customers) {
        expect(c.sellerId).toBeTruthy();
      }
    });
  });

  describe("ROADMAP.md §2.1: persistence excludes bulk-select UI state", () => {
    it("only persists `customers`, not selectedIds/isSelectMode", async () => {
      // Drive a real state change through the store's own persist
      // middleware rather than calling partialize directly, so this test
      // breaks if the middleware config (e.g. the storage key) ever
      // silently stops applying partialize at all.
      useCustomersStore.getState().addTag(initialCustomers[0].id, "Persisted Tag");
      useCustomersStore.getState().toggleSelected(initialCustomers[0].id);

      // zustand's persist middleware writes asynchronously (it's a
      // microtask); give it a tick before inspecting localStorage.
      await new Promise((resolve) => setTimeout(resolve, 0));

      const raw = localStorage.getItem("grapplive-customers");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw as string);

      expect(parsed.state.customers).toBeDefined();
      expect(parsed.state.selectedIds).toBeUndefined();
      expect(parsed.state.isSelectMode).toBeUndefined();
    });
  });
});
