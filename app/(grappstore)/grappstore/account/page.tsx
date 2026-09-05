import Link from "next/link";
import { IconPackage, IconUser, IconHeadset, IconTruckDelivery } from "@tabler/icons-react";

export default function GrappStoreAccountPage() {
  return (
    <div>
      <h1 className="px-3 md:px-5 pt-3.5 pb-3 text-[14px] font-semibold text-gl-text">Account</h1>

      <div className="px-3 md:px-5 flex flex-col gap-2">
        <Link
          href="/grappstore/orders"
          className="flex items-center gap-3 border border-gl-border rounded-lg px-3 py-2.5 active:bg-gl-bg-muted transition-colors"
        >
          <IconPackage size={18} className="text-gl-text-secondary" />
          <span className="text-[12px] text-gl-text">Your GrappStore orders</span>
        </Link>
        <Link
          href="/account"
          className="flex items-center gap-3 border border-gl-border rounded-lg px-3 py-2.5 active:bg-gl-bg-muted transition-colors"
        >
          <IconUser size={18} className="text-gl-text-secondary" />
          <span className="text-[12px] text-gl-text">Manage your GRAPPlive account</span>
        </Link>
        <Link
          href="/grappstore/inbox"
          className="flex items-center gap-3 border border-gl-border rounded-lg px-3 py-2.5 active:bg-gl-bg-muted transition-colors"
        >
          <IconHeadset size={18} className="text-gl-text-secondary" />
          <span className="text-[12px] text-gl-text">Contact GrappStore support</span>
        </Link>

        <div className="h-px bg-gl-border my-2" />

        <Link
          href="/grappstore/fulfillment"
          className="flex items-center gap-3 border border-gl-border-strong rounded-lg px-3 py-2.5 active:bg-gl-bg-muted transition-colors"
        >
          <IconTruckDelivery size={18} className="text-gl-brand" />
          <div>
            <span className="text-[12px] text-gl-text block">GrappStore fulfillment (ops)</span>
            <span className="text-[9px] text-gl-text-secondary">Internal — manage orders</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
