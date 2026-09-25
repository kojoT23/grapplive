import { create } from "zustand";
import { persist } from "zustand/middleware";

// Same "one seller's worth of data" prototype scope as useProductsStore,
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
// up fresh, because the product picked here comes from useProductsStore
// (seller inventory) while the buyer-facing product link resolves through
// catalog.ts (published buyer catalog) — the two aren't unified yet (open
// item carried forward from earlier handovers). Denormalizing means the
// name always displays correctly even if that id doesn't resolve in
// catalog.ts; the "View product" link is best-effort and may 404 until
// those two data sources are unified.
