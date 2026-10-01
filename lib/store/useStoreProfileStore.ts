import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import { getStoreBySellerId, type StoreSocials } from "@/lib/mock-data/stores";

// Same "one seller's worth of data" prototype scope as the other stores
// in this build (useBuyerRequestsStore, useLiveSessionStore) — no real
// auth/session yet, so this always represents s1. ROADMAP.md §1.1's
// follow-up: unlike the other seller-facing stores, this one wasn't
// migrated to the dynamic useCurrentSellerId() resolution — making it
// properly per-seller needs the same keyed-by-id restructuring
// useSellerIdentityStore got, deliberately left as a separate follow-up
// rather than rushed alongside that change.
const CURRENT_SELLER_ID = "s1";
const seedStore = getStoreBySellerId(CURRENT_SELLER_ID);

type StoreProfileState = {
  about: string;
  socials: StoreSocials;
  // base64 data URLs, not blob: URLs — unlike buyer-request audio (which
  // has to stay in-memory because blob URLs die with the tab), data URLs
  // are plain strings and persist correctly through localStorage.
  logoDataUrl: string | null;
  bannerDataUrl: string | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  updateAbout: (about: string) => void;
  updateSocials: (socials: StoreSocials) => void;
  updateLogo: (dataUrl: string | null) => void;
  updateBanner: (dataUrl: string | null) => void;
};

export const useStoreProfileStore = create<StoreProfileState>()(
  persist(
    (set) => ({
      about: seedStore?.about ?? "",
      socials: seedStore?.socials ?? {},
      logoDataUrl: null,
      bannerDataUrl: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      updateAbout: (about) => set({ about }),
      updateSocials: (socials) => set({ socials }),
      updateLogo: (dataUrl) => set({ logoDataUrl: dataUrl }),
      updateBanner: (dataUrl) => set({ bannerDataUrl: dataUrl }),
    }),
    {
      name: "grapplive-store-profile",
      storage: safeJSONStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

