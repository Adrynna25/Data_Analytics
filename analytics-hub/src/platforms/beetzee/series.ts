import { hashString, mulberry32 } from '@/shared/chart';
import { MONTHS } from '@/shared/format';
import type { BzPeriod } from './data';

export interface Series {
  labels: string[];
  values: number[];
}

const COUNTS: Record<BzPeriod, number> = { daily: 12, monthly: 31, yearly: 12 };

function labelFor(period: BzPeriod, i: number): string {
  if (period === 'daily') {
    const h = i * 2;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${h < 12 ? 'AM' : 'PM'}`;
  }
  if (period === 'monthly') return `May ${i + 1}`;
  return MONTHS[i];
}

/** Seasonal shape for each period: evening peak, weekend bumps, October peak. */
function seasonal(period: BzPeriod, i: number): number {
  if (period === 'daily') {
    const h = i * 2;
    if (h < 6) return 0.5;
    if (h === 20) return 1.5;
    if (h === 18 || h === 22) return 1.25;
    return 1;
  }
  if (period === 'monthly') {
    const dow = new Date(2025, 4, i + 1).getDay();
    return dow === 0 || dow === 6 ? 1.18 : 1;
  }
  if (i === 9) return 1.38; // October
  if (i === 8 || i === 10) return 1.12;
  return 1;
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

/** Evenly sample a series down to `count` points for sparklines. */
export function sparkline(values: number[], count = 12): number[] {
  if (values.length <= count) return values;
  return Array.from({ length: count }, (_, i) => values[Math.round((i * (values.length - 1)) / (count - 1))]);
}
