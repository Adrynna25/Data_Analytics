import { hashString, mulberry32 } from '@/shared/chart';
import type { BzPeriod } from './data';

export interface Series {
  labels: string[];
  values: number[];
}

const COUNTS: Record<BzPeriod, number> = { daily: 12, weekly: 7, monthly: 31 };

function labelFor(period: BzPeriod, i: number): string {
  if (period === 'daily') {
    const h = i * 2;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${h < 12 ? 'AM' : 'PM'}`;
  }
  if (period === 'weekly') return `May ${25 + i}`;
  return `May ${i + 1}`;
}

/** Seasonal shape for each period: evening peak (daily), weekend bumps (weekly, monthly). */
function seasonal(period: BzPeriod, i: number): number {
  if (period === 'daily') {
    const h = i * 2;
    if (h < 6) return 0.5;
    if (h === 20) return 1.5;
    if (h === 18 || h === 22) return 1.25;
    return 1;
  }
  // Weekly covers May 25–31, monthly May 1–31: weekends get a bump.
  const day = period === 'weekly' ? 25 + i : i + 1;
  const dow = new Date(2025, 4, day).getDay();
  return dow === 0 || dow === 6 ? 1.18 : 1;
}

/**
 * Deterministic sample series for a metric and period. Points sum exactly to
 * `total`, with a gentle upward trend and the period's seasonal shape.
 */
export function buildSeries(total: number, period: BzPeriod, key: string): Series {
  const n = COUNTS[period];
  const rand = mulberry32(hashString(`${key}:${period}`));
  const weights = Array.from({ length: n }, (_, i) => {
    const trend = 1 + 0.32 * (i / (n - 1));
    const noise = 1 + (rand() - 0.5) * 0.16;
    return trend * noise * seasonal(period, i);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const values = weights.map((w) => Math.round((w / sum) * total));
  const diff = total - values.reduce((a, b) => a + b, 0);
  values[n - 1] += diff;
  return { labels: Array.from({ length: n }, (_, i) => labelFor(period, i)), values };
}
