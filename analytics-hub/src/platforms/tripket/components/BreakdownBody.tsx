import type { Kpi } from '../data';
import { DeltaPill } from './DeltaPill';

const BAR_WIDTHS = [100, 86, 72, 58];

/** "Overall" box: value, detail, and change vs. the previous period. */
export function BreakdownSummary({ kpi, unit }: { kpi: Kpi; unit: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-soft p-4">
      <div>
        <p className="text-[11.5px] font-semibold text-subtle">Overall</p>
        <p className="font-display text-[26px] font-extrabold leading-tight">{kpi.value}</p>
        <p className="text-xs text-faint">{kpi.detail}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <DeltaPill direction={kpi.direction} change={kpi.change} />
        <span className="text-[11px] text-subtle">vs. previous {unit}</span>
      </div>
    </div>
  );
}

/** Four-row "Breakdown / Result" table with the orange bars. */
export function BreakdownTable({ kpi }: { kpi: Kpi }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[11px] font-bold uppercase tracking-wider text-subtle">
          <th scope="col" className="pb-2 text-left font-bold">Breakdown</th>
          <th scope="col" className="pb-2 text-right font-bold">Result</th>
        </tr>
      </thead>
      <tbody>
        {kpi.breakdown.map((row, i) => (
          <tr key={row.label} className="border-t border-border">
            <td className="py-3 pr-4">
              <span className="block text-[13px] font-semibold">{row.label}</span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-soft-hover">
                <span className="tp-bar block h-full rounded-full" style={{ width: `${BAR_WIDTHS[i] ?? 50}%` }} />
              </span>
            </td>
            <td className="py-3 text-right align-top font-display text-[15px] font-extrabold">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BreakdownTakeaway({ kpi, unit }: { kpi: Kpi; unit: string }) {
  const lead = kpi.breakdown[0];
  if (!lead) return null;
  return (
    <p className="max-w-[520px] text-[12.5px] leading-relaxed text-muted-foreground">
      <strong className="text-foreground">Takeaway:</strong> {lead.label} leads this breakdown at {lead.value}. The KPI is{' '}
      {kpi.direction} {kpi.change} vs. the previous {unit}.
    </p>
  );
}
