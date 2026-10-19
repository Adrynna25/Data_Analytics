/** Headless chart geometry: each platform draws its own SVG on top of these. */

export interface Pt {
  x: number;
  y: number;
}

/** Smooth path through points using Catmull-Rom → cubic Bézier conversion. */
export function catmullRomPath(points: Pt[], tension = 1): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Close a line path down to the baseline to make an area. */
export function areaPath(line: string, points: Pt[], baseline: number): string {
  if (!points.length) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${last.x},${baseline} L${first.x},${baseline} Z`;
}

/** "Nice" axis maximum that divides cleanly into quarters (ticks at 0/25/50/75/100%). */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10]) {
    if (m * mag >= max) return m * mag;
  }
  return 10 * mag;
}

/** Index of the point nearest to x (points are evenly spaced). */
export function nearestIndex(x: number, left: number, width: number, count: number): number {
  if (count <= 1) return 0;
  const step = width / (count - 1);
  return Math.max(0, Math.min(count - 1, Math.round((x - left) / step)));
}

/** Deterministic PRNG so sample series are stable across renders and reloads. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
