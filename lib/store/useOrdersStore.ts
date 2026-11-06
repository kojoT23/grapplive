import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/utils/safe-storage";
import {
  initialOrders,
  type Order,
  type OrderGroup,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/mock-data/orders";
import type { DeliveryDetails } from "@/lib/mock-data/deliveryDetails";
import type { DeliverySlot } from "@/lib/mock-data/deliverySlots";
import { useAppStore } from "@/lib/store/useAppStore";
import { useLocationStore } from "@/lib/store/useLocationStore";
import { deliveryFeeFor } from "@/lib/mock-data/deliveryFees";

// What the delivery side tells an order when a delivery moves along. Keeps
// the order's coarse status/history in step with the finer delivery record.
export type DeliveryUpdate = {
  status: OrderStatus;
  label: string;
  riderName?: string | null; // null clears it, undefined leaves it
  etaMinutes?: number | null;
};

export type CancelResult = "ok" | "invalid" | "not_buyer" | "not_cancellable";

export type NewOrderGroupInput = {
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  deliverySlot?: DeliverySlot; // the day the buyer picked, for scheduled delivery
};

type OrdersState = {
  orders: Order[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  placeOrder: (groups: NewOrderGroupInput[], deliveryDetails?: DeliveryDetails) => void;
  confirmPayment: (groupId: string) => void;
  // Seller asks for a rider: the order waits as ready_for_pickup. The
  // matching delivery offer is created by requestDeliveryForGroup
  // (lib/delivery/dispatch.ts), which is what callers should use.
  requestDelivery: (groupId: string) => void;
  applyDeliveryUpdate: (groupId: string, update: DeliveryUpdate) => void;
  // The buyer calls off an order that hasn't been dispatched yet. Only cash on
  // delivery orders (nothing paid yet) can be cancelled this way — a paid order
  // needs a refund, which has to go through the seller until real payments exist.
  cancelByBuyer: (groupId: string, buyerPhone: string) => CancelResult;
  markDelivered: (groupId: string) => void;
};

function nowLabel() {
  return "Just now";
}

// Derives the next order id from whatever's actually persisted, rather than
// a module-level counter — a counter alone would collide with persisted
// orders after a reload, since it resets to its initial value on every load
// while localStorage still has real order ids saved.
function nextOrderId(existingOrders: Order[]): string {
  const maxSuffix = existingOrders.reduce((max, order) => {
    const match = order.id.match(/^o(\d+)$/);
    if (!match) return max;
    return Math.max(max, parseInt(match[1], 10));
  }, 100);
  return `o${maxSuffix + 1}`;
}

// Each payment method gets its own initial status/label — pulled out of the
// old two-way ternary now that there are three real methods. instant_confirm
// and grapplive_fulfilled land on the same status (both are paid and ready
// immediately) but different copy: "confirmed and paid" reads like a seller
// got paid, which isn't true for a GrappStore order that has no seller.
function initialStatusAndLabel(paymentMethod: PaymentMethod): { status: OrderStatus; label: string } {
  switch (paymentMethod) {
    case "grapplive_fulfilled":
      return { status: "ready_to_pack", label: "Order confirmed — GRAPPlive is preparing it" };
    case "instant_confirm":
      return { status: "ready_to_pack", label: "Order confirmed and paid" };
    case "direct_momo":
      return { status: "awaiting_confirmation", label: "Order placed — awaiting seller confirmation" };
    case "cash_on_delivery":
      return { status: "ready_to_pack", label: "Order confirmed — you'll pay cash on delivery" };
  }
}

function updateGroup(
  orders: Order[],
  groupId: string,
  updater: (g: OrderGroup) => OrderGroup
): Order[] {
  return orders.map((order) => ({
    ...order,
    groups: order.groups.map((g) => (g.id === groupId ? updater(g) : g)),
  }));
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: initialOrders,

      // Mirrors the hasHydrated pattern already used by useWishlistStore,
      // useFollowingStore, useCartStore, and useGrappStoreCartStore. This
      // store is persisted too but was missed in that pass — any screen
      // that reads `orders` (e.g. the checkout confirmation page) needs
      // this to avoid rendering fixture data on the server, then flashing
      // to the real persisted orders once the client catches up.
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      placeOrder: (groupInputs, deliveryDetails) =>
        set((state) => {
          const orderId = nextOrderId(state.orders);

          // The buyer's phone and delivery area, so a rider can reach them —
          // and the area the delivery fee is worked out for.
          const buyerPhone = useAppStore.getState().phone || undefined;
          const deliveryArea = useLocationStore.getState().areaName ?? undefined;

          const groups: OrderGroup[] = groupInputs.map((input, idx) => {
            const { status: initialStatus, label: initialLabel } = initialStatusAndLabel(input.paymentMethod);
            const fee = deliveryFeeFor(input.paymentMethod, input.sellerId, deliveryArea ?? null);

            return {
              id: `${orderId}-g${idx + 1}`,
              sellerId: input.sellerId,
              sellerName: input.sellerName,
              items: input.items,
              paymentMethod: input.paymentMethod,
              status: initialStatus,
              deliveryFeeGHS: fee.feeGHS,
              deliveryFeeChargedGHS: fee.chargedToBuyerGHS,
              deliverySlot: input.deliverySlot,
              buyerNote: input.paymentMethod === "direct_momo" ? "Payment sent — awaiting confirmation" : undefined,
              history: [{ status: initialStatus, label: initialLabel, timestamp: nowLabel() }],
            };
          });

          const newOrder: Order = { id: orderId, groups, buyerPhone, deliveryArea, deliveryDetails };
          return { orders: [newOrder, ...state.orders] };
        }),

      confirmPayment: (groupId) =>
        set((state) => ({
          orders: updateGroup(state.orders, groupId, (g) => ({
            ...g,
            status: "preparing",
            history: [...g.history, { status: "preparing", label: "Seller confirmed payment — preparing your order", timestamp: nowLabel() }],
          })),
        })),

      requestDelivery: (groupId) =>
        set((state) => ({
          orders: updateGroup(state.orders, groupId, (g) => ({
            ...g,
            status: "ready_for_pickup",
            riderName: undefined,
            etaMinutes: undefined,
            history: [...g.history, { status: "ready_for_pickup", label: "Delivery requested — waiting for a rider", timestamp: nowLabel() }],
          })),
        })),

      cancelByBuyer: (groupId, buyerPhone) => {
        const order = get().orders.find((o) => o.groups.some((g) => g.id === groupId));
        const group = order?.groups.find((g) => g.id === groupId);
        if (!order || !group) return "invalid";
        if (order.buyerPhone && order.buyerPhone !== buyerPhone) return "not_buyer";
        const cancellable =
          group.paymentMethod === "cash_on_delivery" &&
          (group.status === "ready_to_pack" || group.status === "preparing");
        if (!cancellable) return "not_cancellable";

        set((state) => ({
          orders: updateGroup(state.orders, groupId, (g) => ({
            ...g,
            status: "cancelled",
            history: [...g.history, { status: "cancelled", label: "Cancelled by the buyer", timestamp: nowLabel() }],
          })),
        }));
        return "ok";
      },

      applyDeliveryUpdate: (groupId, update) =>
        set((state) => ({
          orders: updateGroup(state.orders, groupId, (g) => ({
            ...g,
            status: update.status,
            riderName: update.riderName === undefined ? g.riderName : update.riderName ?? undefined,
            etaMinutes: update.etaMinutes === undefined ? g.etaMinutes : update.etaMinutes ?? undefined,
            history: [...g.history, { status: update.status, label: update.label, timestamp: nowLabel() }],
          })),
        })),

      markDelivered: (groupId) =>
        set((state) => ({
          orders: updateGroup(state.orders, groupId, (g) => ({
            ...g,
            status: "delivered",
            history: [...g.history, { status: "delivered", label: "Delivered", timestamp: nowLabel() }],
          })),
        })),
    }),
    {
      name: "grapplelive-orders",
      storage: safeJSONStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
