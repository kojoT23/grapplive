import { create } from "zustand";
import { persist } from "zustand/middleware";

// grapplive_staff is deliberately separate from "sell" — a marketplace
// seller is not GRAPPlive staff, and shouldn't get access to GRAPPlive's
// own internal ops screens just because they hold "sell". It's also
// modeled differently from "shop"/"sell": those two are mutually
// exclusive UI *modes* a person switches between, but grapplive_staff is
// a standing *permission* — holding it shouldn't depend on, or affect,
// which mode you're currently browsing in.
type Role = "shop" | "sell" | "grapplive_staff";

type AppState = {
  phone: string;
  isVerified: boolean;
  roles: Role[];           // every role this user has adopted
  activeRole: Role | null; // which mode they're currently using
  hasHydrated: boolean;
  setPhone: (phone: string) => void;
  verifyOtp: (code: string) => boolean;
  addRole: (role: Role) => void;       // adopt a new MODE, switch to it (shop/sell)
  grantRole: (role: Role) => void;     // adopt a PERMISSION, without changing active mode
  setActiveRole: (role: Role) => void; // switch between roles already held
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      phone: "",
      isVerified: false,
      roles: [],
      activeRole: null,
      hasHydrated: false,

      setPhone: (phone) => set({ phone }),

      verifyOtp: (code) => {
        const ok = /^\d{4,6}$/.test(code);
        if (ok) set({ isVerified: true });
        return ok;
      },

      addRole: (role) => {
        const current = get().roles;
        const nextRoles = current.includes(role) ? current : [...current, role];
        set({ roles: nextRoles, activeRole: role });
      },

      grantRole: (role) => {
        const current = get().roles;
        if (!current.includes(role)) set({ roles: [...current, role] });
      },

      setActiveRole: (role) => {
        if (get().roles.includes(role)) set({ activeRole: role });
      },

      logout: () => set({ phone: "", isVerified: false, roles: [], activeRole: null }),

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "grapplelive-session",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
