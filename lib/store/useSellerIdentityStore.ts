import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import { getSellerById } from "@/lib/mock-data/sellers";
import { useAppStore } from "@/lib/store/useAppStore";

// ROADMAP.md §1.1: picking "Sell" at /auth/role-selector used to just set
// activeRole on useAppStore — it never created a real seller identity, so
// every seller-facing page hardcoded CURRENT_SELLER_ID = "s1" regardless
// of who actually verified their phone. This store is that missing link:
// a real, persisted phone -> seller id mapping, created the moment
// someone picks "Sell" for the first time.
//
// DEMO_SELLER_ID ("s1") is the seller this app ships fixture data for —
// products, a storefront, orders, everything. Whoever is FIRST to pick
// "Sell" in a given browser inherits that identity, so the existing demo
// experience keeps working exactly as it did before this store existed
// (including for anyone who already has a persisted session from before
// this fix shipped — see getOrCreateSellerId below). Any DIFFERENT phone
// that later picks "Sell" in that same browser gets a genuinely new,
// empty seller instead of silently sharing/overwriting s1's real data —
// that silent-sharing was the actual bug this store fixes.
export const DEMO_SELLER_ID = "s1";

export type SellerIdentity = {
  id: string;
  phone: string;
  name: string;
  ordersCompleted: number;
  replyTime: string;
};

type SellerIdentityState = {
  // Keyed by phone, not id — phone is the lookup direction the app
  // actually needs (given a verified phone, which seller is this?).
  identitiesByPhone: Record<string, SellerIdentity>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  // Returns the existing seller id for `phone` if one exists; otherwise
  // creates a fresh identity and returns its new id. `name` is only used
  // when actually creating a new (non-demo) identity.
  getOrCreateSellerId: (phone: string, name: string) => string;
};

export const useSellerIdentityStore = create<SellerIdentityState>()(
  persist(
    (set, get) => ({
      identitiesByPhone: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      getOrCreateSellerId: (phone, name) => {
        const existing = get().identitiesByPhone[phone];
        if (existing) return existing.id;

        const demoAlreadyClaimed = Object.values(get().identitiesByPhone).some(
          (identity) => identity.id === DEMO_SELLER_ID
        );
        const demoSeller = !demoAlreadyClaimed ? getSellerById(DEMO_SELLER_ID) : undefined;

        const identity: SellerIdentity = demoSeller
          ? {
              id: DEMO_SELLER_ID,
              phone,
              name: demoSeller.name,
              ordersCompleted: demoSeller.ordersCompleted,
              replyTime: demoSeller.replyTime,
            }
          : {
              id: `s${Date.now()}`,
              phone,
              name: name.trim() || "My Store",
              ordersCompleted: 0,
              replyTime: "Usually within a day",
            };

        set((state) => ({
          identitiesByPhone: { ...state.identitiesByPhone, [phone]: identity },
        }));
        return identity.id;
      },
    }),
    {
      name: "grapplive-seller-identity",
      storage: safeJSONStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Non-hook accessor for use inside other stores' action bodies (e.g.
// useCatalogStore's addProduct), where React hooks aren't available.
// Resolves to whichever identity the currently-authenticated phone
// already has, WITHOUT creating one — falls back to the demo seller if
// there's no session yet, so calling code never has to special-case "no
// one's logged in" separately.
export function getCurrentSellerIdSync(): string {
  const phone = useAppStore.getState().phone;
  const identity = phone ? useSellerIdentityStore.getState().identitiesByPhone[phone] : undefined;
  return identity?.id ?? DEMO_SELLER_ID;
}
