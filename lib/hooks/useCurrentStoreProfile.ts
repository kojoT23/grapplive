import { useCallback, useMemo } from "react";
import { useCurrentSellerId } from "@/lib/hooks/useCurrentSellerId";
import { useStoreProfileStore, seedProfileFor } from "@/lib/store/useStoreProfileStore";
import type { StoreSocials } from "@/lib/mock-data/stores";

// The one way components read/edit the signed-in seller's storefront
// profile (about, socials, logo, banner). Resolves to whichever seller
// useCurrentSellerId() says is signed in, falling back to that seller's
// seed (their static Store record, or blank for a brand-new seller) until
// they've saved an edit.
//
// Everything returned is referentially stable between renders unless the
// underlying data actually changed — EditStorefrontSheet resets its form
// from these values in an effect, so a fresh object every render would
// make that effect fire constantly and wipe whatever's being typed.
export function useCurrentStoreProfile() {
  const sellerId = useCurrentSellerId();
  const stored = useStoreProfileStore((s) => s.profiles[sellerId]);
  const hasHydrated = useStoreProfileStore((s) => s.hasHydrated);
  const updateAboutFor = useStoreProfileStore((s) => s.updateAbout);
  const updateSocialsFor = useStoreProfileStore((s) => s.updateSocials);
  const updateLogoFor = useStoreProfileStore((s) => s.updateLogo);
  const updateBannerFor = useStoreProfileStore((s) => s.updateBanner);

  const profile = useMemo(() => stored ?? seedProfileFor(sellerId), [stored, sellerId]);

  const updateAbout = useCallback(
    (about: string) => updateAboutFor(sellerId, about),
    [updateAboutFor, sellerId]
  );
  const updateSocials = useCallback(
    (socials: StoreSocials) => updateSocialsFor(sellerId, socials),
    [updateSocialsFor, sellerId]
  );
  const updateLogo = useCallback(
    (dataUrl: string | null) => updateLogoFor(sellerId, dataUrl),
    [updateLogoFor, sellerId]
  );
  const updateBanner = useCallback(
    (dataUrl: string | null) => updateBannerFor(sellerId, dataUrl),
    [updateBannerFor, sellerId]
  );

  return {
    about: profile.about,
    socials: profile.socials,
    logoDataUrl: profile.logoDataUrl,
    bannerDataUrl: profile.bannerDataUrl,
    hasHydrated,
    updateAbout,
    updateSocials,
    updateLogo,
    updateBanner,
  };
}
