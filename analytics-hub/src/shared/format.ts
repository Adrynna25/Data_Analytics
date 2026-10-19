/** Formatting helpers shared by both dashboards (₱, K/M, %). */

const trim = (n: number, digits: number) => n.toFixed(digits).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1');

/** 1_520_000 → "1.52M", 239_600 → "239.6K", 587 → "587". */
export function compact(n: number, digits = 1): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${trim(n / 1e9, 2)}B`;
  if (abs >= 1e6) return `${trim(n / 1e6, 2)}M`;
  if (abs >= 1e3) return `${trim(n / 1e3, digits)}K`;
  return trim(n, 0);
}

/** Philippine peso, compact by default: ₱4.82M, ₱496K, ₱87.86 with `exact`. */
export function peso(n: number, opts: { exact?: boolean } = {}): string {
  if (opts.exact) {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₱${compact(n)}`;
}

export function percent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

/** Signed percentage change, e.g. +12.4% / −3.1% (true minus sign). */
export function signedPercent(n: number, digits = 1): string {
  const s = Math.abs(n).toFixed(digits);
  return n < 0 ? `−${s}%` : `+${s}%`;
}

export function integer(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2025-05-31" → { y, m, d } without timezone drift. */
function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Human date range: "May 31, 2025", "May 1 – May 31, 2025", "Dec 28, 2024 – Jan 3, 2025". */
export function formatDateRange(from: string, to: string): string {
  const a = parseISODate(from);
  const b = parseISODate(to);
  if (from === to) return `${MONTHS[a.m - 1]} ${a.d}, ${a.y}`;
  if (a.y === b.y) return `${MONTHS[a.m - 1]} ${a.d} – ${MONTHS[b.m - 1]} ${b.d}, ${b.y}`;
  return `${MONTHS[a.m - 1]} ${a.d}, ${a.y} – ${MONTHS[b.m - 1]} ${b.d}, ${b.y}`;
}

export { MONTHS };
