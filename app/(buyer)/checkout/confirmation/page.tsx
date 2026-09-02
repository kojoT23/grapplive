"use client";

import { useRouter } from "next/navigation";
import { IconCircleCheck } from "@tabler/icons-react";

export default function CheckoutConfirmationPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <IconCircleCheck size={48} className="text-gl-green mb-4" />
      <h1 className="text-[15px] font-semibold text-gl-text mb-1.5">Order placed</h1>
      <p className="text-[11px] text-gl-text-secondary mb-6">
        The seller has been notified. You&apos;ll get updates as your order moves along.
      </p>
      <button
        onClick={() => router.push("/home")}
        className="bg-gl-brand text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg active:opacity-80 transition-opacity"
      >
        Back to Home
      </button>
    </div>
  );
}
