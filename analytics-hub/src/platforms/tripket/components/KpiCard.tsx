import type { CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import { Icon } from '@/shared/Icon';
import type { Kpi } from '../data';
import { DeltaPill } from './DeltaPill';

export function KpiCard({ kpi, unit, index, onOpen }: { kpi: Kpi; unit: string; index: number; onOpen: (k: Kpi) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(kpi)}
      aria-label={`${kpi.label}: ${kpi.value}, ${kpi.direction} ${kpi.change} vs. previous ${unit}. Open breakdown`}
      style={{ animationDelay: `${index * 45}ms` } as CSSProperties}
      className="tp-card group flex min-w-0 animate-rise-in flex-col p-[18px] text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/40"
    >
      <span className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/15 text-brand2 ring-1 ring-inset ring-primary/25">
          <Icon name={kpi.icon} size={18} />
        </span>
        <span className="inline-flex items-center text-[11.5px] font-semibold text-subtle transition-colors group-hover:text-brand2">
          Breakdown <ChevronRight aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </span>
      <span className="mt-4 text-[12.5px] font-semibold text-muted-foreground">{kpi.label}</span>
      <span className="mt-1 truncate font-display text-2xl font-extrabold tracking-tight">{kpi.value}</span>
      <span className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <DeltaPill direction={kpi.direction} change={kpi.change} />
        <span className="text-[11.5px] text-subtle">vs. previous {unit}</span>
      </span>
      <span className="mt-3 border-t border-border pt-2.5 text-[11.5px] text-faint">{kpi.detail}</span>
    </button>
  );
}
