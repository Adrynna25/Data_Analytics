import { describe, expect, it } from 'vitest';
import type { KpiData } from '@/components/kpi/types';
import { BEETZEE_DATA, type BzPeriod, type BzView } from './beetzee/data';
import { buildKpis } from './beetzee/model';
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

  it('every KPI has factors and a reconciliation line', () => {
    for (const k of kpis.values()) {
      expect(k.breakdown.factors.length, k.id).toBeGreaterThan(1);
      expect(k.breakdown.reconcile, k.id).toMatch(/=/);
    }
  });

  it.each([
    'booking-transaction-failure',
    'cart-abandonment',
    'server-downtime-metrics',
    'payment-gateway-and-refund-report',
    'monthly-recurring-revenue',
    'gross-booking-value',
    'monthly-active-bookers',
    'sales',
    'service-charge',
    'passengers',
    'vessels-or-partners',
    'weather-disrupted-trips',
  ])('%s: factors add up', (id) => {
    const k = get(id);
    close(sum(k), num(k.value), id);
  });

  it.each(['payment-gateway-success', 'app-performance-crash-rate', 'capacity-utilization', 'customer-lifetime-value', 'customer-acquisition-cost-cac'])(
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
    const route = get('route-and-schedule-popularity');
    close(sum(route), 12_800, 'route departures');
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
