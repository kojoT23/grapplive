import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import { getStoreBySellerId, type StoreSocials } from "@/lib/mock-data/stores";
import { DEMO_SELLER_ID } from "@/lib/store/useSellerIdentityStore";

// ROADMAP.md §1.1 follow-up: this store used to hold ONE seller's profile
// (hardcoded to "s1") as flat top-level fields, so a second seller signing
// up on the same device would have seen — and overwritten — the first
// seller's about text, socials, logo and banner. It's now keyed by seller
// id, same idea as useSellerIdentityStore / useCatalogStore. Components
// don't read this store directly anymore: use useCurrentStoreProfile()
// (lib/hooks), which resolves to whichever seller is signed in.
export type StoreProfileFields = {
  about: string;
  socials: StoreSocials;
  // base64 data URLs, not blob: URLs — unlike buyer-request audio (which
  // has to stay in-memory because blob URLs die with the tab), data URLs
  // are plain strings and persist correctly through localStorage.
  logoDataUrl: string | null;
  bannerDataUrl: string | null;
};

// What a seller's profile looks like before they've edited anything: the
// demo seller (and any other seller with a Store record in the static
// fixtures) starts from that record; a genuinely new seller starts blank.
export function seedProfileFor(sellerId: string): StoreProfileFields {
  const seed = getStoreBySellerId(sellerId);
  return {
    about: seed?.about ?? "",
    socials: seed?.socials ?? {},
    logoDataUrl: null,
    bannerDataUrl: null,
  };
}

type StoreProfileState = {
  profiles: Record<string, StoreProfileFields>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  updateAbout: (sellerId: string, about: string) => void;
  updateSocials: (sellerId: string, socials: StoreSocials) => void;
  updateLogo: (sellerId: string, dataUrl: string | null) => void;
  updateBanner: (sellerId: string, dataUrl: string | null) => void;
};

function patchProfile(
  state: StoreProfileState,
  sellerId: string,
  patch: Partial<StoreProfileFields>
) {
  const current = state.profiles[sellerId] ?? seedProfileFor(sellerId);
  return { profiles: { ...state.profiles, [sellerId]: { ...current, ...patch } } };
}

// Version 0 was the old flat, single-seller shape. Anyone with that data
// already saved on their device keeps their edits — they belonged to the
// demo seller, since that's the only seller the old shape could represent.
export function migrateStoreProfile(persisted: unknown, version: number) {
  if (version >= 1) return persisted as Pick<StoreProfileState, "profiles">;
  const old = (persisted ?? {}) as Partial<StoreProfileFields>;
  const hasOldData =
    old.about !== undefined ||
    old.socials !== undefined ||
    old.logoDataUrl !== undefined ||
    old.bannerDataUrl !== undefined;
  if (!hasOldData) return { profiles: {} };
  return {
    profiles: {
      [DEMO_SELLER_ID]: {
        about: old.about ?? "",
        socials: old.socials ?? {},
        logoDataUrl: old.logoDataUrl ?? null,
        bannerDataUrl: old.bannerDataUrl ?? null,
      },
    },
  };
}

export const useStoreProfileStore = create<StoreProfileState>()(
  persist(
    (set) => ({
      profiles: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      updateAbout: (sellerId, about) => set((state) => patchProfile(state, sellerId, { about })),
      updateSocials: (sellerId, socials) =>
        set((state) => patchProfile(state, sellerId, { socials })),
      updateLogo: (sellerId, logoDataUrl) =>
        set((state) => patchProfile(state, sellerId, { logoDataUrl })),
      updateBanner: (sellerId, bannerDataUrl) =>
        set((state) => patchProfile(state, sellerId, { bannerDataUrl })),
    }),
    {
      name: "grapplive-store-profile",
      storage: safeJSONStorage,
      version: 1,
      migrate: migrateStoreProfile,
      partialize: (state) => ({ profiles: state.profiles }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
