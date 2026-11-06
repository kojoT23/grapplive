import type { DeliveryDetails } from "@/lib/mock-data/deliveryDetails";
import type { DeliverySlot } from "@/lib/mock-data/deliverySlots";

// "instant_confirm" (marketplace) and "grapplive_fulfilled" (GrappStore)
// used to share the same value. They mean different things in practice:
// instant_confirm is a paid opt-in a marketplace buyer chooses to skip
// waiting on a seller; grapplive_fulfilled is GrappStore's only option,
// free, because there's no seller to wait on in the first place — GRAPPlive
// is the merchant of record (AGENTS.md §40.5). Conflating them would have
// been a landmine for any future seller dashboard, analytics, or backend
// work that groups/filters orders by payment method.
export type PaymentMethod =
  | "direct_momo"
  | "instant_confirm"
  | "grapplive_fulfilled"
  | "cash_on_delivery"; // buyer pays the rider in cash; tracked in the cash ledger

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "direct_momo":
      return "Direct MoMo";
    case "instant_confirm":
      return "Instant Confirm";
    case "cash_on_delivery":
      return "Cash on delivery";
    case "grapplive_fulfilled":
      return "GRAPPlive";
  }
}

export type OrderStatus =
  | "awaiting_confirmation"
  | "ready_to_pack"
  | "preparing"
  | "ready_for_pickup" // delivery requested, waiting for a rider to accept
  | "rider_assigned" // a rider accepted; heading to / at the seller
  | "out_for_delivery" // rider has the parcel and is on the way
  | "delivered"
  | "cancelled"; // called off before it was dispatched (see cancelByBuyer)

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
  // Delivery cost for this seller's part of the order, and how much of it the
  // buyer pays (see lib/mock-data/deliveryFees.ts). Optional: fixture orders
  // predate delivery fees.
  deliveryFeeGHS?: number;
  deliveryFeeChargedGHS?: number;
  // Present when the buyer picked a delivery day (scheduled delivery); absent
  // for ordinary same-day (on-demand) delivery.
  deliverySlot?: DeliverySlot;
  history: OrderHistoryEntry[];
};

// One Order = one buyer-facing checkout event, may contain multiple
// merchants' OrderGroups (unified cart, split settlement — AGENTS.md §40.5).
export type Order = {
  id: string;
  groups: OrderGroup[];
  // Captured at checkout so a rider can reach the buyer and know where to
  // go. Optional: the static fixture orders predate this. A real buyer
  // identity (ROADMAP.md §1.3) and a full address (digital address,
  // landmark) replace these once checkout collects them.
  buyerPhone?: string;
  deliveryArea?: string;
  // Who to deliver to and how to find them (name, digital address,
  // landmark), collected at checkout.
  deliveryDetails?: DeliveryDetails;
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

// What the buyer pays for this group: the items plus any delivery fee they
// are charged. (`groupTotal` stays items-only — that's the seller's revenue.)
export function groupPayable(group: OrderGroup): number {
  return groupTotal(group) + (group.deliveryFeeChargedGHS ?? 0);
}
