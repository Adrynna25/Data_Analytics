import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { areaPath, catmullRomPath, nearestIndex, niceMax } from '@/shared/chart';
import { useElementWidth } from '@/shared/useElementWidth';

/** Brand accent colors as theme tokens, so they adapt to light and dark mode. */
export const ACCENT_HEX = {
  gold: 'rgb(var(--chart-1))',
  orange: 'rgb(var(--chart-2))',
  teal: 'rgb(var(--chart-3))',
  violet: 'rgb(var(--chart-4))',
  coral: 'rgb(var(--danger))',
  blue: 'rgb(var(--chart-5))',
} as const;

export interface LineSeries {
  key: string;
  label: string;
  values: number[];
  color: string;
  area?: boolean;
}

const PAD = { top: 14, right: 18, bottom: 28, left: 52 };

/** Multi-series smooth line chart: nice y-axis (0/25/50/75/100%), hover crosshair, endpoint dots. */
export function TrendChart({
  series,
  labels,
  format,
  height = 240,
  ariaLabel,
}: {
  series: LineSeries[];
  labels: string[];
  format: (n: number) => string;
  height?: number;
  ariaLabel: string;
}) {
  const [wrap, setWrap] = useState<HTMLDivElement | null>(null);
  const W = Math.max(260, useElementWidth(wrap, 720));
  const H = height;
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const baseline = PAD.top + innerH;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)));
  const x = (i: number) => PAD.left + (innerW * i) / (n - 1);
  const y = (v: number) => PAD.top + innerH * (1 - v / max);

  const paths = useMemo(
    () =>
      series.map((s) => {
        const pts = s.values.map((v, i) => ({ x: x(i), y: y(v) }));
        const line = catmullRomPath(pts);
        return { ...s, pts, line, areaD: s.area ? areaPath(line, pts, baseline) : null };
      }),
    [series, W, H, max],
  );

  const labelEvery = n > 12 ? Math.ceil(n / (W < 480 ? 4 : 7)) : W < 480 ? 2 : 1;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHover(nearestIndex(e.clientX - rect.left, PAD.left, innerW, n));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const d = e.key === 'ArrowRight' ? 1 : -1;
    setHover((h) => Math.max(0, Math.min(n - 1, (h ?? (d > 0 ? -1 : n)) + d)));
  };
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover), 80), W - 80) : 0;

  return (
    <div ref={setWrap} className="relative w-full">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        tabIndex={0}
        aria-label={`${ariaLabel}. Use arrow keys to inspect points.`}
        className="block touch-pan-y rounded-md"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <defs>
          {paths.map((s) => (
            <linearGradient key={s.key} id={`bz-area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopOpacity="0.32" style={{ stopColor: s.color }} />
              <stop offset="100%" stopOpacity="0" style={{ stopColor: s.color }} />
            </linearGradient>
          ))}
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(max * f)} y2={y(max * f)} style={{ stroke: 'var(--border)' }} strokeDasharray={f === 0 ? undefined : '3 4'} />
            <text x={PAD.left - 10} y={y(max * f) + 4} textAnchor="end" fontSize="10.5" style={{ fill: 'rgb(var(--subtle))' }}>
              {f === 0 ? '0' : format(max * f)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text
              key={l}
              x={x(i)}
              y={H - 8}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              fontSize="10.5"
              style={{ fill: 'rgb(var(--subtle))' }}
            >
              {i !== n - 1 && n - 1 - i < labelEvery / 2 ? '' : l}
            </text>
          ) : null,
        )}
        {paths.map((s) => s.areaD && <path key={`a-${s.key}`} d={s.areaD} fill={`url(#bz-area-${s.key})`} />)}
        {paths.map((s) => (
          <path key={`l-${s.key}`} d={s.line} fill="none" style={{ stroke: s.color }} strokeWidth="2.4" strokeLinecap="round" />
        ))}
        {paths.map((s) => {
          const p = s.pts[s.pts.length - 1];
          return <circle key={`e-${s.key}`} cx={p.x} cy={p.y} r="4.5" strokeWidth="2" style={{ fill: s.color, stroke: 'rgb(var(--background))' }} />;
        })}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={baseline} style={{ stroke: 'rgb(var(--muted-foreground))' }} strokeOpacity="0.45" />
            {paths.map((s) => (
              <circle key={`h-${s.key}`} cx={x(hover)} cy={y(s.values[hover])} r="5" strokeWidth="2.4" style={{ fill: 'rgb(var(--background))', stroke: s.color }} />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-strong bg-[var(--tooltip)] px-3 py-2 text-xs shadow-lg"
          style={{ left: tipLeft }}
        >
          <p className="font-semibold text-muted-foreground">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.key} className="mt-0.5 flex items-center gap-1.5 font-bold">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}: {format(s.values[hover])}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ slices, centerLabel, centerValue }: { slices: DonutSlice[]; centerLabel: string; centerValue: string }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const total = slices.reduce((a, s) => a + s.value, 0);
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={slices.map((s) => `${s.label} ${s.value}%`).join(', ')}>
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="11" style={{ stroke: 'var(--accent)' }} />
          {slices.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                style={{ stroke: s.color }}
                strokeWidth="11"
                strokeDasharray={`${Math.max(0, len - 1.2)} ${C}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-extrabold">{centerValue}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{centerLabel}</span>
        </div>
      </div>
      <ul className="grid min-w-[160px] flex-1 gap-2.5">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 font-semibold">
              <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-bold">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Semi-circular uptime gauge. */
export function Gauge({ value, label }: { value: number; label: string }) {
  const R = 40;
  const half = Math.PI * R;
  return (
    <div className="relative mx-auto w-[180px]">
      <svg viewBox="0 0 100 56" className="w-full" role="img" aria-label={`${label} ${value}%`}>
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" strokeWidth="9" strokeLinecap="round" style={{ stroke: 'var(--accent)' }} />
        <path
          d="M10 50 A40 40 0 0 1 90 50"
          fill="none"
          style={{ stroke: 'rgb(var(--chart-3))' }}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * half} ${half}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-2xl font-extrabold">{value}%</p>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-subtle">{label}</p>
      </div>
    </div>
  );
}
