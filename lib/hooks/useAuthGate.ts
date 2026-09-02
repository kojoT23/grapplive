"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { useAuthModalStore } from "@/lib/store/useAuthModalStore";

/**
 * Wraps any action that requires a signed-in user.
 * If the guest isn't verified, shows the sign-in modal instead of running the action.
 */
export function useAuthGate() {
  const isVerified = useAppStore((s) => s.isVerified);
  const openModal = useAuthModalStore((s) => s.open);

  return function requireAuth(action: () => void) {
    if (isVerified) {
      action();
    } else {
      openModal();
    }
  };
}
