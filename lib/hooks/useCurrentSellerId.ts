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

// The shop name the signed-in seller entered at signup (or, for the demo
// seller, their fixture name). getSellerById can't supply this for a
// seller created at runtime — it only knows sellers baked into the static
// fixtures — so a new seller's own storefront would otherwise fall back
// to a generic "My Store" and never show the name they just typed.
export function useCurrentSellerName(): string | undefined {
  const phone = useAppStore((s) => s.phone);
  return useSellerIdentityStore((s) => (phone ? s.identitiesByPhone[phone]?.name : undefined));
}
