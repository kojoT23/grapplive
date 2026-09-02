export type CustomerSegment = "vip" | "at_risk" | "repeat" | "new";

export type CustomerOrder = {
  id: string;
  itemName: string;
  amountGHS: number;
  date: string; // display string, e.g. "19 Aug"
};

export type Customer = {
  id: string;
  name: string;
  segment: CustomerSegment;
  ordersCount: number;
  lifetimeSpendGHS: number;
  lastOrderDaysAgo: number;
  tags: string[];
  notes: string;
  orderHistory: CustomerOrder[];
};

export const initialCustomers: Customer[] = [
  {
    id: "c1",
    name: "Abena Owusu",
    segment: "vip",
    ordersCount: 7,
    lifetimeSpendGHS: 612,
    lastOrderDaysAgo: 3,
    tags: ["Wholesale"],
    notes: "Buys in bulk for her boutique in Kumasi. Always pays via Direct MoMo.",
    orderHistory: [
      { id: "o101", itemName: "Kente-print ankara dress ×3", amountGHS: 267, date: "21 Aug" },
      { id: "o102", itemName: "Beaded sandals ×2", amountGHS: 110, date: "9 Aug" },
    ],
  },
  {
    id: "c2",
    name: "Kwesi Mensah",
    segment: "at_risk",
    ordersCount: 3,
    lifetimeSpendGHS: 198,
    lastOrderDaysAgo: 42,
    tags: [],
    notes: "",
    orderHistory: [
      { id: "o201", itemName: "Bluetooth earbuds", amountGHS: 145, date: "13 Jul" },
    ],
  },
  {
    id: "c3",
    name: "Yaw Boateng",
    segment: "repeat",
    ordersCount: 2,
    lifetimeSpendGHS: 178,
    lastOrderDaysAgo: 6,
    tags: ["Prefers cash"],
    notes: "",
    orderHistory: [
      { id: "o301", itemName: "Shea butter gift set", amountGHS: 65, date: "18 Aug" },
      { id: "o302", itemName: "Shea butter gift set", amountGHS: 65, date: "2 Aug" },
    ],
  },
];
