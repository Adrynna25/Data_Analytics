import type { CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/shared/Icon';
import { DeltaPill } from './DeltaPill';
import type { KpiData } from './types';

/**
 * KPI card used by both dashboards: icon, "Breakdown ›", label, value, change pill,
 * comparison and a detail line. The whole card opens the KPI's breakdown.
 * `surfaceClassName` supplies the platform's card surface (tp-card / bz-card).
 * `featured` makes a key-result card: accent border and glow, larger label and value.
 */
export function KpiCard({
  kpi,
  comparison,
  index,
  onOpen,
  surfaceClassName,
  featured = false,
}: {
  kpi: KpiData;
  comparison: string;
  index: number;
  onOpen: (k: KpiData) => void;
  surfaceClassName: string;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(kpi)}
      aria-label={`${kpi.label}: ${kpi.value}, ${kpi.direction} ${kpi.change} ${comparison}. Open breakdown`}
      style={{ animationDelay: `${index * 45}ms` } as CSSProperties}
      className={cn(
        surfaceClassName,
        'group flex min-w-0 animate-rise-in flex-col p-[18px] text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/40',
        featured &&
          '!border-primary/45 bg-[linear-gradient(145deg,rgb(var(--primary)/0.14),transparent_70%)] p-5 shadow-[0_0_0_1px_rgb(var(--primary)/0.12),0_12px_32px_-12px_rgb(var(--primary)/0.45)]',
      )}
    >
      <span className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/15 text-brand2 ring-1 ring-inset ring-primary/25">
          <Icon name={kpi.icon} size={18} />
        </span>
        <span className="inline-flex items-center text-[11.5px] font-semibold text-subtle transition-colors group-hover:text-brand2">
          Breakdown <ChevronRight aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </span>
      <span className={cn('mt-4 font-semibold', featured ? 'text-[13.5px] text-foreground' : 'text-[12.5px] text-muted-foreground')}>
        {kpi.label}
      </span>
      <span className={cn('mt-1 truncate font-display font-extrabold tracking-tight', featured ? 'text-[34px] leading-tight' : 'text-2xl')}>
        {kpi.value}
      </span>
      <span className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <DeltaPill direction={kpi.direction} change={kpi.change} tone={kpi.tone} />
        <span className="text-[11.5px] text-subtle">{comparison}</span>
      </span>
      <span className="mt-3 border-t border-border pt-2.5 text-[11.5px] text-faint">{kpi.detail}</span>
    </button>
  );
}
