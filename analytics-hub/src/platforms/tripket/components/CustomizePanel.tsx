import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Kpi } from '../data';

export function CustomizePanel({
  kpis,
  selected,
  onToggle,
  onReset,
  onDone,
}: {
  kpis: Kpi[];
  selected: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
  onDone: () => void;
}) {
  return (
    <section
      aria-label="Customize KPIs"
      className="mb-5 animate-rise-in rounded-xl border border-dashed border-primary/55 bg-primary/[0.04] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[15px] font-extrabold">Choose the KPIs on this page</h2>
          <p className="mt-0.5 text-xs text-subtle" aria-live="polite">
            {selected.length} of {kpis.length} shown · saved in this browser
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset to default
          </Button>
          <Button size="sm" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {kpis.map((k) => {
          const on = selected.includes(k.id);
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(k.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                on
                  ? 'border-primary/60 bg-primary/15 text-foreground'
                  : 'border-border-strong text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {on ? <Check aria-hidden className="h-3.5 w-3.5 text-brand2" strokeWidth={2.2} /> : <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={2.2} />}
              {k.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
