import Link from "next/link";
import Image from "next/image";
import { IconArrowLeft, IconSearch, IconShoppingCart } from "@tabler/icons-react";
import { grappCategoryTiles } from "@/lib/mock-data/grappCategories";

export default function GrappStoreCategoriesPage() {
  return (
    <div>
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/grappstore" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="flex-1 text-[14px] font-semibold text-gl-text">Categories</h1>
        <Link href="/grappstore/cart" aria-label="Cart" className="active:opacity-60 transition-opacity">
          <IconShoppingCart size={18} className="text-gl-text-secondary" />
        </Link>
      </div>

      <Link
        href="/grappstore/search"
        className="mx-3 md:mx-5 mb-4 bg-gl-bg-muted rounded-lg px-2.5 py-2 flex items-center gap-1 text-[12px] text-gl-text-secondary transition-colors active:bg-gl-border"
      >
        <IconSearch size={14} />
        Search in categories…
      </Link>

      <div className="grid grid-cols-2 gap-2.5 px-3 md:px-5 pb-4">
        {grappCategoryTiles.map((cat) => (
          <Link
            key={cat.slug}
            href={`/grappstore/category/${cat.slug}`}
            className="rounded-xl overflow-hidden relative transition-transform active:scale-[0.97]"
            style={{ aspectRatio: "4 / 5" }}
          >
            <Image
              src={cat.imageSrc}
              alt={cat.label}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
            />
            {/* Softer overlay tuned for the muted duotone photos — a
                harsh black gradient (right for full-color images) looked
                too heavy once every photo shares this quieter tone. */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A1420]/70 via-[#2A1420]/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
              <div className="text-[13px] font-semibold text-white">{cat.label}</div>
              <div className="text-[9px] text-white/85">{cat.productCount.toLocaleString()} products</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
