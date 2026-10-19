import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Icon } from '@/shared/Icon';
import { compact, signedPercent } from '@/shared/format';
import type { Kpi, TripketData, TripketView, WorkspaceSummary } from '../data';
import { BookingsChart } from './BookingsChart';
import { DeltaPill, StatusPill } from './DeltaPill';

function Section({ value, kicker, title, meta, children }: { value: string; kicker: string; title: string; meta: ReactNode; children: ReactNode }) {
  return (
    <AccordionItem value={value} className="tp-card overflow-hidden">
      <AccordionTrigger
        className="px-5 py-4 hover:bg-soft max-[560px]:flex-wrap"
        chevronClassName="text-subtle"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] font-bold uppercase tracking-[1.2px] text-brand2">{kicker}</span>
          <span className="mt-0.5 block font-display text-[15.5px] font-extrabold">{title}</span>
        </span>
        <span className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground max-[560px]:order-last max-[560px]:w-full max-[560px]:justify-start">
          {meta}
        </span>
      </AccordionTrigger>
      <AccordionContent className="border-t border-border px-5 pb-5 pt-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

export function OverviewSections({
  data,
  onOpenKpi,
  onNavigate,
}: {
  data: TripketData;
  onOpenKpi: (k: Kpi) => void;
  onNavigate: (v: TripketView) => void;
}) {
  const { current, previous, month } = data.bookings;
  const last = current[current.length - 1];
  const growth = ((last - previous[previous.length - 1]) / previous[previous.length - 1]) * 100;
  const workspaces = (['marketing', 'operators'] as const).map((id) => data.views[id]);
  const healthKpis = data.platformHealthKpis
    .map((id) => data.views.overview.kpis.find((k) => k.id === id))
    .filter((k): k is Kpi => Boolean(k));

  return (
    <Accordion type="multiple" className="flex flex-col gap-3">
      <Section
        value="bookings"
        kicker="Booking performance"
        title="Confirmed bookings"
        meta={
          <span>
            <strong className="font-semibold text-foreground">{compact(last)}</strong> on {month} 31 ·{' '}
            <span className="text-success">{signedPercent(growth)}</span> vs. previous
          </span>
        }
      >
        <BookingsChart current={current} previous={previous} month={month} />
      </Section>

      <Section
        value="workspaces"
        kicker="Workspace status"
        title="How each area is doing"
        meta={workspaces.map((w) => (
          <StatusPill key={w.id} tone={w.summary!.tone}>
            {w.summary!.status}
          </StatusPill>
        ))}
      >
        <div className="grid gap-2.5">
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onNavigate(w.id)}
              className="group flex items-center gap-3.5 rounded-xl border border-border bg-soft p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-soft-hover"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-primary/15 text-brand2 ring-1 ring-inset ring-primary/25">
                <Icon name={w.navIcon} size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold">{w.nav}</span>
                <span className="block text-xs text-muted-foreground">{w.summary!.line}</span>
              </span>
              <StatusPill tone={w.summary!.tone}>{w.summary!.status}</StatusPill>
              <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </Section>

      <Section
        value="platform"
        kicker="Platform health"
        title="Service reliability"
        meta={<StatusPill tone={data.platform.tone}>{data.platform.status}</StatusPill>}
      >
        <p className="max-w-[760px] text-[13px] leading-relaxed text-muted-foreground">{data.platform.copy}</p>
        <div className="mt-4 grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[400px]:grid-cols-1">
          {healthKpis.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => onOpenKpi(k)}
              aria-label={`${k.label}: ${k.value}. Open breakdown`}
              className="rounded-xl border border-border bg-soft p-3.5 text-left transition-colors hover:border-primary/40"
            >
              <span className="block text-[11.5px] font-semibold text-subtle">{k.label}</span>
              <span className="mt-1 block font-display text-lg font-extrabold">{k.value}</span>
              <DeltaPill direction={k.direction} change={k.change} className="mt-1.5" />
            </button>
          ))}
        </div>
      </Section>
    </Accordion>
  );
}

export function WorkspaceSections({
  summary,
  periodLabel,
  scopeLabel,
}: {
  summary: WorkspaceSummary;
  periodLabel: string;
  scopeLabel: string;
}) {
  return (
    <Accordion type="multiple" className="flex flex-col gap-3">
      <Section
        value="summary"
        kicker="High-level reporting"
        title={`${periodLabel} executive summary`}
        meta={
          <>
            <span>Overall outlook</span>
            <StatusPill tone={summary.tone}>{summary.status}</StatusPill>
          </>
        }
      >
        <p className="max-w-[760px] text-[13px] leading-relaxed text-muted-foreground">{summary.copy}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11.5px] font-semibold text-success">
          <Icon name="check" size={13} strokeWidth={2.2} />
          {scopeLabel}
        </span>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {summary.signals.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
              <span className="font-semibold">{s.label}</span>
              <StatusPill tone={s.value === 'Watch' ? 'warn' : 'good'}>{s.value}</StatusPill>
            </li>
          ))}
        </ul>
      </Section>
    </Accordion>
  );
}
