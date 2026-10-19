import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { areaPath, catmullRomPath, nearestIndex } from '@/shared/chart';
import { compact, integer, signedPercent } from '@/shared/format';
import { useElementWidth } from '@/shared/useElementWidth';

const H = 260;
const PAD = { top: 16, right: 16, bottom: 30, left: 44 };
const Y_MAX = 15000;
const Y_TICKS = [0, 5000, 10000, 15000];
const X_LABEL_DAYS = [1, 8, 15, 22, 31];

/** Daily confirmed bookings: smooth orange line + area, previous period dashed. */
export function BookingsChart({ current, previous, month }: { current: number[]; previous: number[]; month: string }) {
  const [wrap, setWrap] = useState<HTMLDivElement | null>(null);
  const W = Math.max(280, useElementWidth(wrap, 720));
  const [hover, setHover] = useState<number | null>(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const baseline = PAD.top + innerH;
  const x = (i: number) => PAD.left + (innerW * i) / (current.length - 1);
  const y = (v: number) => PAD.top + innerH * (1 - v / Y_MAX);

  const { line, area, prevLine } = useMemo(() => {
    const pts = current.map((v, i) => ({ x: x(i), y: y(v) }));
    const prevPts = previous.map((v, i) => ({ x: x(i), y: y(v) }));
    const l = catmullRomPath(pts);
    return { line: l, area: areaPath(l, pts, baseline), prevLine: catmullRomPath(prevPts) };
  }, [current, previous, W]);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHover(nearestIndex(e.clientX - rect.left, PAD.left, innerW, current.length));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      setHover((h) => Math.max(0, Math.min(current.length - 1, (h ?? (d > 0 ? -1 : current.length)) + d)));
    }
  };

  const tip =
    hover !== null
      ? {
          day: hover + 1,
          n: current[hover],
          delta: ((current[hover] - previous[hover]) / previous[hover]) * 100,
        }
      : null;
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover), 90), W - 90) : 0;

  return (
    <div ref={setWrap} className="relative w-full">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        tabIndex={0}
        aria-label={`Daily confirmed bookings for ${month} 2025, rising from ${compact(current[0])} to ${compact(current[current.length - 1])}. Use arrow keys to inspect days.`}
        className="block touch-pan-y rounded-md"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <defs>
          <linearGradient id="tp-bookings-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Y_TICKS.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#ffffff12" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#807a76">
              {t === 0 ? '0' : compact(t)}
            </text>
          </g>
        ))}
        {X_LABEL_DAYS.map((d) => (
          <text key={d} x={x(d - 1)} y={H - 8} textAnchor={d === 1 ? 'start' : d === 31 ? 'end' : 'middle'} fontSize="11" fill="#807a76">
            {month} {d}
          </text>
        ))}

        <path d={prevLine} fill="none" stroke="#807a76" strokeWidth="1.6" strokeDasharray="5 5" opacity="0.8" />
        <path d={area} fill="url(#tp-bookings-area)" />
        <path d={line} fill="none" stroke="#f97316" strokeWidth="2.4" strokeLinecap="round" />

        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={baseline} stroke="#fb923c" strokeOpacity="0.55" />
            <circle cx={x(hover)} cy={y(previous[hover])} r="3.5" fill="#0d0c0b" stroke="#807a76" strokeWidth="1.6" />
            <circle cx={x(hover)} cy={y(current[hover])} r="5" fill="#0d0c0b" stroke="#f97316" strokeWidth="2.4" />
          </g>
        )}
      </svg>

      {tip && (
        <div
          role="status"
          className="pointer-events-none absolute top-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-strong bg-[#1a1613f2] px-3 py-2 text-xs shadow-lg"
          style={{ left: tipLeft }}
        >
          <span className="font-semibold text-muted-foreground">
            {month} {tip.day}
          </span>
          {' · '}
          <span className="font-bold">{integer(tip.n)} bookings</span>
          {' · '}
          <span className={tip.delta >= 0 ? 'text-success' : 'text-brand2'}>{signedPercent(tip.delta)} vs. previous</span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-4 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded bg-primary" /> This month
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0 w-4 border-t-2 border-dashed border-subtle" /> Previous period
        </span>
      </div>
    </div>
  );
}
