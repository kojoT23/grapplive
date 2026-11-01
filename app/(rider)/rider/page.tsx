"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCash } from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCurrentRider } from "@/lib/hooks/useCurrentRider";
import { useSecondsUntil } from "@/lib/hooks/useSecondsUntil";
import { riderTabs } from "@/lib/nav/rider-tabs";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { useCashLedgerStore, heldTotal } from "@/lib/store/useCashLedgerStore";
import { CASH_HOLD_LIMIT_GHS } from "@/lib/mock-data/cash";
import {
  useDeliveryStore,
  activeDeliveryFor,
  openOffersFor,
} from "@/lib/store/useDeliveryStore";
import { OFFER_SECONDS, type Delivery } from "@/lib/mock-data/deliveries";

function OfferCard({ delivery, riderId }: { delivery: Delivery; riderId: string }) {
  const router = useRouter();
  const markOfferSeen = useDeliveryStore((s) => s.markOfferSeen);
  const declineOffer = useDeliveryStore((s) => s.declineOffer);
  const acceptOffer = useDeliveryStore((s) => s.acceptOffer);
  const [message, setMessage] = useState("");

  // The 30s starts the first time THIS rider's screen shows the offer, and
  // is remembered so reloading the page doesn't restart it.
  const seenAt = delivery.offerSeenAt[riderId] ?? null;
  useEffect(() => {
    if (seenAt === null) markOfferSeen(delivery.id, riderId, Date.now());
  }, [seenAt, markOfferSeen, delivery.id, riderId]);

  const secondsLeft = useSecondsUntil(seenAt === null ? null : seenAt + OFFER_SECONDS * 1000);
  useEffect(() => {
    if (secondsLeft === 0) declineOffer(delivery.id, riderId); // expired
  }, [secondsLeft, declineOffer, delivery.id, riderId]);

  const shown = secondsLeft ?? OFFER_SECONDS;

  const handleAccept = () => {
    const result = acceptOffer(delivery.id, riderId);
    if (result === "ok") router.push("/rider/active");
    else if (result === "busy") setMessage("Finish your current delivery first.");
    else if (result === "offline") setMessage("Go online to accept jobs.");
    else if (result === "cash_limit")
      setMessage("You're holding too much cash. Hand it over (Earnings tab) before taking new jobs.");
    else setMessage("This job is no longer available.");
  };

  return (
    <div className="mx-3 md:mx-5 border-[1.5px] border-gl-brand rounded-lg p-3 bg-gl-brand-soft-bg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-semibold text-gl-brand-soft-text">NEW DELIVERY REQUEST</span>
        <span className="text-[11px] font-semibold text-gl-text">{shown}s</span>
      </div>
      <div className="h-1 rounded-full bg-gl-border mb-3 overflow-hidden">
        <div
          className="h-full bg-gl-brand transition-[width] duration-1000 ease-linear"
          style={{ width: `${(shown / OFFER_SECONDS) * 100}%` }}
        />
      </div>

      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[9px] text-gl-text-secondary">Pickup · {delivery.pickupKm} km away</div>
          <div className="text-[12px] font-semibold text-gl-text">{delivery.sellerName}</div>
          <div className="text-[10px] text-gl-text-secondary mb-2">{delivery.pickupArea}</div>
          <div className="text-[9px] text-gl-text-secondary">Drop-off · {delivery.dropoffKm} km trip</div>
          <div className="text-[12px] font-semibold text-gl-text">{delivery.dropoffArea}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-gl-text-secondary">You earn</div>
          <div className="text-[16px] font-bold text-gl-text">GHS {delivery.feeGHS}</div>
          {delivery.codAmountGHS > 0 && (
            <div className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-gl-amber">
              <IconCash size={12} /> Collect GHS {delivery.codAmountGHS}
            </div>
          )}
        </div>
      </div>

      {message && <p className="text-[10px] text-gl-red mb-2">{message}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => declineOffer(delivery.id, riderId)}
          className="flex-1 border border-gl-border-strong text-gl-text text-[12px] font-semibold py-2.5 rounded-lg active:bg-gl-bg-muted transition-colors"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="flex-[2] bg-gl-brand text-white text-[12px] font-semibold py-2.5 rounded-lg active:opacity-90 transition-opacity"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

export default function RiderJobsPage() {
  const { isChecking } = useRequireAuth("deliver");
  const { rider, hasHydrated: riderHydrated } = useCurrentRider();
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const deliveriesHydrated = useDeliveryStore((s) => s.hasHydrated);
  const statusHydrated = useRiderStore((s) => s.hasHydrated);
  const cashEntries = useCashLedgerStore((s) => s.entries);
  const ledgerHydrated = useCashLedgerStore((s) => s.hasHydrated);
  const online = useRiderStore((s) => (rider ? s.onlineByRider[rider.id] === true : false));
  const setOnline = useRiderStore((s) => s.setOnline);

  if (isChecking || !riderHydrated || !deliveriesHydrated || !statusHydrated || !ledgerHydrated) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  // Signed in with the "deliver" role but no rider profile on this phone
  // (role selector normally creates it before routing here).
  if (!rider) {
    return (
      <div className="px-5 pt-8">
        <h1 className="text-[14px] font-semibold text-gl-text mb-1">Finish setting up</h1>
        <p className="text-[11px] text-gl-text-secondary mb-4">
          Add your name, vehicle and area to start delivering.
        </p>
        <Link
          href="/auth/role-selector"
          className="block text-center w-full bg-gl-brand text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-90"
        >
          Continue
        </Link>
      </div>
    );
  }

  const active = activeDeliveryFor(deliveries, rider.id);
  const heldCash = heldTotal(cashEntries, rider.id);
  const offer = online && !active ? openOffersFor(deliveries, rider.id, rider.area)[0] : undefined;

  return (
    <div className="pb-16">
      <div className="px-3 md:px-5 pt-3.5 pb-2">
        <div className="text-[13px] text-gl-text-secondary">Rider</div>
        <div className="text-[15px] font-semibold text-gl-text">{rider.name}</div>
      </div>

      <div className="mx-3 md:mx-5 mb-3 flex items-center justify-between border border-gl-border rounded-lg px-3 py-2.5">
        <div>
          <div className="text-[12px] font-semibold text-gl-text">
            {online ? "You're online" : "You're offline"}
          </div>
          <div className="text-[10px] text-gl-text-secondary">
            {active
              ? "Finish your delivery to change this"
              : online
                ? `Looking for requests in ${rider.area}`
                : "Go online to receive delivery requests"}
          </div>
        </div>
        <button
          onClick={() => setOnline(rider.id, !online)}
          disabled={Boolean(active)}
          aria-pressed={online}
          className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition-colors disabled:opacity-40 ${
            online ? "bg-gl-green text-white" : "bg-gl-bg-muted text-gl-text active:bg-gl-border"
          }`}
        >
          {online ? "Online" : "Go online"}
        </button>
      </div>

      {heldCash > 0 && (
        <Link
          href="/rider/earnings"
          className={`block mx-3 md:mx-5 mb-3 border rounded-lg px-3 py-2.5 active:opacity-90 ${
            heldCash >= CASH_HOLD_LIMIT_GHS ? "border-gl-amber bg-gl-bg-muted" : "border-gl-border"
          }`}
        >
          <div className="text-[10px] font-semibold text-gl-text">
            You&apos;re holding GHS {heldCash.toLocaleString("en-GH")} in cash
          </div>
          <div className="text-[9px] text-gl-text-secondary">
            {heldCash >= CASH_HOLD_LIMIT_GHS
              ? "At the limit — hand it over to take new jobs"
              : "Hand it to the seller and mark it on the Earnings tab"}
          </div>
        </Link>
      )}

      <div className="mx-3 md:mx-5 mb-3 grid grid-cols-3 gap-2">
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Trips</div>
          <div className="text-[14px] font-semibold text-gl-text">{rider.tripsCompleted}</div>
        </div>
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Rating</div>
          <div className="text-[14px] font-semibold text-gl-text">
            {rider.rating === null ? "—" : rider.rating.toFixed(1)}
          </div>
        </div>
        <div className="border border-gl-border rounded-lg px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-0.5">Area</div>
          <div className="text-[14px] font-semibold text-gl-text">{rider.area}</div>
        </div>
      </div>

      {active ? (
        <Link
          href="/rider/active"
          className="block mx-3 md:mx-5 border-[1.5px] border-gl-brand rounded-lg px-4 py-3 bg-gl-brand-soft-bg active:opacity-90"
        >
          <div className="text-[10px] font-semibold text-gl-brand-soft-text mb-0.5">DELIVERY IN PROGRESS</div>
          <div className="text-[12px] text-gl-text">
            {active.sellerName} → {active.dropoffArea}
          </div>
        </Link>
      ) : offer ? (
        <OfferCard key={offer.id} delivery={offer} riderId={rider.id} />
      ) : (
        <div className="mx-3 md:mx-5 border border-dashed border-gl-border-strong rounded-lg px-4 py-8 text-center">
          <div className="text-[12px] font-semibold text-gl-text mb-1">
            {online ? "Waiting for requests" : "You're offline"}
          </div>
          <div className="text-[10px] text-gl-text-secondary">
            {online
              ? "New delivery requests near you will pop up here."
              : "Go online and requests will show up here."}
          </div>
        </div>
      )}

      <TabBar tabs={riderTabs} activeHref="/rider" />
    </div>
  );
}
