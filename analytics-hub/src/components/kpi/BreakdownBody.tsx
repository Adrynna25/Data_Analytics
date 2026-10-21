import { Calculator, Check } from 'lucide-react';
import { DeltaPill } from './DeltaPill';
import type { KpiData } from './types';

/** "Overall" box: value, detail, and change vs. the previous period. */
export function BreakdownSummary({ kpi, comparison }: { kpi: KpiData; comparison: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-soft p-4">
      <div>
        <p className="text-[11.5px] font-semibold text-subtle">Overall</p>
        <p className="font-display text-[26px] font-extrabold leading-tight">{kpi.value}</p>
        <p className="text-xs text-faint">{kpi.detail}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <DeltaPill direction={kpi.direction} change={kpi.change} tone={kpi.tone} />
        <span className="text-[11px] text-subtle">{comparison}</span>
      </div>
    </div>
  );
}

/** How it's built → factors (with real-share bars) → reconciliation → context. */
export function BreakdownFactors({ kpi }: { kpi: KpiData }) {
  const b = kpi.breakdown;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">How it’s calculated</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{b.method}</p>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-[11px] font-bold uppercase tracking-wider text-subtle">
            <th scope="col" className="pb-2 text-left font-bold">Factor</th>
            <th scope="col" className="pb-2 text-right font-bold">Value</th>
          </tr>
        </thead>
        <tbody>
          {b.factors.map((f) => (
            <tr key={f.label} className="border-t border-border">
              <td className="py-3 pr-4">
                <span className="block text-[13px] font-semibold">{f.label}</span>
                {f.detail && <span className="mt-0.5 block text-[11.5px] text-subtle">{f.detail}</span>}
                {f.share !== undefined && (
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-soft-hover">
                    <span
                      className="block h-full rounded-full bg-[linear-gradient(90deg,rgb(var(--chart-1)),rgb(var(--chart-2)))]"
                      style={{ width: `${Math.max(2, Math.min(100, f.share))}%` }}
                    />
                  </span>
                )}
              </td>
              <td className="py-3 text-right align-top font-display text-[15px] font-extrabold">{f.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/5 px-3.5 py-3">
        <Calculator aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={1.8} />
        <p className="text-[12.5px] font-semibold leading-relaxed">
          <span className="sr-only">Reconciliation: </span>
          {b.reconcile}
          <Check aria-label="reconciles" className="ml-1.5 inline h-3.5 w-3.5 text-success" strokeWidth={2.4} />
        </p>
      </div>

      {b.context && b.context.length > 0 && (
        <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
          {b.context.map((c) => (
            <div key={c.label} className="rounded-lg border border-border px-3 py-2">
              <dt className="text-[11px] font-semibold text-subtle">{c.label}</dt>
              <dd className="text-[13px] font-bold">{c.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function BreakdownTakeaway({ kpi, comparison }: { kpi: KpiData; comparison: string }) {
  const b = kpi.breakdown;
  const lead = b.factors.reduce<(typeof b.factors)[number] | undefined>(
    (best, f) => (f.share !== undefined && (best?.share === undefined || f.share > best.share) ? f : best),
    undefined,
  );
  const first = b.takeaway ?? (lead ? `${lead.label} is the biggest factor (${lead.value}).` : '');
  return (
    <p className="max-w-[520px] text-[12.5px] leading-relaxed text-muted-foreground">
      <strong className="text-foreground">Takeaway:</strong> {first} The KPI is {kpi.direction} {kpi.change} {comparison}.
    </p>
  );
}
