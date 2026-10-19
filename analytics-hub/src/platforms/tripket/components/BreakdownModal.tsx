import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/shared/Icon';
import type { Kpi } from '../data';
import { DeltaPill } from './DeltaPill';

const BAR_WIDTHS = [100, 86, 72, 58];

export function BreakdownModal({
  kpi,
  rangeLabel,
  periodLabel,
  unit,
  onClose,
}: {
  kpi: Kpi | null;
  rangeLabel: string;
  periodLabel: string;
  unit: string;
  onClose: () => void;
}) {
  const lead = kpi?.breakdown[0];
  return (
    <Dialog open={kpi !== null} onOpenChange={(o) => !o && onClose()}>
      {kpi && (
        <DialogContent
          hideClose
          className="max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[600px] gap-0 overflow-y-auto border-border-strong bg-popover p-0 max-[780px]:bottom-0 max-[780px]:top-auto max-[780px]:w-full max-[780px]:max-w-none max-[780px]:translate-y-0 max-[780px]:rounded-b-none max-[780px]:data-[state=closed]:slide-out-to-bottom max-[780px]:data-[state=open]:slide-in-from-bottom max-[780px]:data-[state=closed]:zoom-out-100 max-[780px]:data-[state=open]:zoom-in-100"
        >
          <div className="flex items-start gap-3 border-b border-border p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-primary/15 text-brand2 ring-1 ring-inset ring-primary/25">
              <Icon name={kpi.icon} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand2">
                {rangeLabel} · {periodLabel}
              </p>
              <DialogTitle className="mt-1 font-display text-lg font-extrabold">{kpi.label}</DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close breakdown" className="-mr-1 -mt-1 h-8 w-8 text-muted-foreground">
                <X />
              </Button>
            </DialogClose>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-soft p-4">
              <div>
                <p className="text-[11.5px] font-semibold text-subtle">Overall</p>
                <p className="font-display text-[26px] font-extrabold leading-tight">{kpi.value}</p>
                <DialogDescription className="text-xs text-faint">{kpi.detail}</DialogDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <DeltaPill direction={kpi.direction} change={kpi.change} />
                <span className="text-[11px] text-subtle">vs. previous {unit}</span>
              </div>
            </div>

            <table className="mt-5 w-full text-sm">
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
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 max-[560px]:flex-col max-[560px]:items-stretch">
            {lead && (
              <p className="max-w-[420px] text-[12.5px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Takeaway:</strong> {lead.label} leads this breakdown at {lead.value}. The
                KPI is {kpi.direction} {kpi.change} vs. the previous {unit}.
              </p>
            )}
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
