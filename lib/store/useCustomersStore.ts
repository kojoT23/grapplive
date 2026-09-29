import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import { initialCustomers, type Customer } from "@/lib/mock-data/customers";

type CustomersState = {
  customers: Customer[];
  selectedIds: Set<string>;
  isSelectMode: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  toggleSelectMode: () => void;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  sendBulkMessage: (message: string) => { sentTo: number };
  addTag: (customerId: string, tag: string) => void;
  updateNotes: (customerId: string, notes: string) => void;
};

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: initialCustomers,
      selectedIds: new Set(),
      isSelectMode: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      toggleSelectMode: () =>
        set((state) => ({
          isSelectMode: !state.isSelectMode,
          selectedIds: new Set(), // clear selection whenever mode toggles
        })),

      toggleSelected: (id) =>
        set((state) => {
          const next = new Set(state.selectedIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { selectedIds: next };
        }),

      clearSelection: () => set({ selectedIds: new Set() }),

      sendBulkMessage: (message) => {
        const count = get().selectedIds.size;
        // mock: real app would call a messaging API here
        console.log(`Mock bulk message to ${count} customers:`, message);
        set({ selectedIds: new Set(), isSelectMode: false });
        return { sentTo: count };
      },

      addTag: (customerId, tag) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId && tag.trim() && !c.tags.includes(tag.trim())
              ? { ...c, tags: [...c.tags, tag.trim()] }
              : c
          ),
        })),

      updateNotes: (customerId, notes) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, notes } : c
          ),
        })),
    }),
    {
      name: "grapplive-customers",
      storage: safeJSONStorage,
      // selectedIds/isSelectMode are bulk-select UI state, not data worth
      // surviving a reload (and Set doesn't serialize to JSON cleanly
      // anyway) — only the real customer data (tags, notes) persists.
      partialize: (state) => ({ customers: state.customers }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
