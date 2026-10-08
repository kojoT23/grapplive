"use client";

export function LoadMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mx-auto mt-3 mb-1 block text-[11px] font-semibold text-gl-brand active:opacity-60 transition-opacity"
    >
      Load more
    </button>
  );
}
