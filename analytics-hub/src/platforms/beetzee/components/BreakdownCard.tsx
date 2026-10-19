import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BzKpi } from '../model';

const STRIPES = ['rgb(var(--chart-1))', 'rgb(var(--chart-2))', 'rgb(var(--chart-3))', 'rgb(var(--chart-5))'];

export function BreakdownCard({ kpi, onClose }: { kpi: BzKpi; onClose: () => void }) {
  const b = kpi.breakdown;
  return (
    <section id="bz-breakdown" aria-labelledby="bz-breakdown-title" className="bz-card mt-4 animate-rise-in p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="bz-breakdown-title" className="text-base font-extrabold">
            {b.title} breakdown
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{b.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="shrink-0 border-border-strong">
          <X strokeWidth={2} /> Close
        </Button>
      </div>

      <div
        className={cn(
          'mt-4 grid gap-3',
          b.metrics.length === 3 ? 'grid-cols-3 max-[700px]:grid-cols-1' : 'grid-cols-2 max-[480px]:grid-cols-1',
        )}
      >
        {b.metrics.map((m, i) => (
          <div key={m.label} className="relative overflow-hidden rounded-[11px] border border-border bg-soft py-3 pl-4 pr-3">
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: STRIPES[i % STRIPES.length] }} />
            <p className="text-[11px] font-semibold text-subtle">{m.label}</p>
            <p className="mt-1 text-lg font-extrabold">{m.value}</p>
            {m.note && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{m.note}</p>}
          </div>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-[12.5px] max-[700px]:grid-cols-1">
        {(
          [
            ['What it shows', b.method.shows],
            ['Calculation', b.method.calc],
            ['Data source', b.method.source],
          ] as const
        ).map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10.5px] font-bold uppercase tracking-[1px] text-subtle">{k}</dt>
            <dd className="mt-1 text-muted-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
