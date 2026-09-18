import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  initialOrders,
  type Order,
  type OrderGroup,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/mock-data/orders";

export type NewOrderGroupInput = {
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
};

type OrdersState = {
  orders: Order[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  placeOrder: (groups: NewOrderGroupInput[]) => void;
  confirmPayment: (groupId: string) => void;
  requestDelivery: (groupId: string) => void;
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
    (set) => ({
      orders: initialOrders,

      // Mirrors the hasHydrated pattern already used by useWishlistStore,
      // useFollowingStore, useCartStore, and useGrappStoreCartStore. This
      // store is persisted too but was missed in that pass — any screen
      // that reads `orders` (e.g. the checkout confirmation page) needs
      // this to avoid rendering fixture data on the server, then flashing
      // to the real persisted orders once the client catches up.
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      placeOrder: (groupInputs) =>
        set((state) => {
          const orderId = nextOrderId(state.orders);

          const groups: OrderGroup[] = groupInputs.map((input, idx) => {
            const { status: initialStatus, label: initialLabel } = initialStatusAndLabel(input.paymentMethod);

            return {
              id: `${orderId}-g${idx + 1}`,
              sellerId: input.sellerId,
              sellerName: input.sellerName,
              items: input.items,
              paymentMethod: input.paymentMethod,
              status: initialStatus,
              buyerNote: input.paymentMethod === "direct_momo" ? "Payment sent — awaiting confirmation" : undefined,
              history: [{ status: initialStatus, label: initialLabel, timestamp: nowLabel() }],
            };
          });

          const newOrder: Order = { id: orderId, groups };
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
            status: "out_for_delivery",
            riderName: "Rider assigned",
            etaMinutes: 30,
            history: [...g.history, { status: "out_for_delivery", label: "Out for delivery", timestamp: nowLabel() }],
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
