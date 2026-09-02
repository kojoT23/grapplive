export type PaymentMethod = "direct_momo" | "instant_confirm";

export type OrderStatus =
  | "awaiting_confirmation"
  | "ready_to_pack"
  | "preparing"
  | "out_for_delivery"
  | "delivered";

export type OrderHistoryEntry = {
  status: OrderStatus;
  label: string;
  timestamp: string;
};

export type Order = {
  id: string;
  productId: string;
  itemName: string;
  quantity: number;
  priceGHS: number;
  sellerName: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  buyerNote?: string;
  isResellerOrder?: boolean;
  resellerMarkupGHS?: number;
  riderName?: string;
  etaMinutes?: number;
  history: OrderHistoryEntry[];
};

export const initialOrders: Order[] = [
  {
    id: "o1",
    productId: "p1",
    itemName: "Kente-print ankara dress",
    quantity: 1,
    priceGHS: 89,
    sellerName: "Ama's Fashion House",
    paymentMethod: "direct_momo",
    status: "awaiting_confirmation",
    buyerNote: "Buyer says payment sent 12 min ago",
    history: [
      { status: "awaiting_confirmation", label: "Order placed — awaiting seller confirmation", timestamp: "Today, 9:00 AM" },
    ],
  },
  {
    id: "o2",
    productId: "p2",
    itemName: "Bluetooth earbuds",
    quantity: 2,
    priceGHS: 145,
    sellerName: "Kojo Electronics",
    paymentMethod: "instant_confirm",
    status: "ready_to_pack",
    isResellerOrder: true,
    resellerMarkupGHS: 20,
    history: [
      { status: "ready_to_pack", label: "Order confirmed and paid", timestamp: "Today, 9:10 AM" },
    ],
  },
  {
    id: "o3",
    productId: "p1",
    itemName: "Shea butter gift set",
    quantity: 1,
    priceGHS: 65,
    sellerName: "Ama's Fashion House",
    paymentMethod: "instant_confirm",
    status: "out_for_delivery",
    riderName: "Kwesi",
    etaMinutes: 25,
    history: [
      { status: "ready_to_pack", label: "Order confirmed and paid", timestamp: "19 Aug, 2:30 PM" },
      { status: "preparing", label: "Seller is preparing your order", timestamp: "19 Aug, 3:15 PM" },
      { status: "out_for_delivery", label: "Out for delivery", timestamp: "19 Aug, 4:00 PM" },
    ],
  },
];
