import { createContext, useContext } from 'react';
import type { PlatformId } from './session';
import type { PlatformMeta } from './platforms';

export interface PlatformContextValue {
  platformId: PlatformId;
  token: string;
  platforms: readonly PlatformMeta[];
  switchTo: (id: PlatformId) => void;
  /** True right after a user-initiated switch: the switcher trigger takes focus on mount. */
  focusSwitcherOnMount: boolean;
}

export const PlatformContext = createContext<PlatformContextValue | null>(null);

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside PlatformShell');
  return ctx;
}
