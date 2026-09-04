import Link from "next/link";
import { IconPackage, IconUser, IconHeadset } from "@tabler/icons-react";

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
      </div>
    </div>
  );
}
