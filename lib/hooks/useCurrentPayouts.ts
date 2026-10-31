import { useCallback, useMemo } from "react";
import { useCurrentSellerId } from "@/lib/hooks/useCurrentSellerId";
import { usePayoutsStore, seedPayoutsFor } from "@/lib/store/usePayoutsStore";

// The one way components read/act on the signed-in seller's payouts
// (balance, MoMo number, history). Resolves to whichever seller
// useCurrentSellerId() says is signed in, falling back to that seller's seed
// until something has been saved. Values stay referentially stable between
// renders unless the underlying data changed.
export function useCurrentPayouts() {
  const sellerId = useCurrentSellerId();
  const stored = usePayoutsStore((s) => s.payoutsBySeller[sellerId]);
  const hasHydrated = usePayoutsStore((s) => s.hasHydrated);
  const requestPayoutFor = usePayoutsStore((s) => s.requestPayout);
  const updateMomoNumberFor = usePayoutsStore((s) => s.updateMomoNumber);

  const payouts = useMemo(() => stored ?? seedPayoutsFor(sellerId), [stored, sellerId]);

  const requestPayout = useCallback(() => requestPayoutFor(sellerId), [requestPayoutFor, sellerId]);
  const updateMomoNumber = useCallback(
    (maskedNumber: string) => updateMomoNumberFor(sellerId, maskedNumber),
    [updateMomoNumberFor, sellerId]
  );

  return {
    balanceGHS: payouts.balanceGHS,
    momoDetails: payouts.momoDetails,
    history: payouts.history,
    hasHydrated,
    requestPayout,
    updateMomoNumber,
  };
}
