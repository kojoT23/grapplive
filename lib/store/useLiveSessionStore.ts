import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";

// Keyed by seller id, one scheduled session per seller. This store used to
// hold a single session for the whole device, so a second seller opening
// the go-live page saw the first seller's session, and scheduling their own
// silently overwrote it. Now each seller has their own slot, same idea as
// useStoreProfileStore / usePayoutsStore. The buyer-facing /live/[id] page
// and the seller-page banner read the slot for the seller id in their URL.
export type Platform = "tiktok" | "instagram" | "facebook";

export type LiveSession = {
  sellerId: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  platform: Platform;
  productId: string;
  productName: string; // denormalized at schedule time — see note below
};

type LiveSessionState = {
  sessions: Record<string, LiveSession>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  // Stored under session.sellerId.
  scheduleSession: (session: LiveSession) => void;
  clearSession: (sellerId: string) => void;
};

// Version 0 was the old single-session shape ({ session }). A saved session
// already carries its own sellerId, so it moves straight into that
// seller's slot and nothing is lost.
export function migrateLiveSessions(persisted: unknown, version: number) {
  if (version >= 1) return persisted as Pick<LiveSessionState, "sessions">;
  const old = (persisted ?? {}) as { session?: LiveSession | null };
  if (!old.session) return { sessions: {} };
  return { sessions: { [old.session.sellerId]: old.session } };
}

export const useLiveSessionStore = create<LiveSessionState>()(
  persist(
    (set) => ({
      sessions: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      scheduleSession: (session) =>
        set((state) => ({ sessions: { ...state.sessions, [session.sellerId]: session } })),
      clearSession: (sellerId) =>
        set((state) => {
          const rest = { ...state.sessions };
          delete rest[sellerId];
          return { sessions: rest };
        }),
    }),
    {
      name: "grapplive-live-session",
      storage: safeJSONStorage,
      version: 1,
      migrate: migrateLiveSessions,
      partialize: (state) => ({ sessions: state.sessions }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// productName is denormalized (stored at schedule time) rather than looked
// up fresh, so the name still displays correctly if the product is
// deleted or renamed after scheduling — same snapshot-at-the-time idea as
// OrderItem.itemName. /live/[id] resolves the pinned product against the
// reactive useCatalogStore, so products created after the app shipped get
// a working "View product" link too; if the product no longer exists, it
// falls back to this stored name rather than a dead link.
