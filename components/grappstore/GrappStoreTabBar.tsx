"use client";

import Link from "next/link";
import { IconHome, IconCategory, IconPlus, IconPackage, IconUser } from "@tabler/icons-react";

const leftTabs = [
  { href: "/grappstore", icon: IconHome, label: "Home" },
  { href: "/grappstore/categories", icon: IconCategory, label: "Categories" },
];

const rightTabs = [
  { href: "/grappstore/orders", icon: IconPackage, label: "Orders" },
  { href: "/grappstore/account", icon: IconUser, label: "Account" },
];

export function GrappStoreTabBar({
  activeHref,
  onOpenQuickActions,
}: {
  activeHref: string;
  onOpenQuickActions: () => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-[480px] md:max-w-[720px] mx-auto bg-white border-t border-gl-border flex items-center justify-around py-2">
      {leftTabs.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors active:bg-gl-bg-muted"
        >
          <Icon size={22} className={href === activeHref ? "text-gl-brand" : "text-gl-text-muted"} />
        </Link>
      ))}

      <button
        onClick={onOpenQuickActions}
        aria-label="Quick actions"
        className="w-[52px] h-[52px] rounded-full bg-gl-brand flex items-center justify-center -mt-7 shadow-lg active:scale-95 transition-transform"
      >
        <IconPlus size={24} className="text-white" />
      </button>

      {rightTabs.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors active:bg-gl-bg-muted"
        >
          <Icon size={22} className={href === activeHref ? "text-gl-brand" : "text-gl-text-muted"} />
        </Link>
      ))}
    </nav>
  );
}
