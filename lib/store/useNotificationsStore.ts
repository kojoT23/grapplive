import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import {
  GRAPPSTORE_SELLER_ID,
  MAX_PER_RECIPIENT,
  STAFF_RECIPIENT,
  buyerRecipient,
  riderRecipient,
  sellerRecipient,
  type AppNotification,
  type NotificationKind,
} from "@/lib/mock-data/notifications";

export type NewNotification = {
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
};

type NotificationsState = {
  items: AppNotification[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  notify: (recipient: string, input: NewNotification) => void;
  // Only the recipient themselves can mark their notifications read.
  markRead: (id: string, recipient: string) => void;
  markAllRead: (recipient: string) => void;
};

// ---- Selectors ----

export function notificationsFor(items: AppNotification[], recipient: string): AppNotification[] {
  return items.filter((n) => n.recipient === recipient).sort((a, b) => b.createdAt - a.createdAt);
}

export function unreadCount(items: AppNotification[], recipient: string): number {
  return items.filter((n) => n.recipient === recipient && n.readAt === undefined).length;
}

let counter = 0;
function nextId() {
  counter += 1;
  return `n${Date.now()}-${counter}`;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      notify: (recipient, input) => {
        if (!recipient || recipient.endsWith(":")) return; // nobody to tell (e.g. no phone)
        const note: AppNotification = {
          id: nextId(),
          recipient,
          kind: input.kind,
          title: input.title,
          body: input.body,
          href: input.href,
          createdAt: Date.now(),
        };
        set((state) => {
          const mine = state.items.filter((n) => n.recipient === recipient);
          const others = state.items.filter((n) => n.recipient !== recipient);
          // Keep this person's newest MAX_PER_RECIPIENT, including the new one.
          const kept = [note, ...mine.sort((a, b) => b.createdAt - a.createdAt)].slice(0, MAX_PER_RECIPIENT);
          return { items: [...others, ...kept] };
        });
      },

      markRead: (id, recipient) =>
        set((state) => ({
          items: state.items.map((n) =>
            n.id === id && n.recipient === recipient && n.readAt === undefined ? { ...n, readAt: Date.now() } : n
          ),
        })),

      markAllRead: (recipient) =>
        set((state) => ({
          items: state.items.map((n) =>
            n.recipient === recipient && n.readAt === undefined ? { ...n, readAt: Date.now() } : n
          ),
        })),
    }),
    {
      name: "grapplive-notifications",
      storage: safeJSONStorage,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// ---- Convenience senders, one per kind of recipient ----

const notify = (recipient: string, input: NewNotification) =>
  useNotificationsStore.getState().notify(recipient, input);

export function notifyBuyer(phone: string | undefined, input: NewNotification) {
  if (phone) notify(buyerRecipient(phone), input);
}

export function notifyRider(riderId: string | null | undefined, input: NewNotification) {
  if (riderId) notify(riderRecipient(riderId), { href: "/rider", ...input });
}

export function notifyStaff(input: NewNotification) {
  notify(STAFF_RECIPIENT, { href: "/grappstore/ops", ...input });
}

// A seller's inbox is their own; GrappStore's goes to staff, and its screens
// live under /grappstore instead of /orders.
export function notifySeller(sellerId: string, input: NewNotification) {
  if (sellerId === GRAPPSTORE_SELLER_ID) {
    notify(STAFF_RECIPIENT, { ...input, href: input.href ?? "/grappstore/fulfillment" });
  } else {
    notify(sellerRecipient(sellerId), { href: "/orders", ...input });
  }
}
