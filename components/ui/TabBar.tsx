import Link from "next/link";
import type { Icon as TablerIcon } from "@tabler/icons-react";

type Tab = {
  href: string;
  icon: TablerIcon;
  label: string;
};

export function TabBar({ tabs, activeHref }: { tabs: Tab[]; activeHref: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] md:max-w-[720px] mx-auto bg-white border-t border-gl-border flex justify-around py-2">
      {tabs.map(({ href, icon: Icon, label }) => {
        const isActive = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors active:bg-gl-bg-muted"
          >
            <Icon
              size={22}
              className={`transition-colors ${
                isActive ? "text-gl-brand" : "text-gl-text-muted"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
