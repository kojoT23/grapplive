"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconArrowLeft, IconScan } from "@tabler/icons-react";
import { getOfficialProductById } from "@/lib/mock-data/officialCatalog";
import { productIllustrationByProductId } from "@/lib/mock-data/productIllustrations";

// Pro wireless earbuds — used as a fixed demo result. No real barcode/QR
// decoding exists yet (Phase 0, no camera-vision backend), so this is a
// UI mockup demonstrating the intended flow, same honest-mockup pattern
// as the rest of the prototype.
const DEMO_SCAN_PRODUCT_ID = "gs-3";

export default function ScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const scannedProduct = hasScanned ? getOfficialProductById(DEMO_SCAN_PRODUCT_ID) : undefined;
  const scannedIllustration = scannedProduct ? productIllustrationByProductId[scannedProduct.id] : undefined;

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 1200);
  };

  const handleReset = () => {
    setHasScanned(false);
  };

  return (
    <div className="bg-[#0B0B0B] min-h-dvh relative">
      <div className="flex items-center gap-2 px-3 pt-3.5 pb-3 relative z-10">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-[14px] font-semibold text-white">Scan &amp; shop</h1>
      </div>

      {!scannedProduct ? (
        <div
          className="flex flex-col items-center justify-center px-6"
          style={{ minHeight: "calc(100dvh - 60px)" }}
        >
          <div className="relative w-56 h-56 mb-6">
            <div className="absolute inset-0 border-2 border-white/30 rounded-2xl" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gl-brand rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gl-brand rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gl-brand rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gl-brand rounded-br-lg" />
            {isScanning && <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gl-brand animate-pulse" />}
          </div>
          <p className="text-[12px] text-white/70 text-center mb-6 max-w-[220px]">
            Point your camera at a barcode or QR code to find a product instantly
          </p>
          <button
            onClick={handleSimulateScan}
            disabled={isScanning}
            className="bg-gl-brand disabled:opacity-60 text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 active:opacity-80 transition-opacity"
          >
            <IconScan size={16} />
            {isScanning ? "Scanning…" : "Simulate scan"}
          </button>
        </div>
      ) : (
        <div className="bg-white min-h-dvh px-3 md:px-5 pt-4 rounded-t-2xl -mt-2 relative z-10">
          <p className="text-[11px] text-gl-green font-semibold mb-3">Match found</p>
          <div className="border border-gl-border rounded-lg p-3 flex items-center gap-3 mb-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white">
              {scannedIllustration ? (
                <Image
                  src={scannedIllustration}
                  alt={scannedProduct.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 gl-shimmer" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-gl-text leading-snug line-clamp-2 mb-1">
                {scannedProduct.name}
              </div>
              <div className="text-[13px] font-bold text-gl-text">GHS {scannedProduct.priceGHS}</div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/grappstore/product/${scannedProduct.id}`)}
            className="w-full bg-gl-brand text-white text-[12px] font-semibold py-2.5 rounded-lg active:opacity-80 transition-opacity mb-2.5"
          >
            View product
          </button>
          <button
            onClick={handleReset}
            className="w-full border border-gl-border-strong text-gl-text text-[12px] font-semibold py-2.5 rounded-lg active:bg-gl-bg-muted transition-colors"
          >
            Scan another item
          </button>
        </div>
      )}
    </div>
  );
}
