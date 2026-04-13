import { useEffect, useMemo, useState } from "react";

type UseIncrementalRenderParams<T> = {
  items: T[];
  initialCount?: number;
  step?: number;
};

export function useIncrementalRender<T>({ items, initialCount = 30, step = 30 }: UseIncrementalRenderParams<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [initialCount, items.length]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  const showMore = () => {
    setVisibleCount((previous) => Math.min(previous + step, items.length));
  };

  return {
    visibleCount,
    visibleItems,
    hasMore,
    showMore,
  };
}
