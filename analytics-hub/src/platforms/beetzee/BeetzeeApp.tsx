import { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformSwitcher } from '@/app/PlatformSwitcher';
import { ThemeToggle } from '@/app/ThemeToggle';
import { usePlatform } from '@/app/context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { DateRangeForm, type DateRange } from '@/shared/DateRangeForm';
import { formatDateRange } from '@/shared/format';
import { Icon } from '@/shared/Icon';
import { PortalContainerContext } from '@/shared/portal';
import { useStoredState } from '@/shared/useStoredState';
import { BZ_VIEWS, isBzPeriod, isBzView, type BeetzeeData, type BzPeriod, type BzView } from './data';
import { FEATURED_KPIS, buildKpis } from './model';
import { GA_SNAPSHOT, GaRangePicker, buildGaKpis, buildGaReports, gaComparison, gaIsExact, gaRangeLabel, type GaSelection } from './ga4';
import { BreakdownDialog } from '@/components/kpi/BreakdownDialog';
import { KpiCard } from '@/components/kpi/KpiCard';
import type { KpiData } from '@/components/kpi/types';
import { DetailedReports, buildReports } from './components/Reports';

const PAGES: Record<BzView, { eyebrow: string; title: string; description: string }> = {
  core: {
    eyebrow: 'Executive overview',
    title: 'Core Metrics Engine',
    description: 'A consolidated quick view of marketing, audience, engagement, and revenue performance.',
  },
  marketing: {
    eyebrow: 'Source 01',
    title: 'Marketing Ads Performance',
    description: 'High-level media investment, delivery, and acquisition outcomes.',
  },
  app: {
    eyebrow: 'Source 03',
    title: 'Application & User Platform Performance',
    description: 'High-level audience, engagement, monetization, and platform health.',
  },
};

interface FilterOption {
  id: string;
  label: string;
}

/** Report filter options per view. Marketing filters by campaign; Application & Users by platform. */
function reportFilters(data: BeetzeeData): Partial<Record<BzView, FilterOption[]>> {
  return {
    marketing: [
      { id: 'all', label: 'All campaigns & channels' },
      ...data.campaigns.map((c) => ({ id: c.id, label: `${c.name} · ${c.channel}` })),
    ],
    app: [
      { id: 'all', label: 'All platforms' },
      ...data.platformSplit.map((p) => ({ id: p.label, label: p.label })),
    ],
  };
}

export function BeetzeeApp({ data }: { data: BeetzeeData }) {
  const { mode } = usePlatform();
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const [view, setView] = useStoredState<BzView>('bz-view', 'core', isBzView);
  const [period, setPeriod] = useStoredState<BzPeriod>('bz-period', 'monthly', isBzPeriod);
  const [range, setRange] = useState<DateRange>(() => ({ from: data.periods[period].from, to: data.periods[period].to }));
  const [dateOpen, setDateOpen] = useState(false);
  // Google Analytics range: a period preset, a calendar month, or a custom range.
  const [gaSel, setGaSel] = useState<GaSelection>({ kind: 'preset', period });
  const [filters, setFilters] = useState<Partial<Record<BzView, string>>>({});
  const [modalKpiId, setModalKpiId] = useState<string | null>(null);
  const [openReports, setOpenReports] = useState<string[]>([]);
  // Application & Users shows real Google Analytics data when the local snapshot exists.
  const ga = view === 'app' ? GA_SNAPSHOT : null;
  const page = ga
    ? {
        ...PAGES.app,
        eyebrow: 'Live · Google Analytics',
        description: `Real app usage from Google Analytics (${ga.property.name}), pulled ${formatDateRange(ga.fetchedAt.slice(0, 10), ga.fetchedAt.slice(0, 10))}.`,
      }
    : PAGES[view];
  const p = data.periods[period];
  const gaSelection: GaSelection = gaSel.kind === 'preset' ? { kind: 'preset', period } : gaSel;
  const rangeLabel = ga ? gaRangeLabel(ga, gaSelection) : formatDateRange(range.from, range.to);
  const isPresetRange = range.from === p.from && range.to === p.to;
  const comparison = ga ? gaComparison(ga, gaSelection) : isPresetRange ? p.comparison : 'vs. previous period';
  const filterOptions = useMemo(() => (ga ? undefined : reportFilters(data)[view]), [data, view, ga]);
  const filterId = filters[view] ?? 'all';
  const filterOption = filterOptions?.find((o) => o.id === filterId) ?? filterOptions?.[0];
  const campaignId = view === 'marketing' ? filterId : 'all';
  const filterScope = filterId !== 'all' && filterOption ? ` · ${filterOption.label}` : '';
  const kpis = useMemo(
    () => (ga ? buildGaKpis(ga, gaSelection) : buildKpis(data, view, period, campaignId)),
    [ga, data, view, period, campaignId, JSON.stringify(gaSelection)],
  );
  const reports = useMemo(
    () => (ga ? buildGaReports(ga, gaSelection) : buildReports(view, data, period, campaignId)),
    [ga, view, data, period, campaignId, JSON.stringify(gaSelection)],
  );
  const featuredIds = FEATURED_KPIS[view] ?? [];
  const featured = kpis.filter((k) => featuredIds.includes(k.id));
  const supporting = kpis.filter((k) => !featuredIds.includes(k.id));
  // Looked up by id so an open breakdown follows period and filter changes.
  const modalKpi = kpis.find((k) => k.id === modalKpiId) ?? null;

  useEffect(() => () => void toast.dismiss(), []);

  const navigate = (v: BzView) => {
    setView(v);
    setModalKpiId(null);
    window.scrollTo({ top: 0 });
  };

  const changePeriod = (next: BzPeriod) => {
    setPeriod(next);
    setRange({ from: data.periods[next].from, to: data.periods[next].to });
    setGaSel({ kind: 'preset', period: next });
  };

  /** Downloads the KPIs on screen as a CSV for the selected range. */
  const exportReport = () => {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ['Report', page.title],
      ['Range', rangeLabel],
      ...(filterOption ? [['Report filter', filterOption.label]] : []),
      [],
      ['KPI', 'Value', 'Change', 'Comparison'],
      ...kpis.map((k) => [k.label, k.value, `${k.direction === 'up' ? '+' : '-'}${k.change}`, comparison]),
    ];
    const csv = rows.map((r) => r.map(cell).join(',')).join('\n');
    try {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `beetzee-${view}-${range.from}_${range.to}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(`${page.title} report is ready`);
    } catch {
      toast("Export isn't available here.");
    }
  };

  return (
    <div ref={setRootEl} className={cn('theme-beetzee bz-app-bg relative min-h-screen bg-background', mode === 'light' && 'light')}>
      <PortalContainerContext.Provider value={rootEl}>
        <div className="flex">
          {/* Sidebar (desktop) */}
          <aside className="sticky top-0 flex h-screen w-[250px] shrink-0 flex-col overflow-y-auto border-r border-border bg-[var(--bz-nav)] px-3.5 pb-4 pt-4 max-[800px]:hidden">
            <div className="pb-5">
              <PlatformSwitcher logoWidth={150} />
            </div>
            <p className="px-2.5 pb-2 text-[10.5px] font-bold uppercase tracking-[1.2px] text-subtle">Workspace</p>
            <nav aria-label="Workspace" className="flex flex-col gap-1">
              {BZ_VIEWS.map((v) => {
                const on = v.id === view;
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-current={on ? 'page' : undefined}
                    onClick={() => navigate(v.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-[11px] border border-transparent px-3 py-2.5 text-left text-[13px] font-semibold transition-colors',
                      on ? 'bz-nav-active text-foreground' : 'text-muted-foreground hover:bg-[var(--bz-nav-soft)] hover:text-foreground',
                    )}
                  >
                    <Icon name={v.icon} size={18} className={on ? 'text-chart-2' : undefined} />
                    <span className="flex-1">{v.nav}</span>
                    {on && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-chart-2 shadow-[0_0_10px_2px_#e167ffaa]" />}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-6">
              <div className="rounded-[13px] border border-border bg-soft p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-[1.2px] text-subtle">Data sources</p>
                <ul className="mt-2.5 grid gap-2">
                  {['Ad platforms', 'App analytics', 'Payment records'].map((s) => (
                    <li key={s} className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{s}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-success">
                        <span aria-hidden>●</span> Synced
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                <span className="bz-btn-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold">JM</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">Jamie Mendoza</p>
                  <p className="truncate text-[11px] text-subtle">Analytics admin</p>
                </div>
                <ChevronRight aria-hidden className="h-4 w-4 text-subtle" strokeWidth={1.8} />
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Top bar */}
            <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between gap-3 border-b border-border bg-[var(--chrome-header)] px-7 backdrop-blur-md max-[800px]:px-4">
              <nav aria-label="Breadcrumb" className="min-w-0 max-[800px]:hidden">
                <ol className="flex items-center gap-2 text-[13px]">
                  <li className="text-subtle">Beetzee Play</li>
                  <li aria-hidden className="text-dim">›</li>
                  <li aria-current="page" className="truncate font-semibold">
                    {page.title}
                  </li>
                </ol>
              </nav>
              <div className="hidden min-w-0 max-[800px]:block">
                <PlatformSwitcher logoWidth={112} className="-ml-2" />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {ga ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success max-[480px]:hidden">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
                    Google Analytics
                  </span>
                ) : (
                  <span className="rounded-full border border-dashed border-border-strong px-2.5 py-1 text-[11px] font-semibold text-muted-foreground max-[480px]:hidden">
                    Sample data
                  </span>
                )}
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Notifications"
                  onClick={() => toast('No new alerts. All data sources synced.')}
                  className="relative border-border text-muted-foreground"
                >
                  <Bell strokeWidth={1.8} />
                  <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-background" />
                </Button>
                {ga ? (
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Date range: ${rangeLabel}. Change`}
                        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-soft px-3 text-xs font-semibold transition-colors hover:border-border-strong data-[state=open]:border-border-strong"
                      >
                        <Calendar aria-hidden strokeWidth={1.8} className="h-4 w-4 text-chart-2" />
                        <span className="max-[560px]:hidden">{rangeLabel}</span>
                        <ChevronDown aria-hidden strokeWidth={1.8} className="h-3.5 w-3.5 text-subtle max-[560px]:hidden" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" sideOffset={8} className="w-[320px] max-w-[calc(100vw-32px)] rounded-[13px] border-border-strong bg-popover">
                      {dateOpen && (
                        <GaRangePicker
                          ga={ga}
                          value={gaSelection}
                          onChange={(sel) => {
                            setGaSel(sel);
                            setDateOpen(false);
                            toast(`Showing ${gaRangeLabel(ga, sel)}`);
                          }}
                        />
                      )}
                    </PopoverContent>
                  </Popover>
                ) : (
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Date range: ${rangeLabel}. Change`}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-soft px-3 text-xs font-semibold transition-colors hover:border-border-strong data-[state=open]:border-border-strong"
                    >
                      <Calendar aria-hidden strokeWidth={1.8} className="h-4 w-4 text-chart-2" />
                      <span className="max-[560px]:hidden">{rangeLabel}</span>
                      <ChevronDown aria-hidden strokeWidth={1.8} className="h-3.5 w-3.5 text-subtle max-[560px]:hidden" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={8} className="w-[300px] max-w-[calc(100vw-32px)] rounded-[13px] border-border-strong bg-popover">
                    {dateOpen && (
                      <DateRangeForm
                        idPrefix="bz"
                        initial={range}
                        submitClassName="bz-btn-primary mt-3 w-full hover:opacity-90"
                        onApply={(r) => {
                          setRange(r);
                          setDateOpen(false);
                          toast(`Reporting range set to ${formatDateRange(r.from, r.to)}`);
                        }}
                      />
                    )}
                  </PopoverContent>
                </Popover>
                )}
              </div>
            </header>

            {/* Mobile tabs */}
            <nav
              aria-label="Workspace"
              className="sticky top-[66px] z-20 hidden gap-1.5 overflow-x-auto border-b border-border bg-[var(--chrome-header)] px-4 py-2 backdrop-blur-md max-[800px]:flex"
            >
              {BZ_VIEWS.map((v) => {
                const on = v.id === view;
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-current={on ? 'page' : undefined}
                    onClick={() => navigate(v.id)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
                      on ? 'bz-nav-active text-foreground' : 'border-border text-muted-foreground',
                    )}
                  >
                    <Icon name={v.icon} size={14} />
                    {v.nav}
                  </button>
                );
              })}
            </nav>

            <main className="mx-auto max-w-[1440px] px-7 py-7 max-[800px]:px-4 max-[800px]:py-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0 max-w-[720px]">
                  <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-chart-2">{page.eyebrow}</p>
                  <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight max-[560px]:text-[22px]">{page.title}</h1>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">{page.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={exportReport} className="bz-btn-primary rounded-[11px] hover:opacity-90">
                    <Download strokeWidth={1.8} /> Export report
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-3">
                <ToggleGroup
                  type="single"
                  // A month or custom GA range clears the preset tabs.
                  value={ga && gaSel.kind !== 'preset' ? '' : period}
                  onValueChange={(v) => isBzPeriod(v) && changePeriod(v)}
                  aria-label="Reporting period"
                  className="border-border-strong bg-soft"
                >
                  {(['daily', 'weekly', 'monthly'] as const).map((id) => (
                    <ToggleGroupItem key={id} value={id} className="data-[state=on]:bg-[linear-gradient(135deg,#a457ff,#c04cfd)]">
                      {data.periods[id].label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>

                {ga && !gaIsExact(ga, gaSelection) && (
                  <p role="note" className="w-full rounded-[11px] border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-foreground">
                    <strong>Custom range:</strong> GA can’t add up unique users across days, so this view shows{' '}
                    <strong>average daily active users</strong> and <strong>purchases</strong>. New users, revenue and engagement time
                    are exact. Pick a full month or Daily / Weekly / Monthly for exact unique counts.
                  </p>
                )}

                {filterOptions && (
                  <div className="flex items-center gap-2.5">
                    <span id="bz-filter-label" className="text-[10.5px] font-bold uppercase tracking-[1.2px] text-subtle">
                      Report filter
                    </span>
                    <Select value={filterId} onValueChange={(v) => setFilters((f) => ({ ...f, [view]: v }))}>
                      <SelectTrigger
                        aria-labelledby="bz-filter-label"
                        className="h-9 w-[250px] rounded-[11px] border-border-strong bg-soft text-[13px] font-semibold max-[420px]:w-[190px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[11px] border-border-strong bg-popover">
                        {filterOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id} className="focus:bg-accent">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {featured.length > 0 && (
                <section aria-labelledby="bz-key-results" className="mb-6">
                  <h2 id="bz-key-results" className="mb-3 text-[11px] font-bold uppercase tracking-[1.4px] text-chart-2">
                    Key results
                  </h2>
                  <div key={`key-${view}-${period}`} className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 max-[560px]:grid-cols-1">
                    {featured.map((k, i) => (
                      <KpiCard
                        key={k.id}
                        kpi={k}
                        comparison={comparison}
                        index={i}
                        onOpen={(kpi: KpiData) => setModalKpiId(kpi.id)}
                        surfaceClassName="bz-card"
                        featured
                      />
                    ))}
                  </div>
                </section>
              )}

              <section aria-labelledby={featured.length > 0 ? 'bz-supporting' : undefined}>
                {featured.length > 0 && (
                  <h2 id="bz-supporting" className="mb-3 text-[11px] font-bold uppercase tracking-[1.4px] text-subtle">
                    Supporting metrics
                  </h2>
                )}
                {/* Same card grid as Tripket: columns follow the content width. */}
                <div key={`${view}-${period}`} className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4 max-[560px]:grid-cols-1">
                  {supporting.map((k, i) => (
                    <KpiCard
                      key={k.id}
                      kpi={k}
                      comparison={comparison}
                      index={featured.length + i}
                      onOpen={(kpi: KpiData) => setModalKpiId(kpi.id)}
                      surfaceClassName="bz-card"
                    />
                  ))}
                </div>
              </section>

              <DetailedReports sections={reports} open={openReports} onOpenChange={setOpenReports} />
            </main>
          </div>
        </div>
        <BreakdownDialog
          kpi={modalKpi}
          eyebrow={`${rangeLabel} · ${p.label}${filterScope}`}
          comparison={comparison}
          onClose={() => setModalKpiId(null)}
          doneClassName="bz-btn-primary hover:opacity-90"
        />
        <Toaster theme={mode} />
      </PortalContainerContext.Provider>
    </div>
  );
}
