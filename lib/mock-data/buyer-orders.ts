export type BuyerOrderStatus = "confirmed" | "preparing" | "out_for_delivery" | "delivered";

export type BuyerOrderTimelineStep = {
  status: BuyerOrderStatus;
  label: string;
  timestamp: string;
  completed: boolean;
};

export type BuyerOrder = {
  id: string;
  productId: string;
  itemName: string;
  quantity: number;
  priceGHS: number;
  sellerName: string;
  currentStatus: BuyerOrderStatus;
  timeline: BuyerOrderTimelineStep[];
};

export const buyerOrders: BuyerOrder[] = [
  {
    id: "bo1",
    productId: "p1",
    itemName: "Kente-print ankara dress",
    quantity: 1,
    priceGHS: 89,
    sellerName: "Ama's Fashion House",
    currentStatus: "out_for_delivery",
    timeline: [
      { status: "confirmed", label: "Order confirmed", timestamp: "Today, 9:12 AM", completed: true },
      { status: "preparing", label: "Seller is preparing your order", timestamp: "Today, 9:40 AM", completed: true },
      { status: "out_for_delivery", label: "Out for delivery", timestamp: "Today, 11:05 AM", completed: true },
      { status: "delivered", label: "Delivered", timestamp: "", completed: false },
    ],
  },
  {
    id: "bo2",
    productId: "p2",
    itemName: "Bluetooth earbuds",
    quantity: 1,
    priceGHS: 145,
    sellerName: "Kojo Electronics",
    currentStatus: "delivered",
    timeline: [
      { status: "confirmed", label: "Order confirmed", timestamp: "19 Aug, 2:30 PM", completed: true },
      { status: "preparing", label: "Seller prepared your order", timestamp: "19 Aug, 3:15 PM", completed: true },
      { status: "out_for_delivery", label: "Out for delivery", timestamp: "19 Aug, 4:00 PM", completed: true },
      { status: "delivered", label: "Delivered", timestamp: "19 Aug, 5:20 PM", completed: true },
    ],
  },
];

export function getBuyerOrderById(id: string): BuyerOrder | undefined {
  return buyerOrders.find((o) => o.id === id);
}
