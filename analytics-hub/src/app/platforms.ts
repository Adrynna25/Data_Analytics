import type { ComponentType } from 'react';
import type { PlatformId } from './session';
import { BeetzeeLogo, BeetzeeMark, TripketLogo, TripketMark } from './logos';
import { TripketApp } from '@/platforms/tripket/TripketApp';
import { loadTripketData } from '@/platforms/tripket/data';
import { BeetzeeApp } from '@/platforms/beetzee/BeetzeeApp';
import { loadBeetzeeData } from '@/platforms/beetzee/data';

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  subtitle: string;
  accent: string;
  bg: string;
  /** Page background in light mode. */
  bgLight: string;
  /** Full lockup for the switcher trigger. */
  Logo: ComponentType<{ width?: number }>;
  /** Square icon for the switcher menu tile. */
  Mark: ComponentType<{ size?: number }>;
}

export interface PlatformDef<D> extends PlatformMeta {
  /** Initial data load, run with the freshly exchanged token. Replace with a real API call. */
  load: (token: string) => Promise<D>;
  Component: ComponentType<{ data: D }>;
}

const definePlatform = <D,>(def: PlatformDef<D>) => def;

export const PLATFORMS = {
  beetzee: definePlatform({
    id: 'beetzee',
    name: 'Beetzee Play',
    subtitle: 'Short-drama streaming analytics',
    accent: '#a457ff',
    bg: '#0f0617',
    bgLight: '#faf7fe',
    Logo: BeetzeeLogo,
    Mark: BeetzeeMark,
    load: loadBeetzeeData,
    Component: BeetzeeApp,
  }),
  tripket: definePlatform({
    id: 'tripket',
    name: 'Tripket',
    subtitle: 'Ferry booking analytics',
    accent: '#f97316',
    bg: '#0d0c0b',
    bgLight: '#faf8f5',
    Logo: TripketLogo,
    Mark: TripketMark,
    load: loadTripketData,
    Component: TripketApp,
  }),
} satisfies Record<PlatformId, { id: PlatformId }>;

/** Menu order: Beetzee Play, then Tripket. */
export const PLATFORM_LIST: readonly PlatformMeta[] = [PLATFORMS.beetzee, PLATFORMS.tripket];

export function getPlatform(id: PlatformId): PlatformDef<unknown> {
  return PLATFORMS[id] as unknown as PlatformDef<unknown>;
}
