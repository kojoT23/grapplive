import { useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 20;

// Renders unbounded. Fine at today's tiny fixture catalog, a real
// problem once this is the "very big database" the product is meant to
// grow into — every product/customer in a list rendering at once,
// forever, on every page load. This caps initial render to pageSize and
// reveals more on demand, same "simple, not over-engineered" pattern
// used elsewhere in this build — real virtualization (react-window,
// etc.) only makes sense once there's a backend serving genuinely paged
// data; this is the right-sized fix for a client-only prototype.
export function usePagedList<T>(items: T[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const loadMore = () => setVisibleCount((c) => c + pageSize);

  return { visible, hasMore, loadMore };
}
