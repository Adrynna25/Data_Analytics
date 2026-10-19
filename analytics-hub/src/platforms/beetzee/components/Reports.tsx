import type { ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { compact, peso, signedPercent } from '@/shared/format';
import type { BeetzeeData, BzPeriod, BzView } from '../data';
import { findCampaign } from '../model';
import { buildSeries } from '../series';
import { ACCENT_HEX, Donut, Gauge, TrendChart } from './charts';

export interface ReportSection {
  id: string;
  title: string;
  subtitle: string;
  legend?: { label: string; color: string }[];
  body: ReactNode;
}

const CHANNEL_COLORS = [ACCENT_HEX.gold, ACCENT_HEX.orange, ACCENT_HEX.teal, ACCENT_HEX.blue];

function CampaignTable({ data, period, highlight }: { data: BeetzeeData; period: BzPeriod; highlight?: string }) {
  return (
    <Table className="min-w-[720px]">
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Spend</TableHead>
          <TableHead>Share of spend</TableHead>
          <TableHead className="text-right">Impressions</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="text-right">ROAS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.campaigns.map((c, i) => {
          const on = highlight === c.id;
          return (
            <TableRow key={c.id} aria-selected={highlight ? on : undefined} className={cn(on && 'bg-[var(--bz-gold-soft)]')}>
              <TableCell>
                <span className="block text-[13px] font-bold">{c.name}</span>
                <span className="block text-[11px] text-subtle">{c.channel}</span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bz-teal-soft)] px-2 py-0.5 text-[11px] font-bold text-success">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
                  {c.status}
                </span>
              </TableCell>
              <TableCell className="text-right font-semibold">{c.spend[period].label}</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-accent">
                    <span className="block h-full rounded-full" style={{ width: `${(c.share / 40) * 100}%`, background: CHANNEL_COLORS[i] }} />
                  </span>
                  <span className="text-xs font-semibold">{c.share.toFixed(1)}%</span>
                </span>
              </TableCell>
              <TableCell className="text-right">{c.impressions[period].label}</TableCell>
              <TableCell className="text-right">{c.clicks[period].label}</TableCell>
              <TableCell className="text-right">{c.ctr}</TableCell>
              <TableCell className="text-right font-bold">{c.roas}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function Funnel({ data, period }: { data: BeetzeeData; period: BzPeriod }) {
  const fig = data.figures[period];
  const fx = data.fixed;
  const steps = [
    { label: 'Impressions', value: fig.impressions.label, rate: 100, note: 'Rewarded & paid ads served', color: ACCENT_HEX.gold },
    { label: 'Clicks', value: fig.clicks.label, rate: 3.8, note: '3.8% click-through', color: ACCENT_HEX.orange },
    { label: 'Sign-ups', value: fig.signups.label, rate: 41.1, note: `${fx.clickToSignup} of clicks`, color: ACCENT_HEX.violet },
    { label: 'Paying', value: fig.paying.label, rate: 17.6, note: `${fx.storeConversion} of sign-ups`, color: ACCENT_HEX.teal },
  ];
  return (
    <div>
      <ol className="grid gap-3">
        {steps.map((s, i) => (
          <li key={s.label} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 max-[520px]:grid-cols-[1fr_auto]">
            <span className="text-[13px] font-bold">
              <span className="mr-1.5 text-subtle">{i + 1}.</span>
              {s.label}
            </span>
            <span className="h-7 overflow-hidden rounded-lg bg-accent max-[520px]:order-last max-[520px]:col-span-2">
              <span
                className="flex h-full min-w-[6px] items-center rounded-lg px-2 text-[11px] font-bold text-background"
                style={{ width: `${s.rate}%`, background: s.color }}
              >
                {s.rate >= 15 ? `${s.rate}%` : ''}
              </span>
            </span>
            <span className="text-right">
              <span className="block text-sm font-extrabold">{s.value}</span>
              <span className="block text-[11px] text-subtle">{s.note}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[11px] border border-danger/25 bg-[var(--bz-coral-soft)] px-4 py-3">
        <span className="text-[13px] font-semibold">Customer acquisition cost</span>
        <span className="text-[13px] text-muted-foreground">
          <strong className="text-base font-extrabold text-foreground">{fx.cac}</strong> per paying user ·{' '}
          <span className="text-success">{signedPercent(fx.cacTrend)}</span>
        </span>
      </div>
    </div>
  );
}

export function buildReports(view: BzView, data: BeetzeeData, period: BzPeriod, campaignId: string): ReportSection[] {
  const fig = data.figures[period];

  if (view === 'core') {
    const sales = buildSeries(fig.attributedSales.n, period, 'sales');
    const spend = buildSeries(fig.spend.n, period, 'spend');
    return [
      {
        id: 'core-sales',
        title: 'Sales vs. ad spend',
        subtitle: 'Attributed sales against paid media investment',
        legend: [
          { label: 'Attributed sales', color: ACCENT_HEX.teal },
          { label: 'Ad spend', color: ACCENT_HEX.orange },
        ],
        body: (
          <>
            <TrendChart
              ariaLabel="Attributed sales versus ad spend"
              labels={sales.labels}
              format={(n) => peso(n)}
              series={[
                { key: 'sales', label: 'Sales', values: sales.values, color: ACCENT_HEX.teal, area: true },
                { key: 'spend', label: 'Spend', values: spend.values, color: ACCENT_HEX.orange },
              ]}
            />
            <p className="mt-3 rounded-[11px] border border-border bg-soft px-4 py-3 text-[13px] text-muted-foreground">
              <strong className="font-extrabold text-foreground">ROAS {data.fixed.roas}</strong> · Every ₱1 of ad spend returned ₱9.72 in
              attributed sales
            </p>
          </>
        ),
      },
      {
        id: 'core-funnel',
        title: 'Acquisition funnel',
        subtitle: 'From ad impression to paying user',
        body: <Funnel data={data} period={period} />,
      },
      {
        id: 'core-campaigns',
        title: 'Campaign performance',
        subtitle: 'Spend, delivery, and return by campaign',
        body: <CampaignTable data={data} period={period} />,
      },
    ];
  }

  if (view === 'marketing') {
    const campaign = findCampaign(data, campaignId);
    const impressions = buildSeries((campaign?.impressions[period] ?? fig.impressions).n, period, `impressions-${campaignId}`);
    return [
      {
        id: 'mk-impressions',
        title: 'Impressions trend',
        subtitle: campaign ? `${campaign.name} · ${campaign.channel}` : 'All campaigns',
        legend: [{ label: 'Impressions', color: ACCENT_HEX.gold }],
        body: (
          <>
            <TrendChart
              ariaLabel="Impressions over the period"
              labels={impressions.labels}
              format={(n) => compact(n)}
              series={[{ key: 'impr', label: 'Impressions', values: impressions.values, color: ACCENT_HEX.gold, area: true }]}
            />
            <p className="mt-3 text-[13px] text-muted-foreground">
              Peak impressions: <strong className="font-extrabold text-foreground">{fig.peak}</strong>
            </p>
          </>
        ),
      },
      {
        id: 'mk-channels',
        title: 'Spend by channel',
        subtitle: 'Share of paid media investment',
        legend: data.channelSplit.map((c, i) => ({ label: c.label, color: CHANNEL_COLORS[i] })),
        body: (
          <Donut
            centerLabel="Ad spend"
            centerValue={fig.spend.label}
            slices={data.channelSplit.map((c, i) => ({ label: c.label, value: c.value, color: CHANNEL_COLORS[i] }))}
          />
        ),
      },
      {
        id: 'mk-campaigns',
        title: 'Campaigns',
        subtitle: campaign ? `Highlighting ${campaign.name}` : 'All active campaigns',
        body: <CampaignTable data={data} period={period} highlight={campaign?.id} />,
      },
    ];
  }

  const users = buildSeries(fig.activeUsers.n, period, 'users');
  const platformColors = [ACCENT_HEX.teal, ACCENT_HEX.gold, ACCENT_HEX.orange];
  return [
    {
      id: 'app-users',
      title: 'Active users',
      subtitle: 'Viewers who played at least one episode',
      legend: [{ label: 'Active users', color: ACCENT_HEX.teal }],
      body: (
        <TrendChart
          ariaLabel="Active users over the period"
          labels={users.labels}
          format={(n) => compact(n)}
          series={[{ key: 'users', label: 'Active users', values: users.values, color: ACCENT_HEX.teal, area: true }]}
        />
      ),
    },
    {
      id: 'app-shows',
      title: 'Top shows by completion',
      subtitle: 'Share of started runtime watched',
      body: (
        <ul className="grid gap-3">
          {data.shows.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[24px_1fr_auto] items-center gap-3">
              <span className="text-sm font-extrabold text-subtle">{i + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold">{s.title}</span>
                <span className="block text-[11px] text-subtle">{s.meta}</span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-accent">
                  <span className="bz-btn-primary block h-full rounded-full" style={{ width: `${s.completion}%` }} />
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-extrabold">{s.completion.toFixed(1)}%</span>
                <span className={cn('block text-[11px] font-bold', s.change >= 0 ? 'text-success' : 'text-danger')}>
                  {signedPercent(s.change)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'app-platforms',
      title: 'Users by platform',
      subtitle: 'Share of active users',
      legend: data.platformSplit.map((p, i) => ({ label: p.label, color: platformColors[i] })),
      body: (
        <Donut
          centerLabel="Active users"
          centerValue={fig.activeUsers.label}
          slices={data.platformSplit.map((p, i) => ({ label: p.label, value: p.value, color: platformColors[i] }))}
        />
      ),
    },
    {
      id: 'app-wallets',
      title: 'E-wallet payment mix',
      subtitle: 'Share of completed payments',
      body: (
        <ul className="grid gap-3">
          {data.wallets.map((w, i) => (
            <li key={w.label}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-bold">{w.label}</span>
                <span>
                  <strong className="font-extrabold">{w.value.toFixed(1)}%</strong>{' '}
                  <span className={cn('text-[11px] font-bold', (w.change ?? 0) >= 0 ? 'text-success' : 'text-danger')}>
                    {signedPercent(w.change ?? 0)}
                  </span>
                </span>
              </div>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-accent">
                <span className="block h-full rounded-full" style={{ width: `${(w.value / 50) * 100}%`, background: CHANNEL_COLORS[i] }} />
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'app-health',
      title: 'Service health',
      subtitle: '30-day availability and latency',
      body: (
        <div className="grid grid-cols-[200px_1fr] items-center gap-6 max-[600px]:grid-cols-1">
          <div>
            <Gauge value={99.98} label="Uptime" />
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-success">
              <span aria-hidden className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_#30f4a0]" />
              All systems operational
            </p>
          </div>
          <ul className="divide-y divide-border rounded-[11px] border border-border">
            {data.services.map((s) => (
              <li key={s.name} className="flex items-center justify-between px-4 py-3 text-[13px]">
                <span className="flex items-center gap-2 font-semibold">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
                  {s.name}
                </span>
                <span className="font-bold">{s.latency}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];
}

export function DetailedReports({
  sections,
  open,
  onOpenChange,
}: {
  sections: ReportSection[];
  open: string[];
  onOpenChange: (ids: string[]) => void;
}) {
  const ids = sections.map((s) => s.id);
  const allOpen = ids.every((id) => open.includes(id));
  const toggleAll = () =>
    onOpenChange(allOpen ? open.filter((id) => !ids.includes(id)) : Array.from(new Set([...open, ...ids])));

  return (
    <section aria-labelledby="bz-reports-title" className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="bz-reports-title" className="text-[11px] font-bold uppercase tracking-[1.4px] text-subtle">
          Detailed reports
        </h2>
        <Button variant="ghost" size="sm" onClick={toggleAll} className="text-chart-2 hover:bg-accent">
          {allOpen ? 'Collapse all' : 'Expand all'}
        </Button>
      </div>
      <Accordion
        type="multiple"
        value={open.filter((id) => ids.includes(id))}
        onValueChange={(v) => onOpenChange([...open.filter((id) => !ids.includes(id)), ...v])}
        className="grid gap-3"
      >
        {sections.map((s) => {
          const isOpen = open.includes(s.id);
          return (
            <AccordionItem key={s.id} value={s.id} className="bz-card overflow-hidden">
              <AccordionTrigger className="px-5 py-4 hover:bg-soft" chevronClassName="text-subtle">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold">{s.title}</span>
                  <span className="block text-xs text-muted-foreground">{s.subtitle}</span>
                </span>
                {isOpen && s.legend && (
                  <span className="flex flex-wrap justify-end gap-x-3 gap-y-1 max-[600px]:hidden">
                    {s.legend.map((l) => (
                      <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                        {l.label}
                      </span>
                    ))}
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="border-t border-border px-5 pb-5 pt-4">{s.body}</AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
