import { ArrowUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BzKpi } from '../model';
import { ACCENT_HEX, Sparkline } from './charts';

export function TrendPill({ trend, good }: { trend: number; good: boolean }) {
  const up = trend >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold',
        good ? 'bg-[var(--bz-teal-soft)] text-success' : 'bg-[var(--bz-coral-soft)] text-danger',
      )}
    >
      <ArrowUp aria-hidden strokeWidth={2.4} className={cn('h-3 w-3', !up && 'rotate-180')} />
      <span className="sr-only">{up ? 'up' : 'down'} </span>
      {Math.abs(trend).toFixed(1)}%
    </span>
  );
}

export function KpiTile({
  kpi,
  comparison,
  selected,
  onToggle,
}: {
  kpi: BzKpi;
  comparison: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const color = ACCENT_HEX[kpi.accent];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={selected}
      aria-controls="bz-breakdown"
      className={cn(
        'bz-card group relative flex min-w-0 flex-col overflow-hidden p-4 pl-5 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[#4e3a66]',
        selected && '!border-[#4e3a66] ring-1 ring-inset ring-[#e167ff55]',
      )}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-7 -top-7 h-20 w-20 rounded-full"
        style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
      />
      <span className="relative flex items-start justify-between gap-2">
        <span className="text-[12px] font-semibold text-muted-foreground">{kpi.label}</span>
        <ChevronDown
          aria-hidden
          strokeWidth={2}
          className={cn('h-4 w-4 shrink-0 text-subtle transition-transform', selected && 'rotate-180 text-[#e167ff]')}
        />
      </span>
      <span className="relative mt-1.5 truncate text-[27px] font-extrabold leading-tight tracking-tight">{kpi.value}</span>
      <span className="relative mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <TrendPill trend={kpi.trend} good={kpi.good} />
        <span className="text-[11px] text-subtle">{comparison}</span>
      </span>
      {kpi.spark && (
        <span className="relative mt-3 block">
          <Sparkline values={kpi.spark} color={color} />
        </span>
      )}
    </button>
  );
}
