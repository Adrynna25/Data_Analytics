import { useEffect, useState } from 'react';

/** Tracks an element's content width with a ResizeObserver (disconnected on unmount). */
export function useElementWidth<T extends HTMLElement>(el: T | null, fallback = 640) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    if (!el) return;
    setWidth(el.clientWidth || fallback);
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, fallback]);
  return width;
}
