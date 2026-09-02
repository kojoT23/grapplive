import { create } from "zustand";
import { initialOrders, type Order, type OrderStatus, type PaymentMethod } from "@/lib/mock-data/orders";

type NewOrderInput = {
  productId: string;
  itemName: string;
  quantity: number;
  priceGHS: number;
  sellerName: string;
  paymentMethod: PaymentMethod;
};

type OrdersState = {
  orders: Order[];
  placeOrder: (input: NewOrderInput) => void;
  confirmPayment: (orderId: string) => void;
  requestDelivery: (orderId: string) => void;
  markDelivered: (orderId: string) => void;
};

let orderCounter = 100;

function nowLabel() {
  return "Just now";
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: initialOrders,

  placeOrder: (input) =>
    set((state) => {
      orderCounter += 1;
      const initialStatus: OrderStatus =
        input.paymentMethod === "instant_confirm" ? "ready_to_pack" : "awaiting_confirmation";
      const initialLabel =
        input.paymentMethod === "instant_confirm"
          ? "Order confirmed and paid"
          : "Order placed — awaiting seller confirmation";

      const newOrder: Order = {
        id: "o" + orderCounter,
        productId: input.productId,
        itemName: input.itemName,
        quantity: input.quantity,
        priceGHS: input.priceGHS,
        sellerName: input.sellerName,
        paymentMethod: input.paymentMethod,
        status: initialStatus,
        buyerNote: input.paymentMethod === "direct_momo" ? "Payment sent — awaiting confirmation" : undefined,
        history: [{ status: initialStatus, label: initialLabel, timestamp: nowLabel() }],
      };

      return { orders: [newOrder, ...state.orders] };
    }),

  confirmPayment: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "preparing" as const,
              history: [...o.history, { status: "preparing" as const, label: "Seller confirmed payment — preparing your order", timestamp: nowLabel() }],
            }
          : o
      ),
    })),

  requestDelivery: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "out_for_delivery" as const,
              riderName: "Rider assigned",
              etaMinutes: 30,
              history: [...o.history, { status: "out_for_delivery" as const, label: "Out for delivery", timestamp: nowLabel() }],
            }
          : o
      ),
    })),

  markDelivered: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "delivered" as const,
              history: [...o.history, { status: "delivered" as const, label: "Delivered", timestamp: nowLabel() }],
            }
          : o
      ),
    })),
}));
