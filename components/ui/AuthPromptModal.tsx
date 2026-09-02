"use client";

import { useRouter } from "next/navigation";
import { useAuthModalStore } from "@/lib/store/useAuthModalStore";

export function AuthPromptModal() {
  const router = useRouter();
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const close = useAuthModalStore((s) => s.close);

  if (!isOpen) return null;

  const handleSignIn = () => {
    close();
    router.push("/auth/signup");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="w-full max-w-[480px] md:max-w-[380px] bg-white rounded-t-2xl md:rounded-2xl p-5 pb-6">
        <h2 className="text-[14px] font-semibold text-gl-text mb-1">Sign in to continue</h2>
        <p className="text-[11px] text-gl-text-secondary mb-4">
          You&apos;ll need an account to do this — it only takes a moment.
        </p>
        <button
          onClick={handleSignIn}
          className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold mb-2 active:opacity-80 transition-opacity"
        >
          Sign in / Sign up
        </button>
        <button
          onClick={close}
          className="w-full text-gl-text-secondary text-[11px] py-1.5 active:opacity-60 transition-opacity"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
