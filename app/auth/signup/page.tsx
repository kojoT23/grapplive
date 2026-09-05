"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";

export default function SignupPhonePage() {
  const router = useRouter();
  const setPhone = useAppStore((s) => s.setPhone);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const isValid = /^\d{9,10}$/.test(value.replace(/\s/g, ""));

  const handleSubmit = () => {
    if (!isValid) {
      setError("Enter a valid phone number");
      return;
    }
    setError("");
    setPhone(`+233${value.replace(/\s/g, "")}`);
    router.push("/auth/otp");
  };

  return (
    <div className="px-5 pt-7 pb-5">
      <h1 className="text-[18px] font-semibold text-gl-text text-center mb-1">
        GRAPPlive
      </h1>
      <p className="text-[11px] text-gl-text-secondary text-center mb-7">
        Buy it. Try it. Zoom it. Live.
      </p>
      <h2 className="text-[13px] font-semibold text-gl-text mb-1">
        What&apos;s your number?
      </h2>
      <p className="text-[10px] text-gl-text-secondary mb-3">
        We&apos;ll text you a code to verify it&apos;s you
      </p>
      <div className="flex items-center border border-gl-border-strong rounded-lg px-3 py-2.5 mb-1 transition-colors focus-within:border-gl-brand">
        <span className="text-[12px] text-gl-text mr-2">+233</span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="24 123 4567"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-[12px] text-gl-text placeholder:text-gl-text-muted flex-1 outline-none"
        />
      </div>
      {error && <p className="text-[10px] text-gl-red mb-3">{error}</p>}
      {!error && <div className="mb-4" />}
      <button
        onClick={handleSubmit}
        className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold mb-3 transition-transform active:scale-[0.98] active:opacity-90"
      >
        Send code
      </button>
      <p className="text-[9px] text-gl-text-muted text-center">
        By continuing you agree to the{" "}
        <Link href="/legal/terms" className="underline active:opacity-60 transition-opacity">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline active:opacity-60 transition-opacity">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
