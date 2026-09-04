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

export type OrderItem = {
  productId: string;
  itemName: string;
  quantity: number;
  priceGHS: number;
};

// One OrderGroup = one merchant's portion of a checkout (AGENTS.md §42).
// Sellers only ever see/act on their own OrderGroup.
export type OrderGroup = {
  id: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  buyerNote?: string;
  isResellerOrder?: boolean;
  resellerMarkupGHS?: number;
  riderName?: string;
  etaMinutes?: number;
  history: OrderHistoryEntry[];
};

// One Order = one buyer-facing checkout event, may contain multiple
// merchants' OrderGroups (unified cart, split settlement — AGENTS.md §40.5).
export type Order = {
  id: string;
  groups: OrderGroup[];
};

export const initialOrders: Order[] = [
  {
    id: "o1",
    groups: [
      {
        id: "o1-g1",
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Kente-print ankara dress", quantity: 1, priceGHS: 89 }],
        paymentMethod: "direct_momo",
        status: "awaiting_confirmation",
        buyerNote: "Buyer says payment sent 12 min ago",
        history: [
          { status: "awaiting_confirmation", label: "Order placed — awaiting seller confirmation", timestamp: "Today, 9:00 AM" },
        ],
      },
    ],
  },
  {
    id: "o2",
    groups: [
      {
        id: "o2-g1",
        sellerId: "s2",
        sellerName: "Kojo Electronics",
        items: [{ productId: "p2", itemName: "Bluetooth earbuds", quantity: 2, priceGHS: 145 }],
        paymentMethod: "instant_confirm",
        status: "ready_to_pack",
        isResellerOrder: true,
        resellerMarkupGHS: 20,
        history: [
          { status: "ready_to_pack", label: "Order confirmed and paid", timestamp: "Today, 9:10 AM" },
        ],
      },
    ],
  },
  {
    id: "o3",
    groups: [
      {
        id: "o3-g1",
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Shea butter gift set", quantity: 1, priceGHS: 65 }],
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
    ],
  },
];

export type FlatOrderGroup = OrderGroup & { orderId: string };

export function flattenGroups(orders: Order[]): FlatOrderGroup[] {
  return orders.flatMap((order) => order.groups.map((g) => ({ ...g, orderId: order.id })));
}

export function groupTotal(group: OrderGroup): number {
  return group.items.reduce((sum, i) => sum + i.priceGHS * i.quantity, 0);
}
