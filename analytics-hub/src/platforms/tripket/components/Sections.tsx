import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Icon } from '@/shared/Icon';
import { compact, signedPercent } from '@/shared/format';
import type { Kpi, TripketData, TripketView, WorkspaceSummary } from '../data';
import { BookingsChart } from './BookingsChart';
import { BreakdownFactors, BreakdownSummary, BreakdownTakeaway } from '@/components/kpi/BreakdownBody';
import { DeltaPill } from '@/components/kpi/DeltaPill';
import { StatusPill } from './StatusPill';

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
  onNavigate,
  reports = [],
  unit,
}: {
  data: TripketData;
  onNavigate: (v: TripketView) => void;
  /** Extra KPIs shown as accordions after Platform health. */
  reports?: Kpi[];
  unit: string;
}) {
  const { current, previous, month } = data.bookings;
  const last = current[current.length - 1];
  const growth = ((last - previous[previous.length - 1]) / previous[previous.length - 1]) * 100;
  const workspaces = (['marketing', 'operators'] as const).map((id) => data.views[id]);

  return (
    <section aria-labelledby="tp-reports-title">
      <h2 id="tp-reports-title" className="mb-3 text-[11px] font-bold uppercase tracking-[1.4px] text-subtle">
        Detailed reports
      </h2>
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
        </Section>

        {reports.map((k) => (
          <ReportSection key={k.id} kpi={k} unit={unit} />
        ))}
      </Accordion>
    </section>
  );
}

/** Short category shown above each detailed-report title. */
const REPORT_KICKERS: Record<string, string> = {
  'customer-lifetime-value': 'Customer value',
  'top-acquisition-channel': 'Acquisition',
  'highest-demand-route': 'Demand',
  'promo-redemption-rate': 'Promotions',
  'monthly-recurring-revenue': 'Revenue',
  'gross-booking-value': 'Booking value',
  'monthly-active-bookers': 'Customers',
  'booking-conversion': 'Conversion',
  'weather-disrupted-trips': 'Disruptions',
};

/** A KPI as an accordion: value + change in the header, its breakdown inside. */
function ReportSection({ kpi, unit }: { kpi: Kpi; unit: string }) {
  return (
    <Section
      value={kpi.id}
      kicker={REPORT_KICKERS[kpi.id] ?? 'Detailed report'}
      title={kpi.label}
      meta={
        <>
          <strong className="font-display text-[13px] font-extrabold text-foreground">{kpi.value}</strong>
          <DeltaPill direction={kpi.direction} change={kpi.change} tone={kpi.tone} />
        </>
      }
    >
      <BreakdownSummary kpi={kpi} comparison={`vs. previous ${unit}`} />
      <div className="mt-5">
        <BreakdownFactors kpi={kpi} />
      </div>
      <div className="mt-4">
        <BreakdownTakeaway kpi={kpi} comparison={`vs. previous ${unit}`} />
      </div>
    </Section>
  );
}

export function WorkspaceSections({
  summary,
  periodLabel,
  scopeLabel,
  reports = [],
  unit,
}: {
  summary: WorkspaceSummary;
  periodLabel: string;
  scopeLabel: string;
  /** KPIs shown as accordions, each with its on-demand breakdown inside. */
  reports?: Kpi[];
  unit: string;
}) {
  return (
    <section aria-labelledby="tp-reports-title">
      <h2 id="tp-reports-title" className="mb-3 text-[11px] font-bold uppercase tracking-[1.4px] text-subtle">
        Detailed reports
      </h2>
      <Accordion type="multiple" className="flex flex-col gap-3">
        {reports.map((k) => (
          <ReportSection key={k.id} kpi={k} unit={unit} />
        ))}
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
    </section>
  );
}
