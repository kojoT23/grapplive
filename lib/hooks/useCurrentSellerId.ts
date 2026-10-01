import { useAppStore } from "@/lib/store/useAppStore";
import { useSellerIdentityStore, DEMO_SELLER_ID } from "@/lib/store/useSellerIdentityStore";

// Reactive counterpart to useSellerIdentityStore's getCurrentSellerIdSync
// — use this in components/pages, that one inside other stores' actions.
// Same fallback behavior: resolves to the demo seller (s1) if there's no
// mapped identity yet for the current phone, so existing persisted
// sessions from before useSellerIdentityStore existed keep seeing s1's
// data exactly as before, rather than being treated as a new, empty
// seller.
export function useCurrentSellerId(): string {
  const phone = useAppStore((s) => s.phone);
  const identity = useSellerIdentityStore((s) => (phone ? s.identitiesByPhone[phone] : undefined));
  return identity?.id ?? DEMO_SELLER_ID;
}
