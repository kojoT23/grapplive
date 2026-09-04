import Link from "next/link";
import { IconArrowLeft, IconMapPin, IconStar, IconBrandWhatsapp } from "@tabler/icons-react";
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

  const { store } = seller;
  const whatsappNumber = seller.products[0]?.sellerSocials.whatsappNumber;

  return (
    <div className="pb-6">
      <div className="relative w-full h-28 gl-shimmer">
        <Link
          href="/home"
          className="absolute top-3 left-3 z-10 bg-black/30 rounded-full p-1.5 active:opacity-60 transition-opacity"
        >
          <IconArrowLeft size={18} className="text-white" />
        </Link>
      </div>

      <div className="px-3 md:px-5 flex items-end gap-3 -mt-8 pb-3">
        <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden gl-shimmer border-2 border-white bg-gl-bg" />
        <div className="flex-1 pb-1">
          <div className="text-[15px] font-semibold text-gl-text">{seller.name}</div>
          <div className="text-[10px] text-gl-text-secondary">
            {seller.ordersCompleted} orders completed · replies in {seller.replyTime}
          </div>
        </div>
      </div>

      {store && (
        <div className="px-3 md:px-5 pb-3">
          <p className="text-[12px] text-gl-text-secondary leading-relaxed mb-2">{store.about}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {store.deliveryAreas.map((area) => (
              <span
                key={area}
                className="flex items-center gap-1 text-[10px] text-gl-text-secondary bg-gl-bg-muted rounded-full px-2 py-1"
              >
                <IconMapPin size={11} /> {area}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 text-center bg-gl-bg-muted rounded-lg py-2.5">
            <div>
              <div className="flex items-center justify-center gap-0.5 text-[12px] font-semibold text-gl-text">
                <IconStar size={11} className="fill-gl-brand text-gl-brand" /> {store.rating}
              </div>
              <div className="text-[9px] text-gl-text-secondary">{store.reviewCount} reviews</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-gl-text">{store.followerCount}</div>
              <div className="text-[9px] text-gl-text-secondary">Followers</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-gl-text">{store.responseRate}</div>
              <div className="text-[9px] text-gl-text-secondary">Response rate</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-gl-text">{store.memberSince}</div>
              <div className="text-[9px] text-gl-text-secondary">Member since</div>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 md:px-5 pb-4 border-b border-gl-bg-muted mb-3 flex gap-2">
        <div className="flex-1">
          <SellerFollowButton sellerId={seller.id} />
        </div>
        {whatsappNumber && (
          <Link
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 flex-1 border border-gl-border rounded-lg text-[11px] font-semibold text-gl-text active:bg-gl-bg-muted transition-colors"
          >
            <IconBrandWhatsapp size={14} className="text-[#25D366]" />
            Chat
          </Link>
        )}
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
