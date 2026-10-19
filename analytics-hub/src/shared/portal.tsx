import { createContext, useContext } from 'react';

/**
 * Radix portals render into the active dashboard root instead of <body>, so
 * overlays inherit that platform's theme tokens and unmount with it.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer() {
  return useContext(PortalContainerContext) ?? undefined;
}
