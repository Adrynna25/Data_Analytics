import { useEffect, useRef, type RefObject } from 'react';

/** Calls `handler` on a pointer press outside every given element. */
export function useOutsideClick(
  refs: RefObject<HTMLElement | null>[],
  handler: (e: PointerEvent) => void,
  enabled = true,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const refsRef = useRef(refs);
  refsRef.current = refs;

  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (refsRef.current.some((r) => r.current?.contains(target))) return;
      handlerRef.current(e);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [enabled]);
}
