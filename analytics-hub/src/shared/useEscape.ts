import { useEffect, useRef } from 'react';

/**
 * Document-level Escape handler for a dashboard. Overlays (switcher menu,
 * dialogs, popovers) handle Escape first and mark the event as handled with
 * preventDefault(), so this only fires when nothing above it consumed the key.
 */
export function useEscape(handler: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      ref.current(e);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enabled]);
}
