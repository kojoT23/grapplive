"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { GrappStoreTabBar } from "./GrappStoreTabBar";
import { QuickActionsSheet } from "./QuickActionsSheet";

export function GrappStoreShell({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="pb-16">
      {children}
      <GrappStoreTabBar activeHref={pathname} onOpenQuickActions={() => setSheetOpen(true)} />
      <QuickActionsSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
