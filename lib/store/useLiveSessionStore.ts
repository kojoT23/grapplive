import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";

// Same "one seller's worth of data" prototype scope as useCatalogStore,
// useStoreProfileStore, useBuyerRequestsStore — no real auth/session yet,
// so scheduling always happens as CURRENT_SELLER_ID ("s1"). Kept as an
// explicit sellerId field (rather than a bare boolean/session object) so
// the buyer-facing /live/[id] page can check it against the id in its own
// URL, and this doesn't silently break the moment real multi-seller auth
// exists — it'll just start being true per-seller instead of only for s1.
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
  session: LiveSession | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  scheduleSession: (session: LiveSession) => void;
  clearSession: () => void;
};

export const useLiveSessionStore = create<LiveSessionState>()(
  persist(
    (set) => ({
      session: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      scheduleSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: "grapplive-live-session",
      storage: safeJSONStorage,
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
