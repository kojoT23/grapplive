"use client";

import { useRouter } from "next/navigation";
import { IconCamera, IconScan, IconPackage, IconMessage2 } from "@tabler/icons-react";

export function QuickActionsSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex items-end justify-center transition-colors ${
        isOpen ? "bg-black/45 pointer-events-auto" : "bg-transparent pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[480px] md:max-w-[720px] bg-white rounded-t-2xl px-4 pt-3 pb-6 transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-9 h-1 bg-gl-border-strong rounded-full mx-auto mb-4" />

        <button
          onClick={() => go("/grappstore/photo-search")}
          className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-gl-brand-soft-bg border border-gl-brand mb-3 text-left active:opacity-80 transition-opacity"
        >
          <div className="w-[52px] h-[52px] rounded-2xl bg-gl-brand flex items-center justify-center shrink-0">
            <IconCamera size={26} className="text-white" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-gl-text">Photo search</div>
            <div className="text-[11px] text-gl-text-secondary">Snap or upload a photo to find it</div>
          </div>
        </button>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => go("/grappstore/scan")}
            className="flex flex-col items-center gap-1.5 py-3.5 px-1.5 rounded-2xl bg-gl-bg-muted active:bg-gl-border transition-colors"
          >
            <IconScan size={20} className="text-gl-text-secondary" />
            <span className="text-[10px] text-gl-text text-center">Scan &amp; shop</span>
          </button>
          <button
            onClick={() => go("/grappstore/orders")}
            className="flex flex-col items-center gap-1.5 py-3.5 px-1.5 rounded-2xl bg-gl-bg-muted active:bg-gl-border transition-colors"
          >
            <IconPackage size={20} className="text-gl-text-secondary" />
            <span className="text-[10px] text-gl-text text-center">Track order</span>
          </button>
          <button
            onClick={() => go("/grappstore/request-item")}
            className="flex flex-col items-center gap-1.5 py-3.5 px-1.5 rounded-2xl bg-gl-bg-muted active:bg-gl-border transition-colors"
          >
            <IconMessage2 size={20} className="text-gl-text-secondary" />
            <span className="text-[10px] text-gl-text text-center">Request item</span>
          </button>
        </div>
      </div>
    </div>
  );
}
