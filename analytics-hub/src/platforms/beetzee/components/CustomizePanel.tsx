import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BzKpi } from '../model';

export function CustomizePanel({
  kpis,
  hidden,
  onToggle,
  onReset,
  onDone,
}: {
  kpis: BzKpi[];
  hidden: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
  onDone: () => void;
}) {
  const shown = kpis.filter((k) => !hidden.includes(k.id)).length;
  return (
    <section aria-label="Customize KPIs" className="mb-5 animate-rise-in rounded-[13px] border border-dashed border-chart-2/50 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold">Choose the KPIs on this page</h2>
          <p className="mt-0.5 text-xs text-subtle" aria-live="polite">
            {shown} of {kpis.length} shown · saved in this browser
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onReset} className="hover:bg-accent">
            Reset to default
          </Button>
          <Button size="sm" onClick={onDone} className="bz-btn-primary hover:opacity-90">
            Done
          </Button>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {kpis.map((k) => {
          const on = !hidden.includes(k.id);
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(k.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                on
                  ? 'border-chart-2/60 bg-primary/15 text-foreground'
                  : 'border-border-strong text-muted-foreground hover:border-chart-2/40 hover:text-foreground',
              )}
            >
              {on ? (
                <Check aria-hidden className="h-3.5 w-3.5 text-chart-2" strokeWidth={2.2} />
              ) : (
                <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={2.2} />
              )}
              {k.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
