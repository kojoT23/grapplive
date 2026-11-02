import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import {
  ACTIVE_DELIVERY_STATUSES,
  NEXT_STEP,
  OTP_MAX_ATTEMPTS,
  estimateTrip,
  failureReasonLabels,
  failureReasonsFor,
  type Delivery,
  type DeliveryStatus,
  type FailureReason,
} from "@/lib/mock-data/deliveries";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useRiderStore } from "@/lib/store/useRiderStore";
import { useCashLedgerStore, heldTotal } from "@/lib/store/useCashLedgerStore";
import { CASH_HOLD_LIMIT_GHS } from "@/lib/mock-data/cash";
import type { DeliveryPin } from "@/lib/mock-data/deliveryDetails";
import { getRiderByIdSync, useRiderIdentityStore } from "@/lib/store/useRiderIdentityStore";

// The prototype's stand-in for the dispatch backend. Deliveries are shared
// between sellers (who request them), riders (who accept and run them) and
// buyers (who watch them), so unlike the per-seller stores this one holds
// everyone's. Every status change goes through the checked actions below —
// the client never sets an arbitrary status (AGENTS.md §9) — and each one
// that matters also moves the ORDER along (useOrdersStore.applyDeliveryUpdate).
// When a real backend exists these actions become API calls that do the
// same checks server-side.

export type NewDeliveryInput = {
  orderGroupId: string;
  sellerId: string;
  sellerName: string;
  pickupArea: string;
  dropoffArea: string;
  customerPhone: string;
  customerName?: string;
  digitalAddress?: string;
  landmark?: string;
  pin?: DeliveryPin;
  codAmountGHS: number;
};

export type AcceptResult = "ok" | "gone" | "busy" | "offline" | "unknown_rider" | "cash_limit";
export type StepResult = "ok" | "invalid";
export type CompleteResult = "ok" | "wrong_otp" | "locked" | "invalid";

type DeliveryState = {
  deliveries: Delivery[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  createDelivery: (input: NewDeliveryInput) => Delivery;
  markOfferSeen: (deliveryId: string, riderId: string, at: number) => void;
  declineOffer: (deliveryId: string, riderId: string) => void;
  acceptOffer: (deliveryId: string, riderId: string) => AcceptResult;
  advance: (deliveryId: string, riderId: string) => StepResult;
  completeDelivery: (deliveryId: string, riderId: string, otp: string) => CompleteResult;
  reportFailure: (deliveryId: string, riderId: string, reason: FailureReason) => StepResult;
};

// ---- Selectors (pure, so pages and tests can use them on any list) ----

// The newest delivery for an order group (a failed one can be re-requested,
// which creates a fresh record; the old one stays as history).
export function latestDeliveryForGroup(
  deliveries: Delivery[],
  groupId: string
): Delivery | undefined {
  return deliveries
    .filter((d) => d.orderGroupId === groupId)
    .reduce<Delivery | undefined>((latest, d) => (!latest || d.createdAt >= latest.createdAt ? d : latest), undefined);
}

export function activeDeliveryFor(deliveries: Delivery[], riderId: string): Delivery | undefined {
  return deliveries.find((d) => d.riderId === riderId && ACTIVE_DELIVERY_STATUSES.includes(d.status));
}

// Offers a rider can currently see: still open, in their area, and not
// already declined (or expired) by them. Oldest first.
export function openOffersFor(deliveries: Delivery[], riderId: string, riderArea: string): Delivery[] {
  return deliveries
    .filter(
      (d) => d.status === "offered" && d.pickupArea === riderArea && !d.declinedBy.includes(riderId)
    )
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function historyFor(deliveries: Delivery[], riderId: string): Delivery[] {
  return deliveries
    .filter((d) => d.riderId === riderId && (d.status === "delivered" || d.status === "failed"))
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ---- Store ----

function nextDeliveryId(existing: Delivery[]): string {
  const max = existing.reduce((m, d) => {
    const match = d.id.match(/^d(\d+)$/);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `d${max + 1}`;
}

function newOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function patchDelivery(
  deliveries: Delivery[],
  id: string,
  patch: (d: Delivery) => Delivery
): Delivery[] {
  return deliveries.map((d) => (d.id === id ? patch(d) : d));
}

function withStatus(d: Delivery, status: DeliveryStatus): Delivery {
  return { ...d, status, history: [...d.history, { status, at: Date.now() }] };
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      deliveries: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      createDelivery: (input) => {
        const existing = get().deliveries;
        const trip = estimateTrip(input.orderGroupId);
        const now = Date.now();
        const delivery: Delivery = {
          id: nextDeliveryId(existing),
          orderGroupId: input.orderGroupId,
          sellerId: input.sellerId,
          sellerName: input.sellerName,
          pickupArea: input.pickupArea,
          dropoffArea: input.dropoffArea,
          customerPhone: input.customerPhone,
          customerName: input.customerName,
          digitalAddress: input.digitalAddress,
          landmark: input.landmark,
          pin: input.pin,
          ...trip,
          codAmountGHS: input.codAmountGHS,
          status: "offered",
          riderId: null,
          riderName: null,
          otp: newOtp(),
          otpAttempts: 0,
          declinedBy: [],
          offerSeenAt: {},
          createdAt: now,
          history: [{ status: "offered", at: now }],
        };
        set({ deliveries: [...existing, delivery] });
        return delivery;
      },

      markOfferSeen: (deliveryId, riderId, at) =>
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) =>
            d.offerSeenAt[riderId] !== undefined
              ? d
              : { ...d, offerSeenAt: { ...d.offerSeenAt, [riderId]: at } }
          ),
        })),

      declineOffer: (deliveryId, riderId) =>
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) =>
            d.status !== "offered" || d.declinedBy.includes(riderId)
              ? d
              : { ...d, declinedBy: [...d.declinedBy, riderId] }
          ),
        })),

      acceptOffer: (deliveryId, riderId) => {
        const rider = getRiderByIdSync(riderId);
        if (!rider) return "unknown_rider";
        if (!useRiderStore.getState().isOnline(riderId)) return "offline";

        const { deliveries } = get();
        if (activeDeliveryFor(deliveries, riderId)) return "busy";
        // Too much unhanded cash: hand some over before taking another job.
        if (heldTotal(useCashLedgerStore.getState().entries, riderId) >= CASH_HOLD_LIMIT_GHS) {
          return "cash_limit";
        }
        const delivery = deliveries.find((d) => d.id === deliveryId);
        if (!delivery || delivery.status !== "offered" || delivery.declinedBy.includes(riderId)) {
          return "gone";
        }

        set({
          deliveries: patchDelivery(deliveries, deliveryId, (d) => ({
            ...withStatus(d, "heading_to_pickup"),
            riderId,
            riderName: rider.name,
          })),
        });
        useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
          status: "rider_assigned",
          label: `${rider.name} accepted — heading to the seller`,
          riderName: rider.name,
          etaMinutes: delivery.etaMinutes,
        });
        return "ok";
      },

      advance: (deliveryId, riderId) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (!delivery || delivery.riderId !== riderId) return "invalid";
        const step = NEXT_STEP[delivery.status];
        if (!step) return "invalid";

        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => withStatus(d, step.to)),
        }));
        if (step.to === "out_for_delivery") {
          useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
            status: "out_for_delivery",
            label: "Picked up — out for delivery",
          });
        }
        return "ok";
      },

      completeDelivery: (deliveryId, riderId, otp) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (!delivery || delivery.riderId !== riderId || delivery.status !== "at_dropoff") {
          return "invalid";
        }
        if (delivery.otpAttempts >= OTP_MAX_ATTEMPTS) return "locked";

        if (otp.trim() !== delivery.otp) {
          const attempts = delivery.otpAttempts + 1;
          set((state) => ({
            deliveries: patchDelivery(state.deliveries, deliveryId, (d) => ({
              ...d,
              otpAttempts: attempts,
            })),
          }));
          return attempts >= OTP_MAX_ATTEMPTS ? "locked" : "wrong_otp";
        }

        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => withStatus(d, "delivered")),
        }));
        useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
          status: "delivered",
          label: "Delivered",
        });
        useRiderIdentityStore.getState().recordCompletedTrip(riderId);
        // The rider has now collected the cash: start its trail in the ledger.
        if (delivery.codAmountGHS > 0 && delivery.riderName) {
          useCashLedgerStore.getState().recordCollection({
            deliveryId: delivery.id,
            orderGroupId: delivery.orderGroupId,
            riderId,
            riderName: delivery.riderName,
            sellerId: delivery.sellerId,
            sellerName: delivery.sellerName,
            amountGHS: delivery.codAmountGHS,
          });
        }
        return "ok";
      },

      reportFailure: (deliveryId, riderId, reason) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (!delivery || delivery.riderId !== riderId) return "invalid";
        if (!failureReasonsFor(delivery.status).includes(reason)) return "invalid";

        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => ({
            ...withStatus(d, "failed"),
            failureReason: reason,
          })),
        }));
        // The order goes back to waiting for a delivery so the seller can
        // sort it out (and request another rider if it makes sense).
        useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
          status: "ready_for_pickup",
          label: `Delivery attempt failed — ${failureReasonLabels[reason]}`,
          riderName: null,
          etaMinutes: null,
        });
        return "ok";
      },
    }),
    {
      name: "grapplive-deliveries",
      storage: safeJSONStorage,
      partialize: (state) => ({ deliveries: state.deliveries }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
