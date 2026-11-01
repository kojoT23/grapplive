import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import { serviceAreas } from "@/lib/mock-data/serviceAreas";
import { useAppStore } from "@/lib/store/useAppStore";

// The rider-side counterpart to useSellerIdentityStore: a real, persisted
// phone -> rider id mapping, created the first time a phone picks "Deliver"
// at /auth/role-selector. Everything rider-specific (jobs, earnings, cash
// held) is keyed by this id from the start, so two riders on one device
// never see each other's data — the mistake the seller-side stores had to
// be migrated away from.
//
// Unlike sellers there is no demo/fixture rider: every rider starts empty.
export type RiderVehicle = "motorbike" | "bicycle" | "car";

export const riderVehicles: { value: RiderVehicle; label: string }[] = [
  { value: "motorbike", label: "Motorbike" },
  { value: "bicycle", label: "Bicycle" },
  { value: "car", label: "Car" },
];

export type RiderIdentity = {
  id: string;
  phone: string;
  name: string;
  vehicle: RiderVehicle;
  area: string; // one of serviceAreas' names
  tripsCompleted: number;
  rating: number | null; // null until a buyer has rated a delivery
};

export type NewRiderInput = {
  name: string;
  vehicle: RiderVehicle;
  area: string;
};

type RiderIdentityState = {
  // Keyed by phone, same lookup direction as the seller identity store.
  identitiesByPhone: Record<string, RiderIdentity>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  // Returns the existing rider id for `phone`, or creates one from `input`.
  getOrCreateRiderId: (phone: string, input: NewRiderInput) => string;
  // Called by the delivery side when a delivery is completed.
  recordCompletedTrip: (riderId: string) => void;
};

let riderCounter = 0;
function nextRiderId() {
  riderCounter += 1;
  return `r${Date.now()}-${riderCounter}`;
}

export const useRiderIdentityStore = create<RiderIdentityState>()(
  persist(
    (set, get) => ({
      identitiesByPhone: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      getOrCreateRiderId: (phone, input) => {
        const existing = get().identitiesByPhone[phone];
        if (existing) return existing.id;

        const knownArea = serviceAreas.some((a) => a.name === input.area);
        const identity: RiderIdentity = {
          id: nextRiderId(),
          phone,
          name: input.name.trim() || "Rider",
          vehicle: input.vehicle,
          area: knownArea ? input.area : serviceAreas[0].name,
          tripsCompleted: 0,
          rating: null,
        };
        set((state) => ({
          identitiesByPhone: { ...state.identitiesByPhone, [phone]: identity },
        }));
        return identity.id;
      },

      recordCompletedTrip: (riderId) =>
        set((state) => {
          const entry = Object.entries(state.identitiesByPhone).find(([, r]) => r.id === riderId);
          if (!entry) return state;
          const [phone, rider] = entry;
          return {
            identitiesByPhone: {
              ...state.identitiesByPhone,
              [phone]: { ...rider, tripsCompleted: rider.tripsCompleted + 1 },
            },
          };
        }),
    }),
    {
      name: "grapplive-rider-identity",
      storage: safeJSONStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Non-hook accessor for use inside other stores' action bodies, same role
// as getCurrentSellerIdSync. Unlike that one there's no demo fallback, so
// it returns null when the signed-in phone has no rider identity.
export function getCurrentRiderIdSync(): string | null {
  const phone = useAppStore.getState().phone;
  return phone ? useRiderIdentityStore.getState().identitiesByPhone[phone]?.id ?? null : null;
}

// Look a rider up by id (the delivery side only has ids).
export function getRiderByIdSync(riderId: string): RiderIdentity | undefined {
  return Object.values(useRiderIdentityStore.getState().identitiesByPhone).find(
    (r) => r.id === riderId
  );
}
