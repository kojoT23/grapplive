import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { getSellerById } from "@/lib/mock-data/sellers";
import { SellerFollowButton } from "./SellerFollowButton";

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = getSellerById(id);

  if (!seller) {
    return (
      <div className="px-3 md:px-5 pt-3.5">
        <Link href="/home" className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-4 active:opacity-60 transition-opacity">
          <IconArrowLeft size={14} /> Back
        </Link>
        <div className="text-[12px] text-gl-text-secondary">Seller not found.</div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/home" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
      </div>

      <div className="px-3 md:px-5 flex items-center gap-3 pb-3">
        <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden gl-shimmer border-2 border-gl-brand" />
        <div className="flex-1">
          <div className="text-[15px] font-semibold text-gl-text">{seller.name}</div>
          <div className="text-[10px] text-gl-text-secondary">
            {seller.ordersCompleted} orders completed · replies in {seller.replyTime}
          </div>
        </div>
      </div>

      <div className="px-3 md:px-5 pb-4 border-b border-gl-bg-muted mb-3">
        <SellerFollowButton sellerId={seller.id} />
      </div>

      <h2 className="px-3 md:px-5 pb-2 text-[12px] font-semibold text-gl-text">
        Products from {seller.name}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 px-3 md:px-5">
        {seller.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
