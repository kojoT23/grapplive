import { create } from "zustand";
import { initialCustomers, type Customer } from "@/lib/mock-data/customers";

type CustomersState = {
  customers: Customer[];
  selectedIds: Set<string>;
  isSelectMode: boolean;
  toggleSelectMode: () => void;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  sendBulkMessage: (message: string) => { sentTo: number };
  addTag: (customerId: string, tag: string) => void;
  updateNotes: (customerId: string, notes: string) => void;
};

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: initialCustomers,
  selectedIds: new Set(),
  isSelectMode: false,

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
}));
