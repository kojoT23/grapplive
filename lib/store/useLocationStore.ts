import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import { nearestServiceArea } from "@/lib/mock-data/serviceAreas";

// ROADMAP.md §9.2: the home page's location button used to be a static
// "Accra" label with nothing behind it — not even reflecting where the
// buyer actually is, let alone that GRAPPlive only delivers to a few
// cities so far. This store makes it real: GPS-detected where possible
// (matched against the known service areas, see serviceAreas.ts), with a
// manual picker as the fallback for denied/unavailable GPS or a
// genuinely out-of-coverage position — since we can't cover everywhere
// at once, pretending otherwise would be worse than just saying so.
export type LocationStatus =
  | "unset" // never asked, nothing selected yet
  | "detecting"
  | "resolved" // a covered area is selected (via GPS or manual pick)
  | "outside_coverage" // GPS succeeded but nowhere covered is nearby
  | "denied" // browser permission denied
  | "unsupported"; // no geolocation API in this browser

type LocationState = {
  areaName: string | null;
  status: LocationStatus;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  detectLocation: () => void;
  selectAreaManually: (areaName: string) => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      areaName: null,
      status: "unset",
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      detectLocation: () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          set({ status: "unsupported" });
          return;
        }

        set({ status: "detecting" });

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const area = nearestServiceArea(
              position.coords.latitude,
              position.coords.longitude
            );
            if (area) {
              set({ areaName: area.name, status: "resolved" });
            } else {
              set({ areaName: null, status: "outside_coverage" });
            }
          },
          (error) => {
            // PERMISSION_DENIED is code 1; any other failure (timeout,
            // position unavailable) is treated the same way here, since
            // the fallback — manual selection — is identical either way.
            set({ status: error.code === 1 ? "denied" : "unsupported" });
          },
          { timeout: 10000, maximumAge: 5 * 60 * 1000 }
        );
      },

      selectAreaManually: (areaName) => set({ areaName, status: "resolved" }),
    }),
    {
      name: "grapplive-location",
      storage: safeJSONStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
