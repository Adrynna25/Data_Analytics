import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { usePlatform } from '@/app/context';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatDateRange } from '@/shared/format';
import { PortalContainerContext } from '@/shared/portal';
import { useEscape } from '@/shared/useEscape';
import { readStorage, writeStorage } from '@/shared/useStoredState';
import { DEFAULT_PERIOD, VIEW_ORDER, type Kpi, type Period, type TripketData, type TripketView, type ViewDef } from './data';
import { BreakdownModal } from './components/BreakdownModal';
import { CustomizePanel } from './components/CustomizePanel';
import { Header, type DateRange } from './components/Header';
import { KpiCard } from './components/KpiCard';
import { OverviewSections, WorkspaceSections } from './components/Sections';
import { SidebarContent } from './components/Sidebar';

const kpiStorageKey = (view: TripketView) => `tpk-kpis-${view}`;

function defaultSelection(def: ViewDef) {
  return def.kpis.slice(0, def.defaultCount).map((k) => k.id);
}

function loadSelection(def: ViewDef): string[] {
  try {
    const raw = readStorage(kpiStorageKey(def.id));
    if (!raw) return defaultSelection(def);
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return defaultSelection(def);
    const valid = def.kpis.map((k) => k.id).filter((id) => ids.includes(id));
    return valid.length ? valid : defaultSelection(def);
  } catch {
    return defaultSelection(def);
  }
}

const isPeriod = (v: string): v is Period => v === 'daily' || v === 'weekly' || v === 'monthly';

export function TripketApp({ data }: { data: TripketData }) {
  const { mode } = usePlatform();
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const [view, setView] = useState<TripketView>('overview');
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [range, setRange] = useState<DateRange>(() => ({ from: data.periods[DEFAULT_PERIOD].from, to: data.periods[DEFAULT_PERIOD].to }));
  const [dateOpen, setDateOpen] = useState(false);
  const [modalKpi, setModalKpi] = useState<Kpi | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [selection, setSelection] = useState<Record<TripketView, string[]>>(() => ({
    overview: loadSelection(data.views.overview),
    marketing: loadSelection(data.views.marketing),
    operators: loadSelection(data.views.operators),
  }));
  // Latest selection, so quick successive clicks each build on the previous one.
  const selectionRef = useRef(selection);
  const [scopes, setScopes] = useState<Partial<Record<TripketView, string>>>({});

  const def = data.views[view];
  const preset = data.periods[period];
  const rangeLabel = formatDateRange(range.from, range.to);
  const selected = selection[view];
  const visibleKpis = useMemo(() => def.kpis.filter((k) => selected.includes(k.id)), [def, selected]);
  const scopeLabel = scopes[view] ?? def.scopes?.[0] ?? '';

  // Toasts belong to this mount: clear them when the dashboard unmounts.
  useEffect(() => () => void toast.dismiss(), []);

  // Escape priority: date popover → modal → drawer are Radix layers that consume
  // Escape themselves (preventDefault), so this only sees what is left.
  useEscape(() => {
    if (customizing) setCustomizing(false);
  });

  const navigate = (v: TripketView) => {
    setView(v);
    setCustomizing(false);
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  };

  const changePeriod = (p: Period) => {
    setPeriod(p);
    setRange({ from: data.periods[p].from, to: data.periods[p].to });
  };

  const saveSelection = (ids: string[]) => {
    selectionRef.current = { ...selectionRef.current, [view]: ids };
    setSelection(selectionRef.current);
    writeStorage(kpiStorageKey(view), JSON.stringify(ids));
  };

  const toggleKpi = (id: string) => {
    const current = selectionRef.current[view];
    if (current.includes(id)) {
      if (current.length === 1) {
        toast('Keep at least one KPI on the page');
        return;
      }
      saveSelection(current.filter((x) => x !== id));
    } else {
      saveSelection(def.kpis.map((k) => k.id).filter((k) => k === id || current.includes(k)));
    }
  };

  const resetSelection = () => {
    selectionRef.current = { ...selectionRef.current, [view]: defaultSelection(def) };
    setSelection(selectionRef.current);
    writeStorage(kpiStorageKey(view), null);
  };

  const views = VIEW_ORDER.map((v) => data.views[v]);

  return (
    <div ref={setRootEl} className={cn('theme-tripket tp-app-bg relative min-h-screen bg-background', mode === 'light' && 'light')}>
      <PortalContainerContext.Provider value={rootEl}>
        <aside className="fixed inset-y-0 left-0 z-40 w-[248px] overflow-y-auto border-r border-border bg-[var(--chrome)] backdrop-blur-[18px] max-[780px]:hidden">
          <SidebarContent views={views} active={view} onNavigate={navigate} />
        </aside>

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="w-[270px] max-w-[85vw] overflow-y-auto border-r border-border bg-[var(--chrome)] p-0 backdrop-blur-[18px]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Tripket workspaces and platform switcher</SheetDescription>
            <SidebarContent views={views} active={view} onNavigate={navigate} />
          </SheetContent>
        </Sheet>

        <div className="min-[781px]:pl-[248px]">
          <Header
            title={def.title}
            rangeLabel={rangeLabel}
            range={range}
            dateOpen={dateOpen}
            onDateOpenChange={setDateOpen}
            onApplyRange={(r) => {
              setRange(r);
              setDateOpen(false);
              toast(`Reporting range set to ${formatDateRange(r.from, r.to)}`);
            }}
            onOpenDrawer={() => setDrawerOpen(true)}
            onBell={() => toast('No new notifications')}
          />

          <main className="mx-auto max-w-[1480px] px-[34px] py-[30px] max-[780px]:px-4 max-[780px]:py-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 max-w-[680px]">
                <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-primary">{def.eyebrow}</p>
                <h1 className="mt-1.5 font-display text-[25px] font-extrabold tracking-tight">{def.title}</h1>
                <p className="mt-1 text-[13.5px] text-muted-foreground">{def.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {def.kpis.length > def.defaultCount && (
                  <Button variant="outline" aria-expanded={customizing} onClick={() => setCustomizing((c) => !c)} className="border-border-strong">
                    <SlidersHorizontal strokeWidth={1.8} /> Customize KPIs
                  </Button>
                )}
                <Button onClick={() => toast(`${def.title} report is ready`)}>
                  <Download strokeWidth={1.8} /> Export report
                </Button>
              </div>
            </div>

            <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-3">
              <ToggleGroup
                type="single"
                value={period}
                onValueChange={(v) => isPeriod(v) && changePeriod(v)}
                aria-label="Reporting period"
                className="bg-soft"
              >
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                  <ToggleGroupItem key={p} value={p}>
                    {data.periods[p].label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {view === 'overview' ? (
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span aria-hidden className="h-2 w-2 animate-blink rounded-full bg-success shadow-[0_0_8px_2px_#34d39977]" />
                  Live data
                </span>
              ) : (
                def.scopes && (
                  <div className="flex items-center gap-2.5">
                    <span id="tp-scope-label" className="text-[10.5px] font-bold uppercase tracking-[1.2px] text-dim">
                      Report filter
                    </span>
                    <Select value={scopeLabel} onValueChange={(v) => setScopes((s) => ({ ...s, [view]: v }))}>
                      <SelectTrigger aria-labelledby="tp-scope-label" className="h-9 w-[220px] border-border-strong text-[13px] font-semibold max-[400px]:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {def.scopes.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              )}
            </div>

            {customizing && (
              <CustomizePanel
                kpis={def.kpis}
                selected={selected}
                onToggle={toggleKpi}
                onReset={resetSelection}
                onDone={() => setCustomizing(false)}
              />
            )}

            <div key={`${view}-${period}`} className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1">
              {visibleKpis.map((k, i) => (
                <KpiCard key={k.id} kpi={k} unit={preset.unit} index={i} onOpen={setModalKpi} />
              ))}
            </div>

            <div className="mt-6">
              {view === 'overview' ? (
                <OverviewSections data={data} onOpenKpi={setModalKpi} onNavigate={navigate} />
              ) : (
                def.summary && <WorkspaceSections key={view} summary={def.summary} periodLabel={preset.label} scopeLabel={scopeLabel} />
              )}
            </div>
          </main>
        </div>

        <BreakdownModal
          kpi={modalKpi}
          rangeLabel={rangeLabel}
          periodLabel={preset.label}
          unit={preset.unit}
          onClose={() => setModalKpi(null)}
        />
        <Toaster theme={mode} />
      </PortalContainerContext.Provider>
    </div>
  );
}
