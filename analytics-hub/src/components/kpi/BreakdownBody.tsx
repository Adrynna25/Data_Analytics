import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { DeltaPill } from './DeltaPill';
import type { Factor, KpiBreakdown, KpiData } from './types';

/**
 * A KPI breakdown laid out like a short report:
 * Summary → How it's measured → Breakdown (reconciled) → At a glance → What it means.
 */
export function BreakdownReport({ kpi, comparison }: { kpi: KpiData; comparison: string }) {
  const b = kpi.breakdown;
  const lead = largest(b.factors);
  const glance = atAGlance(b);

  return (
    <div className="space-y-6">
      <Part title="Summary">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-soft p-4">
          <div>
            <p className="font-display text-[26px] font-extrabold leading-tight">{kpi.value}</p>
            <p className="text-xs text-faint">{kpi.detail}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <DeltaPill direction={kpi.direction} change={kpi.change} tone={kpi.tone} />
            <span className="text-[11px] text-subtle">{comparison}</span>
          </div>
        </div>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
          {kpi.label} is <strong className="text-foreground">{kpi.value}</strong>, {kpi.direction} {kpi.change} {comparison},{' '}
          {kpi.tone === 'good' ? 'which is good news.' : 'which needs attention.'}
        </p>
      </Part>

      <Part title="How it’s measured">
        <p className="text-[13px] leading-relaxed text-muted-foreground">{b.method}</p>
      </Part>

      <Part>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-subtle">
              <th scope="col" className="pb-2 text-left font-bold">{b.dimension}</th>
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
          <tfoot>
            <tr className="border-t-2 border-border-strong">
              <th scope="row" className="pt-3 text-left text-[13px] font-bold">
                {RESULT_LABEL[b.kind]}
              </th>
              <td className="pt-3 text-right font-display text-[15px] font-extrabold">{kpi.value}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-[12px] font-semibold leading-relaxed">
          <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.4} />
          <span>
            <span className="sr-only">Check: </span>
            {b.reconcile}
          </span>
        </p>
      </Part>

      {(glance.length > 0 || (b.context && b.context.length > 0)) && (
        <Part title="At a glance">
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
            {[...glance, ...(b.context ?? [])].map((c) => (
              <div key={c.label} className="rounded-lg border border-border px-3 py-2">
                <dt className="text-[11px] font-semibold text-subtle">{c.label}</dt>
                <dd className="text-[13px] font-bold">{c.value}</dd>
              </div>
            ))}
          </dl>
        </Part>
      )}

      <Part title="What it means">
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-foreground">Finding:</strong>{' '}
            {b.takeaway ?? (lead ? `${lead.label} is the biggest part (${lead.value}).` : `${kpi.label} is ${kpi.value}.`)}
          </li>
          <li>
            <strong className="text-foreground">Recommendation:</strong>{' '}
            {kpi.tone === 'good'
              ? `On track. ${lead ? `Keep an eye on ${lead.label}, which drives most of this number.` : 'Keep the current approach.'}`
              : `Needs attention. ${lead ? `Start with ${lead.label}.` : 'Review the inputs above.'}`}
          </li>
        </ul>
      </Part>
    </div>
  );
}

const RESULT_LABEL: Record<KpiBreakdown['kind'], string> = {
  sum: 'Total',
  weighted: 'Weighted average',
  ratio: 'Result',
  product: 'Overall conversion',
  share: 'Leader',
};

/** A report section. The breakdown table has no heading: its first column names the dimension. */
function Part({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title && <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-subtle">{title}</h3>}
      {children}
    </section>
  );
}

function largest(factors: Factor[]) {
  return factors.reduce<Factor | undefined>(
    (best, f) => (f.share !== undefined && (best?.share === undefined || f.share > best.share) ? f : best),
    undefined,
  );
}

/** "₱36.2M" → { prefix: '₱', n: 36_200_000, unit: '', scaled: true }, "1.2%" → { unit: '%' }. */
function parse(value: string) {
  const m = value.match(/^(₱?)(-?[\d,]*\.?\d+)([KMB]?)(.*)$/);
  if (!m) return null;
  const mult = { '': 1, K: 1e3, M: 1e6, B: 1e9 }[m[3] as '' | 'K' | 'M' | 'B'];
  const decimals = (m[2].split('.')[1] ?? '').length;
  return { prefix: m[1], n: parseFloat(m[2].replace(/,/g, '')) * mult, unit: m[4], scaled: m[3] !== '', decimals };
}

const trim = (n: number, d: number) => n.toFixed(d).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1');

/** Largest, smallest, average and range — only where the parts share a unit and the stats mean something. */
function atAGlance(b: KpiBreakdown): { label: string; value: string }[] {
  if (!['sum', 'weighted', 'share'].includes(b.kind) || b.factors.length < 3) return [];
  const parsed = b.factors.map((f) => parse(f.value));
  if (parsed.some((p) => !p)) return [];
  const ps = parsed as NonNullable<ReturnType<typeof parse>>[];
  if (ps.some((p) => p.prefix !== ps[0].prefix || p.unit !== ps[0].unit)) return [];

  const scaled = ps.some((p) => p.scaled);
  const decimals = Math.max(...ps.map((p) => p.decimals));
  const fmt = (n: number) => {
    const body = scaled
      ? n >= 1e6
        ? `${trim(n / 1e6, 2)}M`
        : n >= 1e3
          ? `${trim(n / 1e3, 1)}K`
          : trim(n, 0)
      : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${ps[0].prefix}${body}${ps[0].unit}`;
  };

  const values = ps.map((p) => p.n);
  const hi = values.indexOf(Math.max(...values));
  const lo = values.indexOf(Math.min(...values));
  const out = [
    { label: 'Largest', value: `${b.factors[hi].label} · ${b.factors[hi].value}` },
    { label: 'Smallest', value: `${b.factors[lo].label} · ${b.factors[lo].value}` },
  ];
  if (b.kind === 'sum') out.push({ label: `Average per ${b.dimension.toLowerCase()}`, value: fmt(values.reduce((a, v) => a + v, 0) / values.length) });
  out.push({ label: 'Range (largest − smallest)', value: fmt(values[hi] - values[lo]) });
  return out;
}
