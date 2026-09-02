"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";

export default function OtpPage() {
  const router = useRouter();
  const phone = useAppStore((s) => s.phone);
  const verifyOtp = useAppStore((s) => s.verifyOtp);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    if (verifyOtp(code)) {
      router.push("/auth/role-selector");
    } else {
      setError("Enter the code we sent you");
    }
  };

  return (
    <div className="px-5 pt-7 pb-5">
      <h2 className="text-[13px] font-semibold text-gl-text mb-1">
        Enter the code
      </h2>
      <p className="text-[10px] text-gl-text-secondary mb-4">
        Sent to {phone || "your number"} · any code works in this prototype
      </p>

      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="0000"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[16px] tracking-[6px] text-center text-gl-text outline-none mb-1 transition-colors focus:border-gl-brand"
      />
      {error && <p className="text-[10px] text-gl-red mb-3">{error}</p>}
      {!error && <div className="mb-4" />}

      <button
        onClick={handleVerify}
        className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold transition-transform active:scale-[0.98] active:opacity-90"
      >
        Verify
      </button>
    </div>
  );
}
