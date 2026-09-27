import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// productName is denormalized (stored at schedule time) rather than looked
// up fresh. useCatalogStore/catalog.ts are unified now (products added via
// /products/new are real CatalogProducts, not a disconnected shadow copy),
// but the buyer-facing /live/[id] page still resolves the pinned product
// through the static catalog.ts snapshot rather than the reactive store —
// so a session pinning a product created after that snapshot was read
// still won't resolve there. Denormalizing means the name always displays
// correctly regardless; the "View product" link is best-effort and may
// 404 for a newly-created product until /live/[id] is wired to the
// reactive store too.
