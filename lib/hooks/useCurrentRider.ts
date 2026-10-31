import { useAppStore } from "@/lib/store/useAppStore";
import { useRiderIdentityStore, type RiderIdentity } from "@/lib/store/useRiderIdentityStore";

// The signed-in phone's rider identity, or undefined if that phone has
// never set one up (e.g. a shopper who hasn't picked "Deliver" yet).
// hasHydrated lets pages tell "not loaded yet" apart from "doesn't exist".
export function useCurrentRider(): { rider: RiderIdentity | undefined; hasHydrated: boolean } {
  const phone = useAppStore((s) => s.phone);
  const rider = useRiderIdentityStore((s) => (phone ? s.identitiesByPhone[phone] : undefined));
  const hasHydrated = useRiderIdentityStore((s) => s.hasHydrated);
  return { rider, hasHydrated };
}
