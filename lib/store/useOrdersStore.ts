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

      placeOrder: (groupInputs) =>
        set((state) => {
          const orderId = nextOrderId(state.orders);

          const groups: OrderGroup[] = groupInputs.map((input, idx) => {
            const initialStatus: OrderStatus =
              input.paymentMethod === "instant_confirm" ? "ready_to_pack" : "awaiting_confirmation";
            const initialLabel =
              input.paymentMethod === "instant_confirm"
                ? "Order confirmed and paid"
                : "Order placed — awaiting seller confirmation";

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
    { name: "grapplelive-orders" }
  )
);
