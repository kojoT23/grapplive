import Link from "next/link";
import { IconArrowLeft, IconShieldCheck, IconPackage, IconStar, IconInfoCircle } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { getGrappVerifiedProducts } from "@/lib/mock-data/catalog";

export default function GrappVerifiedPage() {
  const products = getGrappVerifiedProducts();

  return (
    <div className="pb-6">
      <div className="bg-[#0B0B0B] px-3 md:px-5 pt-4 pb-4 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gl-brand/25" />
        <div className="relative flex items-center gap-2 mb-2">
          <Link href="/home" className="active:opacity-60 transition-opacity">
            <IconArrowLeft size={16} className="text-white" />
          </Link>
          <span className="text-[15px] font-medium text-white">GRAPP Verified</span>
          <span className="text-[10px] text-white/60 ml-auto">Seller quality badge</span>
        </div>
        <p className="relative text-[11px] text-white/75 leading-relaxed">
          Products from sellers who meet GRAPPlive&apos;s quality standard — verified producers,
          trusted imports, and top sellers.
        </p>
      </div>

      <div className="flex gap-2 px-3 md:px-5 py-3 overflow-x-auto">
        <span className="text-[10px] text-gl-text bg-gl-bg-muted border border-gl-border px-2.5 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1">
          <IconShieldCheck size={12} className="text-gl-brand" />
          Verified producer
        </span>
        <span className="text-[10px] text-gl-text bg-gl-bg-muted border border-gl-border px-2.5 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1">
          <IconPackage size={12} className="text-gl-brand" />
          Trusted import
        </span>
        <span className="text-[10px] text-gl-text bg-gl-bg-muted border border-gl-border px-2.5 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1">
          <IconStar size={12} className="text-gl-brand" />
          Top seller
        </span>
      </div>

      {products.length === 0 ? (
        <div className="px-3 md:px-5 py-10 text-center text-[11px] text-gl-text-secondary">
          No GRAPP Verified products yet — check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pb-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="mx-3 md:mx-5 mt-2 p-3 border border-gl-border rounded-lg flex items-start gap-2">
        <IconInfoCircle size={16} className="text-gl-text-muted shrink-0 mt-0.5" />
        <p className="text-[9px] text-gl-text-secondary leading-relaxed">
          Any seller can earn GRAPP Verified status by meeting order, photo, and reliability
          standards. It isn&apos;t exclusive — it&apos;s a bar any seller can reach. Note: this is
          separate from GrappStore, GRAPPlive&apos;s own official store.
        </p>
      </div>
    </div>
  );
}
