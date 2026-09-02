import {
  IconLayoutDashboard,
  IconPackage,
  IconShoppingBag,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react";

export const sellerTabs = [
  { href: "/dashboard", icon: IconLayoutDashboard, label: "Dashboard" },
  { href: "/orders", icon: IconPackage, label: "Orders" },
  { href: "/products", icon: IconShoppingBag, label: "Products" },
  { href: "/customers", icon: IconUsers, label: "Customers" },
  { href: "/payouts", icon: IconWallet, label: "Payouts" },
];
