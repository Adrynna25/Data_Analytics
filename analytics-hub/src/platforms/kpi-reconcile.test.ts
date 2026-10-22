import { describe, expect, it } from 'vitest';
import type { KpiData } from '@/components/kpi/types';
import { BEETZEE_DATA, type BzPeriod, type BzView } from './beetzee/data';
import { buildKpis } from './beetzee/model';
import { GA_SNAPSHOT, buildGaKpis, type GaSelection } from './beetzee/ga4';
import { TRIPKET_DATA } from './tripket/data';

/** "₱4.82M" → 4_820_000, "488.7K" → 488_700, "2.7%" → 2.7, "13 min" → 13. */
function num(s: string): number {
  const m = s.replace(/[₱,\s]/g, '').match(/^(-?\d+(?:\.\d+)?)([KMB]?)/);
  if (!m) throw new Error(`Not a number: ${s}`);
  const mult = { '': 1, K: 1e3, M: 1e6, B: 1e9 }[m[2] as '' | 'K' | 'M' | 'B'];
  return parseFloat(m[1]) * mult;
}

/** Within display rounding: 0.6% of the value, or the value's last shown digit. */
function close(actual: number, expected: number, label: string) {
  const tol = Math.max(Math.abs(expected) * 0.006, 0.006);
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThanOrEqual(tol);
}

const sum = (k: KpiData) => k.breakdown.factors.reduce((a, f) => a + num(f.value), 0);
const weighted = (k: KpiData) => k.breakdown.factors.reduce((a, f) => a + (num(f.value) * (f.share ?? 0)) / 100, 0);

describe('Tripket breakdowns reconcile to the card value', () => {
  const kpis = new Map(Object.values(TRIPKET_DATA.views).flatMap((v) => v.kpis.map((k) => [k.id, k] as const)));
  const get = (id: string) => {
    const k = kpis.get(id);
    if (!k) throw new Error(`Unknown KPI ${id}`);
    return k;
  };

  it('every card and report on every page points at a real KPI', () => {
    for (const v of Object.values(TRIPKET_DATA.views)) {
      const ids = new Set(v.kpis.map((k) => k.id));
      for (const id of [...v.cardIds, ...(v.reportIds ?? [])]) expect(ids.has(id), `${v.id} → ${id}`).toBe(true);
    }
  });

  it('every KPI has factors and a reconciliation line', () => {
    for (const k of kpis.values()) {
      expect(k.breakdown.factors.length, k.id).toBeGreaterThan(1);
      expect(k.breakdown.reconcile, k.id).toMatch(/=/);
    }
  });

  it.each([
    'booking-transaction-failure',
    'server-downtime-metrics',
    'monthly-recurring-revenue',
    'sales',
    'service-charge',
    'passengers',
    'vessels-or-partners',
    'weather-disrupted-trips',
  ])('%s: factors add up', (id) => {
    const k = get(id);
    close(sum(k), num(k.value), id);
  });

  it.each(['capacity-utilization', 'customer-lifetime-value', 'customer-acquisition-cost-cac'])(
    '%s: weighted average matches',
    (id) => {
      const k = get(id);
      expect(get(id).breakdown.factors.reduce((a, f) => a + (f.share ?? 0), 0), `${id} weights`).toBeCloseTo(100, 5);
      close(weighted(k), num(k.value), id);
    },
  );

  it('share-type KPIs sum to 100% and the headline is the largest part', () => {
    const top = get('top-acquisition-channel');
    close(sum(top), 100, 'top channel shares');
    expect(num(top.change)).toBe(num(top.breakdown.factors[0].value));
    expect(num(get('highest-demand-route').breakdown.factors[0].value)).toBe(12_800);
  });

  it('booking conversion is the product of its funnel steps', () => {
    const k = get('booking-conversion');
    const product = k.breakdown.factors.reduce((a, f) => a * (num(f.value) / 100), 1) * 100;
    close(product, num(k.value), k.id);
  });

  it('ratio KPIs match their inputs', () => {
    close(((18 + 24) / 58) * 100, num(get('operator-feature-adoption').value), 'feature adoption');
    close(((1_204 + 3_865) / (1_240 + 4_120)) * 100, num(get('support-sla-compliance').value), 'SLA');
    close(((4_275 + 3_725 + 3_263 + 3_038) / 50_000) * 100, num(get('promo-redemption-rate').value), 'promo');
    const fees = 0.038 * 38.2 + 0.046 * 18.6 + 0.052 * 7.4 + 0.044 * 4.2;
    close((fees / 68.4) * 100, num(get('take-rate').value), 'take rate');
  });
});

describe('Beetzee breakdowns reconcile for every view, period and campaign', () => {
  const views: BzView[] = ['core', 'marketing', 'app'];
  const periods: BzPeriod[] = ['daily', 'weekly', 'monthly'];
  const campaigns = ['all', ...BEETZEE_DATA.campaigns.map((c) => c.id)];
  const ratioIds = new Set(['cac', 'completion']);

  for (const view of views)
    for (const period of periods)
      for (const campaign of view === 'marketing' ? campaigns : ['all'])
        it(`${view} · ${period} · ${campaign}`, () => {
          const fig = BEETZEE_DATA.figures[period];
          for (const k of buildKpis(BEETZEE_DATA, view, period, campaign)) {
            const label = `${view}/${period}/${campaign}/${k.id}`;
            if (k.id === 'cac') close(fig.spend.n / fig.paying.n, num(k.value), label);
            else if (k.id === 'completion') {
              const [a, b] = k.breakdown.reconcile.split('=').at(-2)!.split('÷').map(num);
              close((a / b) * 100, num(k.value), label);
            } else if (!ratioIds.has(k.id)) {
              // Portfolio splits reconcile to the all-campaign total, not the filtered value.
              const total = k.breakdown.factors.some((f) => f.label === 'Other campaigns')
                ? num(k.breakdown.reconcile.split('=').at(-1)!)
                : num(k.value);
              close(sum(k), total, label);
            }
          }
        });
});

describe.runIf(GA_SNAPSHOT)('Google Analytics breakdowns reconcile (local snapshot)', () => {
  // Vitest still runs this body when the snapshot is absent, so nothing here may assume it exists.
  const ga = GA_SNAPSHOT as NonNullable<typeof GA_SNAPSHOT>;
  const selections: GaSelection[] = [
    ...(['daily', 'weekly', 'monthly'] as BzPeriod[]).map((period) => ({ kind: 'preset' as const, period })),
    ...(GA_SNAPSHOT?.months ?? []).map((m) => ({ kind: 'month' as const, month: m.month })),
    { kind: 'custom', from: '2026-07-01', to: '2026-09-15' },
    { kind: 'custom', from: '2026-10-10', to: '2026-10-16' },
    { kind: 'custom', from: '2026-06-01', to: '2026-10-21' },
    { kind: 'custom', from: '2026-09-11', to: '2026-09-11' },
  ];
  for (const sel of selections)
    it(JSON.stringify(sel), () => {
      for (const k of buildGaKpis(ga, sel)) {
        if (k.breakdown.kind === 'sum') close(sum(k), num(k.value), `${JSON.stringify(sel)}/${k.id}`);
      }
      if (sel.kind === 'month') {
        const m = ga.months.find((x) => x.month === sel.month)!.totals;
        const byId = new Map(buildGaKpis(ga, sel).map((k) => [k.id, k]));
        close(num(byId.get('ga-active-users')!.value), m.activeUsers, 'month active users (exact)');
        close(num(byId.get('ga-revenue')!.value), m.totalRevenue, 'month revenue');
      }
    });

  it('custom ranges add up exactly to GA month totals for additive metrics', () => {
    const sep = ga.months.find((m) => m.month === '2026-09')!.totals;
    const kpis = new Map(buildGaKpis(ga, { kind: 'custom', from: '2026-08-31', to: '2026-10-01' }).map((k) => [k.id, k]));
    // Custom range wider than September: new users must exceed September's exact total.
    expect(num(kpis.get('ga-new-users')!.value)).toBeGreaterThan(sep.newUsers);
  });
});
