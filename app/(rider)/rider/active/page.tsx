"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCash, IconNavigation, IconPhone } from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCurrentRider } from "@/lib/hooks/useCurrentRider";
import { riderTabs } from "@/lib/nav/rider-tabs";
import { isValidPin, mapsDirectionsLink } from "@/lib/mock-data/deliveryDetails";
import { useDeliveryStore, activeDeliveryFor } from "@/lib/store/useDeliveryStore";
import {
  NEXT_STEP,
  OTP_MAX_ATTEMPTS,
  failureReasonLabels,
  failureReasonsFor,
  type Delivery,
  type DeliveryStatus,
  type FailureReason,
} from "@/lib/mock-data/deliveries";

// What the rider is being asked to do at each step.
const stepTitle: Partial<Record<DeliveryStatus, string>> = {
  heading_to_pickup: "Go to the seller",
  at_pickup: "Collect the order",
  out_for_delivery: "Deliver to the customer",
  at_dropoff: "Confirm delivery",
};

function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query}, Ghana`)}`;
}

function whatsappLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export default function RiderActivePage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth("deliver");
  const { rider, hasHydrated: riderHydrated } = useCurrentRider();
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const deliveriesHydrated = useDeliveryStore((s) => s.hasHydrated);
  const advance = useDeliveryStore((s) => s.advance);
  const completeDelivery = useDeliveryStore((s) => s.completeDelivery);
  const reportFailure = useDeliveryStore((s) => s.reportFailure);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showFailure, setShowFailure] = useState(false);
  const [finishedId, setFinishedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (isChecking || !riderHydrated || !deliveriesHydrated) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }
  if (!rider) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-[12px] text-gl-text-secondary mb-3">Set up your rider profile first.</p>
        <Link href="/rider" className="text-[12px] font-semibold text-gl-brand active:opacity-60">
          Continue
        </Link>
      </div>
    );
  }

  const active = activeDeliveryFor(deliveries, rider.id);
  const finished: Delivery | undefined = finishedId
    ? deliveries.find((d) => d.id === finishedId)
    : undefined;

  const shell = (children: React.ReactNode) => (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">Active delivery</h1>
      {children}
      <TabBar tabs={riderTabs} activeHref="/rider/active" />
    </div>
  );

  if (finished && finished.status === "delivered") {
    return shell(
      <div className="mx-3 md:mx-5 border-[1.5px] border-gl-green rounded-lg px-4 py-6 text-center">
        <div className="text-[13px] font-semibold text-gl-text mb-1">Delivered ✓</div>
        <div className="text-[11px] text-gl-text-secondary mb-4">
          You earned GHS {finished.feeGHS} for this delivery.
        </div>
        <Link
          href="/rider"
          className="block w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-90"
        >
          Back to jobs
        </Link>
      </div>
    );
  }

  if (!active) {
    return shell(
      <div className="mx-3 md:mx-5 border border-dashed border-gl-border-strong rounded-lg px-4 py-8 text-center">
        <div className="text-[12px] font-semibold text-gl-text mb-1">No active delivery</div>
        <div className="text-[10px] text-gl-text-secondary mb-3">Accept a request to start one.</div>
        <Link href="/rider" className="text-[11px] font-semibold text-gl-brand active:opacity-60">
          Go to jobs
        </Link>
      </div>
    );
  }

  const step = NEXT_STEP[active.status];
  const failureReasons = failureReasonsFor(active.status);
  const locked = active.otpAttempts >= OTP_MAX_ATTEMPTS;

  const handleAdvance = () => advance(active.id, rider.id);

  const handleConfirm = () => {
    const result = completeDelivery(active.id, rider.id, otp);
    if (result === "ok") {
      setFinishedId(active.id);
      setOtp("");
      setOtpError("");
    } else if (result === "wrong_otp") {
      setOtpError(`That code is wrong. ${OTP_MAX_ATTEMPTS - active.otpAttempts - 1} tries left.`);
    } else if (result === "locked") {
      setOtpError("Too many wrong tries. Contact GRAPPlive support to complete this delivery.");
    } else {
      setOtpError("This delivery can't be completed right now.");
    }
  };

  const handleFailure = (reason: FailureReason) => {
    if (reportFailure(active.id, rider.id, reason) === "ok") router.push("/rider");
  };

  return shell(
    <>
      <div className="mx-3 md:mx-5 mb-3 border-[1.5px] border-gl-brand rounded-lg px-3 py-2.5 bg-gl-brand-soft-bg">
        <div className="text-[9px] text-gl-brand-soft-text mb-0.5">NEXT</div>
        <div className="text-[13px] font-semibold text-gl-text">{stepTitle[active.status]}</div>
      </div>

      <div className="mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3">
        <div className="text-[9px] text-gl-text-secondary mb-0.5">Pickup · {active.pickupKm} km</div>
        <div className="text-[12px] font-semibold text-gl-text">{active.sellerName}</div>
        <div className="text-[10px] text-gl-text-secondary mb-2">{active.pickupArea}</div>
        <a
          href={mapsLink(`${active.sellerName} ${active.pickupArea}`)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-gl-brand active:opacity-60"
        >
          <IconNavigation size={14} /> Navigate
        </a>
      </div>

      <div className="mx-3 md:mx-5 mb-2 border border-gl-border rounded-lg p-3">
        <div className="text-[9px] text-gl-text-secondary mb-0.5">Drop-off · {active.dropoffKm} km</div>
        {active.customerName && (
          <div className="text-[12px] font-semibold text-gl-text">{active.customerName}</div>
        )}
        <div className="text-[11px] text-gl-text">{active.dropoffArea}</div>
        {active.digitalAddress && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[13px] font-bold tracking-wide text-gl-text">{active.digitalAddress}</span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(active.digitalAddress ?? "");
                setCopied(true);
              }}
              className="text-[10px] font-semibold text-gl-brand active:opacity-60"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
        {active.landmark && (
          <div className="text-[11px] text-gl-text mt-1">{active.landmark}</div>
        )}
        {isValidPin(active.pin) && (
          <div className="text-[10px] text-gl-text-secondary mt-1">
            📍 Customer shared their location (within {active.pin.accuracyM} m)
          </div>
        )}
        {!active.digitalAddress && !active.landmark && !isValidPin(active.pin) && (
          <div className="text-[10px] text-gl-amber mt-1">
            No address details on this order — call the customer to find them.
          </div>
        )}
        <div className="text-[10px] text-gl-text-secondary mt-1 mb-2">
          {active.customerPhone || "No customer phone on this order"}
        </div>
        <div className="flex gap-4">
          <a
            href={
              isValidPin(active.pin)
                ? mapsDirectionsLink(active.pin)
                : mapsLink(`${active.landmark ?? ""} ${active.dropoffArea}`.trim())
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gl-brand active:opacity-60"
          >
            <IconNavigation size={14} /> Navigate
          </a>
          {active.customerPhone && (
            <>
              <a
                href={`tel:${active.customerPhone}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gl-brand active:opacity-60"
              >
                <IconPhone size={14} /> Call
              </a>
              <a
                href={whatsappLink(active.customerPhone)}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-gl-brand active:opacity-60"
              >
                WhatsApp
              </a>
            </>
          )}
        </div>
      </div>

      <div className="mx-3 md:mx-5 mb-3 flex items-center justify-between text-[11px]">
        <span className="text-gl-text-secondary">You earn</span>
        <span className="font-semibold text-gl-text">GHS {active.feeGHS}</span>
      </div>
      {active.codAmountGHS > 0 && (
        <div className="mx-3 md:mx-5 mb-3 flex items-center gap-1.5 text-[11px] font-semibold text-gl-amber">
          <IconCash size={14} /> Collect GHS {active.codAmountGHS} in cash from the customer
        </div>
      )}

      {active.status === "at_dropoff" ? (
        <div className="mx-3 md:mx-5">
          <label className="text-[10px] text-gl-text-secondary mb-1.5 block">
            Ask the customer for their 4-digit delivery code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              setOtpError("");
            }}
            disabled={locked}
            placeholder="• • • •"
            className="w-full border border-gl-border-strong rounded-lg px-3 py-2.5 text-[18px] tracking-[0.4em] text-center text-gl-text outline-none mb-1 transition-colors focus:border-gl-brand disabled:opacity-50"
          />
          {otpError && <p className="text-[10px] text-gl-red mb-2">{otpError}</p>}
          <button
            onClick={handleConfirm}
            disabled={otp.length !== 4 || locked}
            className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold mt-1 transition-opacity active:opacity-90 disabled:opacity-40"
          >
            Confirm delivery
          </button>
        </div>
      ) : (
        step && (
          <div className="mx-3 md:mx-5">
            <button
              onClick={handleAdvance}
              className="w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-90"
            >
              {step.buttonLabel}
            </button>
          </div>
        )
      )}

      {failureReasons.length > 0 && (
        <div className="mx-3 md:mx-5 mt-3">
          {showFailure ? (
            <div className="border border-gl-border rounded-lg p-3">
              <div className="text-[11px] font-semibold text-gl-text mb-2">What went wrong?</div>
              {failureReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleFailure(reason)}
                  className="w-full text-left text-[12px] text-gl-text py-2 border-b border-gl-bg-muted last:border-b-0 active:bg-gl-bg-muted"
                >
                  {failureReasonLabels[reason]}
                </button>
              ))}
              <button
                onClick={() => setShowFailure(false)}
                className="w-full text-center text-[11px] text-gl-text-secondary pt-2.5 active:opacity-60"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowFailure(true)}
              className="w-full text-gl-red text-[12px] font-semibold py-2 active:opacity-60"
            >
              Can&apos;t complete this delivery
            </button>
          )}
        </div>
      )}
    </>
  );
}
