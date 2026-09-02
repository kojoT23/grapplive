import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "shop" | "sell";

type AppState = {
  phone: string;
  isVerified: boolean;
  roles: Role[];           // every role this user has adopted
  activeRole: Role | null; // which mode they're currently using
  hasHydrated: boolean;
  setPhone: (phone: string) => void;
  verifyOtp: (code: string) => boolean;
  addRole: (role: Role) => void;       // adopt a new role, switch to it
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
