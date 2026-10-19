import { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformSwitcher } from '@/app/PlatformSwitcher';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Icon } from '@/shared/Icon';
import { PortalContainerContext } from '@/shared/portal';
import { useEscape } from '@/shared/useEscape';
import { useStoredState } from '@/shared/useStoredState';
import { BZ_VIEWS, isBzPeriod, isBzView, type BeetzeeData, type BzPeriod, type BzView } from './data';
import { buildKpis } from './model';
import { BreakdownCard } from './components/BreakdownCard';
import { CampaignPicker } from './components/CampaignPicker';
import { KpiTile } from './components/KpiTile';
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

const GRID_COLS: Record<BzView, string> = {
  core: 'grid-cols-4 max-[1180px]:grid-cols-3',
  marketing: 'grid-cols-3',
  app: 'grid-cols-5 max-[1280px]:grid-cols-3',
};

export function BeetzeeApp({ data }: { data: BeetzeeData }) {
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const [view, setView] = useStoredState<BzView>('bz-view', 'core', isBzView);
  const [period, setPeriod] = useStoredState<BzPeriod>('bz-period', 'monthly', isBzPeriod);
  const [campaignId, setCampaignId] = useState('all');
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [openReports, setOpenReports] = useState<string[]>([]);

  const page = PAGES[view];
  const p = data.periods[period];
  const kpis = useMemo(() => buildKpis(data, view, period, campaignId), [data, view, period, campaignId]);
  const reports = useMemo(() => buildReports(view, data, period, campaignId), [view, data, period, campaignId]);
  const breakdownKpi = kpis.find((k) => k.id === selectedKpi) ?? null;

  useEffect(() => () => void toast.dismiss(), []);

  // The campaign menu is a Radix layer and consumes its own Escape first.
  useEscape(() => {
    if (selectedKpi) setSelectedKpi(null);
  });

  const navigate = (v: BzView) => {
    setView(v);
    setSelectedKpi(null);
    window.scrollTo({ top: 0 });
  };

  const copySummary = async () => {
    const lines = [
      `${page.title} — ${p.range}`,
      ...kpis.map((k) => `${k.label}: ${k.value} (${k.trend >= 0 ? '+' : '−'}${Math.abs(k.trend).toFixed(1)}% ${p.comparison})`),
    ];
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(lines.join('\n'));
      toast('Summary copied to clipboard');
    } catch {
      toast("Copy isn't available here. Select the figures to copy them.");
    }
  };

  return (
    <div ref={setRootEl} className="theme-beetzee bz-app-bg relative min-h-screen bg-background">
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
                    <Icon name={v.icon} size={18} className={on ? 'text-[#e167ff]' : undefined} />
                    <span className="flex-1">{v.nav}</span>
                    {on && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#e167ff] shadow-[0_0_10px_2px_#e167ffaa]" />}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-6">
              <div className="rounded-[13px] border border-border bg-[#ffffff05] p-3.5">
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
            <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between gap-3 border-b border-border bg-[#0f0617d9] px-7 backdrop-blur-md max-[800px]:px-4">
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
                <span className="rounded-full border border-dashed border-[#4e3a66] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground max-[480px]:hidden">
                  Sample data
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Notifications"
                  onClick={() => toast('No new alerts. All data sources synced.')}
                  className="relative border-border text-muted-foreground"
                >
                  <Bell strokeWidth={1.8} />
                  <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-[#0f0617]" />
                </Button>
                <span className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-[#ffffff06] px-3 text-xs font-semibold max-[560px]:hidden">
                  <Calendar aria-hidden strokeWidth={1.8} className="h-4 w-4 text-[#e167ff]" />
                  {p.range}
                </span>
              </div>
            </header>

            {/* Mobile tabs */}
            <nav
              aria-label="Workspace"
              className="sticky top-[66px] z-20 hidden gap-1.5 overflow-x-auto border-b border-border bg-[#0f0617e6] px-4 py-2 backdrop-blur-md max-[800px]:flex"
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
                  <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#e167ff]">{page.eyebrow}</p>
                  <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight max-[560px]:text-[22px]">{page.title}</h1>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">{page.description}</p>
                </div>
                <Button onClick={copySummary} className="bz-btn-primary rounded-[11px] hover:opacity-90">
                  <Copy strokeWidth={1.8} /> Copy summary
                </Button>
              </div>

              {/* Filters */}
              <div className="bz-card mb-5 mt-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-subtle">Reporting period</p>
                    <p className="text-[13px] font-bold">{p.range}</p>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={period}
                    onValueChange={(v) => isBzPeriod(v) && setPeriod(v)}
                    aria-label="Reporting period"
                    className="border-[#4e3a66] bg-[#ffffff06]"
                  >
                    {(['daily', 'monthly', 'yearly'] as const).map((id) => (
                      <ToggleGroupItem key={id} value={id} className="data-[state=on]:bg-[linear-gradient(135deg,#a457ff,#c04cfd)]">
                        {data.periods[id].label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                {view === 'marketing' && <CampaignPicker data={data} period={period} value={campaignId} onChange={setCampaignId} />}
              </div>

              <div className={cn('grid gap-3.5 max-[800px]:grid-cols-2 max-[800px]:gap-2.5', GRID_COLS[view])}>
                {kpis.map((k) => (
                  <KpiTile
                    key={k.id}
                    kpi={k}
                    comparison={p.comparison}
                    selected={selectedKpi === k.id}
                    onToggle={() => setSelectedKpi((s) => (s === k.id ? null : k.id))}
                  />
                ))}
              </div>

              {breakdownKpi && <BreakdownCard kpi={breakdownKpi} onClose={() => setSelectedKpi(null)} />}

              <DetailedReports sections={reports} open={openReports} onOpenChange={setOpenReports} />
            </main>
          </div>
        </div>
        <Toaster />
      </PortalContainerContext.Provider>
    </div>
  );
}
