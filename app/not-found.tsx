import Link from "next/link";
import { IconMoodSad } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <IconMoodSad size={40} className="text-gl-text-muted mb-3" />
      <h1 className="text-[16px] font-semibold text-gl-text mb-1.5">Page not found</h1>
      <p className="text-[11px] text-gl-text-secondary mb-6 max-w-[240px]">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/home"
        className="bg-gl-brand text-white text-[12px] font-semibold px-5 py-2.5 rounded-lg active:opacity-80 transition-opacity"
      >
        Back to GRAPPlive
      </Link>
    </div>
  );
}
