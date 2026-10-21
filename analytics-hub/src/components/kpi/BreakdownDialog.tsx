import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/shared/Icon';
import { cn } from '@/lib/utils';
import { BreakdownFactors, BreakdownSummary, BreakdownTakeaway } from './BreakdownBody';
import type { KpiData } from './types';

/** On-demand KPI breakdown (a bottom sheet on mobile), shared by both dashboards. */
export function BreakdownDialog({
  kpi,
  eyebrow,
  comparison,
  onClose,
  doneClassName,
}: {
  kpi: KpiData | null;
  eyebrow: string;
  comparison: string;
  onClose: () => void;
  doneClassName?: string;
}) {
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand2">{eyebrow}</p>
              <DialogTitle className="mt-1 font-display text-lg font-extrabold">{kpi.label}</DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close breakdown" className="-mr-1 -mt-1 h-8 w-8 text-muted-foreground">
                <X />
              </Button>
            </DialogClose>
          </div>

          <div className="p-5">
            <DialogDescription className="sr-only">{kpi.detail}</DialogDescription>
            <BreakdownSummary kpi={kpi} comparison={comparison} />
            <div className="mt-5">
              <BreakdownFactors kpi={kpi} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 max-[560px]:flex-col max-[560px]:items-stretch">
            <BreakdownTakeaway kpi={kpi} comparison={comparison} />
            <DialogClose asChild>
              <Button className={cn(doneClassName)}>Done</Button>
            </DialogClose>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
