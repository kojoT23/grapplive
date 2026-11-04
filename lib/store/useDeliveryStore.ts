import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import {
  ACTIVE_DELIVERY_STATUSES,
  CANCELLABLE_BY_SELLER,
  RELEASABLE_BY_RIDER,
  mustReturnParcel,
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
  // The delivery fee (the rider's pay) when the order has one; otherwise the
  // mock trip estimate is used.
  feeGHS?: number;
  feePaidInCash?: boolean;
};

export type AcceptResult = "ok" | "gone" | "busy" | "offline" | "unknown_rider" | "cash_limit";
export type StepResult = "ok" | "invalid";
export type CompleteResult = "ok" | "wrong_otp" | "locked" | "invalid";
export type RateResult = "ok" | "invalid" | "already_rated" | "not_buyer";
export type ReleaseResult = "ok" | "invalid";

type DeliveryState = {
  deliveries: Delivery[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  createDelivery: (input: NewDeliveryInput) => Delivery;
  markOfferSeen: (deliveryId: string, riderId: string, at: number) => void;
  declineOffer: (deliveryId: string, riderId: string) => void;
  // A rider brings back an offer they skipped (declined or let expire).
  restoreOffer: (deliveryId: string, riderId: string) => void;
  // The seller sends a still-open request out again from scratch: everyone
  // who skipped it sees it again, with a fresh 30 seconds.
  reofferDelivery: (deliveryId: string) => void;
  acceptOffer: (deliveryId: string, riderId: string) => AcceptResult;
  advance: (deliveryId: string, riderId: string) => StepResult;
  completeDelivery: (deliveryId: string, riderId: string, otp: string) => CompleteResult;
  reportFailure: (deliveryId: string, riderId: string, reason: FailureReason) => StepResult;
  // The buyer rates the rider, once, after a completed delivery. Only the
  // phone that placed the order may rate it.
  rateDelivery: (deliveryId: string, buyerPhone: string, stars: number, comment?: string) => RateResult;
  // After a customer-side failure the rider takes the parcel back and says so;
  // the seller then confirms it really arrived.
  confirmReturn: (deliveryId: string, riderId: string) => StepResult;
  confirmParcelReceived: (deliveryId: string, sellerId: string) => StepResult;
  // The seller calls off a delivery before the parcel is picked up.
  cancelDelivery: (deliveryId: string, sellerId: string) => StepResult;
  // The rider hands a job back before they have the parcel; it goes out to
  // other riders again.
  releaseJob: (deliveryId: string, riderId: string) => ReleaseResult;
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
    .filter(
      (d) =>
        d.riderId === riderId &&
        (d.status === "delivered" ||
          d.status === "failed" ||
          d.status === "returned" ||
          d.status === "cancelled")
    )
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
          feeGHS: input.feeGHS ?? trip.feeGHS,
          codAmountGHS: input.codAmountGHS,
          feePaidInCash: input.feePaidInCash,
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

      restoreOffer: (deliveryId, riderId) =>
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => {
            if (d.status !== "offered") return d;
            const { [riderId]: removed, ...seen } = d.offerSeenAt;
            void removed;
            return { ...d, declinedBy: d.declinedBy.filter((id) => id !== riderId), offerSeenAt: seen };
          }),
        })),

      reofferDelivery: (deliveryId) =>
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) =>
            d.status === "offered" ? { ...d, declinedBy: [], offerSeenAt: {} } : d
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
            // Only what's owed to the seller: if the buyer paid the delivery
            // fee in cash, the rider keeps that part.
            amountGHS: delivery.codAmountGHS - (delivery.feePaidInCash ? delivery.feeGHS : 0),
          });
        }
        return "ok";
      },

      rateDelivery: (deliveryId, buyerPhone, stars, comment) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (!delivery || delivery.status !== "delivered" || !delivery.riderId) return "invalid";
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) return "invalid";
        if (delivery.rating) return "already_rated";

        const order = useOrdersStore
          .getState()
          .orders.find((o) => o.groups.some((g) => g.id === delivery.orderGroupId));
        if (!order) return "invalid";
        if (order.buyerPhone && order.buyerPhone !== buyerPhone) return "not_buyer";

        const trimmed = comment?.trim().slice(0, 200);
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => ({
            ...d,
            rating: { stars, ...(trimmed ? { comment: trimmed } : {}), at: Date.now() },
          })),
        }));
        useRiderIdentityStore.getState().recordRating(delivery.riderId, stars);
        return "ok";
      },

      reportFailure: (deliveryId, riderId, reason) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (!delivery || delivery.riderId !== riderId) return "invalid";
        if (!failureReasonsFor(delivery.status).includes(reason)) return "invalid";

        if (mustReturnParcel(reason)) {
          // The rider has the parcel, so the attempt isn't over until it's
          // back with the seller. The order stays "out for delivery".
          set((state) => ({
            deliveries: patchDelivery(state.deliveries, deliveryId, (d) => ({
              ...withStatus(d, "returning"),
              failureReason: reason,
            })),
          }));
          useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
            status: "out_for_delivery",
            label: `Delivery attempt failed — ${failureReasonLabels[reason]}. Returning the order to the seller`,
          });
          return "ok";
        }

        // Never picked up (seller problem): nothing to bring back, so the
        // order goes straight back to the seller to sort out.
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => ({
            ...withStatus(d, "failed"),
            failureReason: reason,
          })),
        }));
        useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
          status: "ready_for_pickup",
          label: `Delivery attempt failed — ${failureReasonLabels[reason]}`,
          riderName: null,
          etaMinutes: null,
        });
        return "ok";
      },

      confirmReturn: (deliveryId, riderId) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (!delivery || delivery.riderId !== riderId || delivery.status !== "returning") {
          return "invalid";
        }
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => withStatus(d, "returned")),
        }));
        useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
          status: "ready_for_pickup",
          label: "Parcel returned to the seller",
          riderName: null,
          etaMinutes: null,
        });
        return "ok";
      },

      confirmParcelReceived: (deliveryId, sellerId) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (
          !delivery ||
          delivery.sellerId !== sellerId ||
          delivery.status !== "returned" ||
          delivery.returnConfirmedAt !== undefined
        ) {
          return "invalid";
        }
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => ({
            ...d,
            returnConfirmedAt: Date.now(),
          })),
        }));
        useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
          status: "ready_for_pickup",
          label: "Seller confirmed the parcel is back",
        });
        return "ok";
      },

      cancelDelivery: (deliveryId, sellerId) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (
          !delivery ||
          delivery.sellerId !== sellerId ||
          !CANCELLABLE_BY_SELLER.includes(delivery.status)
        ) {
          return "invalid";
        }
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => withStatus(d, "cancelled")),
        }));
        // Back to where the order was before a rider was requested, so the
        // seller can request again whenever they like.
        const group = useOrdersStore
          .getState()
          .orders.flatMap((o) => o.groups)
          .find((g) => g.id === delivery.orderGroupId);
        const before = [...(group?.history ?? [])]
          .reverse()
          .find((h) => h.status === "ready_to_pack" || h.status === "preparing");
        useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
          status: before?.status ?? "preparing",
          label: "Delivery request cancelled by the seller",
          riderName: null,
          etaMinutes: null,
        });
        return "ok";
      },

      releaseJob: (deliveryId, riderId) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (
          !delivery ||
          delivery.riderId !== riderId ||
          !RELEASABLE_BY_RIDER.includes(delivery.status)
        ) {
          return "invalid";
        }
        // Back out to other riders — but not to this one again.
        set((state) => ({
          deliveries: patchDelivery(state.deliveries, deliveryId, (d) => ({
            ...withStatus(d, "offered"),
            riderId: null,
            riderName: null,
            declinedBy: d.declinedBy.includes(riderId) ? d.declinedBy : [...d.declinedBy, riderId],
            offerSeenAt: {},
          })),
        }));
        useOrdersStore.getState().applyDeliveryUpdate(delivery.orderGroupId, {
          status: "ready_for_pickup",
          label: "Your rider cancelled — finding another rider",
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
