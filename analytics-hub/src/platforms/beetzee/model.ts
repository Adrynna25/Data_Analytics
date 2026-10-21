/**
 * Builds Beetzee's KPI cards and their breakdowns for a view + period + campaign.
 * Every breakdown reconciles: its factors add up (or divide) to the card's number
 * for whichever period is selected.
 */
import type { BreakdownKind, Factor, KpiBreakdown, KpiData } from '@/components/kpi/types';
import type { IconName } from '@/shared/Icon';
import { compact } from '@/shared/format';
import type { BeetzeeData, BzPeriod, BzView, Campaign, Fig } from './data';

export type BzKpi = KpiData;

const VIEW_KPIS: Record<BzView, string[]> = {
  core: ['attributed-sales', 'signups', 'paying', 'active-users', 'investment', 'cac', 'completion', 'rewarded-ads'],
  marketing: ['budget', 'ad-spend', 'impressions', 'clicks', 'active-app-users', 'cac'],
  app: ['gross-sales', 'active-users', 'completion', 'rewarded-ads', 'signups'],
};

/** What each KPI is broken down by, and how its parts make the headline. */
const META: Record<string, [BreakdownKind, string]> = {
  investment: ['sum', 'Campaign'],
  'attributed-sales': ['sum', 'Campaign'],
  'active-users': ['sum', 'Platform'],
  'active-app-users': ['sum', 'Platform'],
  signups: ['sum', 'Sign-up source'],
  paying: ['sum', 'E-wallet'],
  completion: ['ratio', 'Genre'],
  'rewarded-ads': ['sum', 'Reward type'],
  cac: ['ratio', 'Calculation input'],
  budget: ['sum', 'Budget status'],
  'ad-spend': ['sum', 'Campaign'],
  impressions: ['sum', 'Campaign'],
  clicks: ['sum', 'Campaign'],
  'gross-sales': ['sum', 'Product'],
};

/** Key results shown first and highlighted; the rest are supporting metrics. */
export const FEATURED_KPIS: Partial<Record<BzView, string[]>> = {
  core: ['attributed-sales', 'signups', 'paying', 'active-users'],
};

export function findCampaign(data: BeetzeeData, id: string): Campaign | null {
  return data.campaigns.find((c) => c.id === id) ?? null;
}

const peso = (n: number) => `₱${compact(n)}`;
const int = (n: number) => Math.round(n).toLocaleString('en-US');
const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
const hours = (label: string) => {
  const n = parseFloat(label.replace(/,/g, ''));
  return /K/.test(label) ? n * 1000 : n;
};

/** Rounding step that matches how a total is displayed (₱4.82M → 10K, 239.6K → 100). */
const step = (total: number) => (total >= 1e6 ? 10_000 : total >= 1e3 ? 100 : 1);

/**
 * Splits `total` across weighted parts. Parts are rounded to the display step and the
 * remainder goes to the largest part, so the shown values add up to the shown total.
 */
function split(
  total: number,
  parts: { label: string; weight: number; detail?: string }[],
  fmt: (n: number) => string,
  noun = 'of total',
): Factor[] {
  const g = step(total);
  const target = Math.round(total / g) * g;
  const sum = parts.reduce((a, p) => a + p.weight, 0);
  const values = parts.map((p) => Math.round((target * p.weight) / sum / g) * g);
  const largest = values.indexOf(Math.max(...values));
  values[largest] += target - values.reduce((a, b) => a + b, 0);
  return parts.map((p, i) => {
    const share = (values[i] / target) * 100;
    return { label: p.label, value: fmt(values[i]), share, detail: p.detail ?? `${Math.round(share)}% ${noun}` };
  });
}

const sumLine = (factors: Factor[], total: string, suffix = '') =>
  `${factors.map((f) => f.value).join(' + ')} = ${total}${suffix}`;

export function buildKpis(data: BeetzeeData, view: BzView, period: BzPeriod, campaignId: string): BzKpi[] {
  const fig = data.figures[period];
  const fx = data.fixed;
  const t = data.trends;
  const campaigns = data.campaigns;
  const campaign = view === 'marketing' ? findCampaign(data, campaignId) : null;

  const campaignLabel = (c: Campaign) => `${c.name} (${c.channel})`;
  const byCampaign = (total: number, metric: (c: Campaign) => number, fmt: (n: number) => string, noun: string) =>
    split(total, campaigns.map((c) => ({ label: campaignLabel(c), weight: metric(c) })), fmt, noun);

  /** One campaign vs. the rest of the portfolio, so a filtered value still reconciles to the total. */
  const portfolio = (c: Campaign, part: Fig, total: Fig, fmt: (n: number) => string, noun: string) => {
    const rest = total.n - part.n;
    const factors: Factor[] = [
      { label: campaignLabel(c), value: part.label, share: (part.n / total.n) * 100, detail: `${pct((part.n / total.n) * 100)} ${noun}` },
      { label: 'Other campaigns', value: fmt(rest), share: (rest / total.n) * 100, detail: `${pct((rest / total.n) * 100)} ${noun}` },
    ];
    return { factors, reconcile: `${part.label} + ${fmt(rest)} other campaigns = ${total.label} in total` };
  };

  const spendSel = campaign?.spend[period] ?? fig.spend;
  const imprSel = campaign?.impressions[period] ?? fig.impressions;
  const clicksSel = campaign?.clicks[period] ?? fig.clicks;
  const cpc = spendSel.n / clicksSel.n;
  const cpm = (spendSel.n / imprSel.n) * 1000;
  const ctr = (clicksSel.n / imprSel.n) * 100;
  const roasAll = fig.attributedSales.n / fig.spend.n;
  const cac = fig.spend.n / fig.paying.n;
  const perPayer = fig.grossSales.n / fig.paying.n;
  const watched = hours(fig.watchedHrs);
  const runtime = hours(fig.runtimeHrs);

  const card = (
    id: string,
    label: string,
    value: string,
    trend: number,
    detail: string,
    icon: IconName,
    breakdown: Omit<KpiBreakdown, 'kind' | 'dimension'>,
    good = true,
  ): BzKpi => ({
    id,
    label,
    value,
    change: `${Math.abs(trend).toFixed(1)}%`,
    direction: trend >= 0 ? 'up' : 'down',
    tone: good ? 'good' : 'bad',
    detail,
    icon,
    breakdown: { kind: META[id][0], dimension: META[id][1], ...breakdown },
  });

  const spendFactors = byCampaign(fig.spend.n, (c) => c.spend[period].n, peso, 'of spend');
  const budgetUsed = (fig.spend.n / fig.budget.n) * 100;

  const activeUsers = (id: string, label: string) => {
    const factors = split(
      fig.activeUsers.n,
      data.platformSplit.map((p) => ({ label: p.label, weight: p.value })),
      compact,
      'of active users',
    );
    return card(id, label, fig.activeUsers.label, t.users, 'Viewers who played at least one episode', 'users', {
      method: 'Unique viewers who played at least one episode, by the platform they watched on.',
      factors,
      reconcile: sumLine(factors, fig.activeUsers.label, ' active users'),
      context: [{ label: 'Watched hours', value: fig.watchedHrs }],
    });
  };

  const rr = Math.round(runtime * 0.55);
  const dr = runtime - rr;
  const rw = Math.round(watched * 0.578);
  const dw = watched - rw;
  const completion = (watched / runtime) * 100;

  const salesFactors = byCampaign(fig.attributedSales.n, (c) => parseFloat(c.roas) * c.spend[period].n, peso, 'of attributed sales');
  const signupFactors = split(
    fig.signups.n,
    [
      { label: 'Paid ads', weight: 62 },
      { label: 'Organic & app stores', weight: 24 },
      { label: 'Referrals', weight: 14 },
    ],
    compact,
    'of sign-ups',
  );
  const payingFactors = split(
    fig.paying.n,
    data.wallets.map((w) => ({ label: `Paid with ${w.label}`, weight: w.value })),
    (n) => (n >= 1000 ? compact(n) : int(n)),
    'of paying users',
  );
  const adsFactors = split(
    fig.impressions.n,
    [
      { label: 'Episode unlocks', weight: 72 },
      { label: 'Daily check-in bonus', weight: 18 },
      { label: 'Bonus coin offers', weight: 10 },
    ],
    compact,
    'of ads served',
  );
  const grossFactors = split(
    fig.grossSales.n,
    [
      { label: 'Coin packs', weight: 62 },
      { label: 'VIP passes', weight: 30 },
      { label: 'Episode bundles', weight: 8 },
    ],
    peso,
    'of gross sales',
  );

  const adSpend = campaign
    ? portfolio(campaign, campaign.spend[period], fig.spend, peso, 'of total ad spend')
    : { factors: spendFactors, reconcile: sumLine(spendFactors, fig.spend.label, ' ad spend') };
  const impr = campaign
    ? portfolio(campaign, campaign.impressions[period], fig.impressions, compact, 'of all impressions')
    : (() => {
        const f = byCampaign(fig.impressions.n, (c) => c.impressions[period].n, compact, 'of impressions');
        return { factors: f, reconcile: sumLine(f, fig.impressions.label, ' impressions') };
      })();
  const clk = campaign
    ? portfolio(campaign, campaign.clicks[period], fig.clicks, compact, 'of all clicks')
    : (() => {
        const f = byCampaign(fig.clicks.n, (c) => c.clicks[period].n, compact, 'of clicks');
        return { factors: f, reconcile: sumLine(f, fig.clicks.label, ' clicks') };
      })();
  const roasLabel = campaign ? campaign.roas : `${roasAll.toFixed(2)}×`;

  const all: Record<string, BzKpi> = {
    investment: card('investment', 'Marketing investment', fig.spend.label, t.investment, `Paid media across ${campaigns.length} campaigns`, 'banknote', {
      method: 'Paid media spend, added up by campaign.',
      factors: spendFactors,
      reconcile: sumLine(spendFactors, fig.spend.label, ' invested'),
      context: [
        { label: 'Marketing budget', value: fig.budget.label },
        { label: 'Budget used', value: pct(budgetUsed) },
        { label: 'Remaining budget', value: fig.remaining.label },
      ],
    }),
    'attributed-sales': card('attributed-sales', 'Attributed sales', fig.attributedSales.label, t.sales, `ROAS ${roasAll.toFixed(2)}× on ${fig.spend.label} ad spend`, 'coins', {
      method: 'Sales from buyers acquired by paid campaigns, added up by the campaign that acquired them.',
      factors: salesFactors,
      reconcile: sumLine(salesFactors, fig.attributedSales.label, ' attributed sales'),
      context: [
        { label: 'Ad spend', value: fig.spend.label },
        { label: 'Return on ad spend (ROAS)', value: `${roasAll.toFixed(2)}× · ₱${roasAll.toFixed(2)} per ₱1` },
      ],
    }),
    'active-users': activeUsers('active-users', 'Active users'),
    'active-app-users': activeUsers('active-app-users', 'Active app users'),
    signups: card('signups', 'New sign-ups', fig.signups.label, t.signups, `${pct((fig.signups.n / fig.clicks.n) * 100)} of ad clicks sign up`, 'userPlus', {
      method: 'New accounts created, added up by where the user came from.',
      factors: signupFactors,
      reconcile: sumLine(signupFactors, fig.signups.label, ' sign-ups'),
      context: [{ label: 'Ad clicks', value: fig.clicks.label }],
    }),
    paying: card('paying', 'Paying users', fig.paying.label, t.paying, 'Users with a completed purchase', 'wallet', {
      method: 'Users with at least one completed purchase, by the e-wallet they paid with.',
      factors: payingFactors,
      reconcile: sumLine(payingFactors, fig.paying.label, ' paying users'),
      context: [
        { label: 'Purchases', value: fig.purchases.label },
        { label: 'Avg. revenue per payer', value: `₱${perPayer.toFixed(2)}` },
      ],
    }),
    completion: card('completion', 'Episode completion', pct(completion), fx.completionTrend, 'Watched hours ÷ runtime started', 'film', {
      method: 'Hours watched divided by the runtime of the episodes viewers started, by genre.',
      factors: [
        { label: 'Romance', value: pct((rw / rr) * 100), detail: `${int(rw)} of ${int(rr)} hrs watched · 55% of runtime`, share: 55 },
        { label: 'Drama', value: pct((dw / dr) * 100), detail: `${int(dw)} of ${int(dr)} hrs watched · 45% of runtime`, share: 45 },
      ],
      reconcile: `(${int(rw)} + ${int(dw)}) ÷ (${int(rr)} + ${int(dr)}) hrs = ${int(watched)} ÷ ${int(runtime)} = ${pct(completion)}`,
      context: [{ label: 'Active users', value: fig.activeUsers.label }],
      takeaway: 'Romance holds viewers longer than drama.',
    }),
    'rewarded-ads': card('rewarded-ads', 'Rewarded ads served', fig.impressions.label, t.ads, 'Ads watched to unlock episodes', 'eye', {
      method: 'Rewarded video ads completed by viewers, added up by what the reward was for.',
      factors: adsFactors,
      reconcile: sumLine(adsFactors, fig.impressions.label, ' rewarded ads'),
      context: [
        { label: 'Reward coin value', value: fig.rewardCoin.label },
        { label: 'Ads per ₱1.00 of coins', value: int(fig.impressions.n / fig.rewardCoin.n) },
      ],
    }),
    cac: card('cac', 'Customer acquisition cost', `₱${cac.toFixed(2)}`, fx.cacTrend, 'Ad spend ÷ new paying users', 'target', {
      method: 'Total paid media spend divided by the new paying users it brought in.',
      factors: [
        { label: 'Ad spend', value: fig.spend.label, detail: `₱${int(fig.spend.n)}` },
        { label: 'New paying users', value: fig.paying.label, detail: `${int(fig.paying.n)} users` },
      ],
      reconcile: `₱${int(fig.spend.n)} ÷ ${int(fig.paying.n)} new paying users = ₱${cac.toFixed(2)} per user`,
      context: [{ label: 'Cost per click (CPC)', value: `₱${(fig.spend.n / fig.clicks.n).toFixed(2)}` }],
      takeaway: 'Each new paying user costs about ₱' + cac.toFixed(2) + ' in ad spend.',
    }),
    budget: card('budget', 'Marketing budget', fig.budget.label, t.budget, `${pct(budgetUsed)} used · ${fig.remaining.label} left`, 'wallet', {
      method: 'The approved media budget, split into what has been spent and what is left.',
      factors: [
        { label: 'Spent on ads', value: fig.spend.label, detail: `${pct(budgetUsed)} of budget`, share: budgetUsed },
        { label: 'Remaining', value: fig.remaining.label, detail: `${pct(100 - budgetUsed)} of budget`, share: 100 - budgetUsed },
      ],
      reconcile: `${fig.spend.label} spent + ${fig.remaining.label} remaining = ${fig.budget.label} budget`,
    }),
    'ad-spend': card('ad-spend', 'Ad spend', spendSel.label, t.investment, `CPC ₱${cpc.toFixed(2)} · CPM ₱${cpm.toFixed(2)}`, 'banknote', {
      method: campaign ? 'This campaign’s spend against total paid media spend.' : 'Paid media spend, added up by campaign.',
      factors: adSpend.factors,
      reconcile: adSpend.reconcile,
      context: [
        { label: 'Cost per click (CPC)', value: `₱${cpc.toFixed(2)}` },
        { label: 'Cost per 1,000 impressions (CPM)', value: `₱${cpm.toFixed(2)}` },
        { label: 'Return on ad spend (ROAS)', value: roasLabel },
      ],
    }),
    impressions: card('impressions', 'Impressions', imprSel.label, t.ads, `Click-through rate ${pct(ctr, 2)}`, 'eye', {
      method: campaign ? 'This campaign’s impressions against all campaign impressions.' : 'Ad impressions served, added up by campaign.',
      factors: impr.factors,
      reconcile: impr.reconcile,
      context: [
        { label: 'Click-through rate (CTR)', value: pct(ctr, 2) },
        { label: 'Peak impressions', value: fig.peak },
      ],
    }),
    clicks: card('clicks', 'Ad clicks', clicksSel.label, t.clicks, `CPC ₱${cpc.toFixed(2)}`, 'pointer', {
      method: campaign ? 'This campaign’s clicks against all campaign clicks.' : 'Ad clicks, added up by campaign.',
      factors: clk.factors,
      reconcile: clk.reconcile,
      context: [
        { label: 'Click-through rate (CTR)', value: pct(ctr, 2) },
        { label: 'Sign-ups from clicks', value: pct((fig.signups.n / fig.clicks.n) * 100) },
      ],
    }),
    'gross-sales': card('gross-sales', 'Gross sales', fig.grossSales.label, t.sales, 'All in-app purchases before fees', 'coins', {
      method: 'All in-app purchases before fees, added up by what was bought.',
      factors: grossFactors,
      reconcile: sumLine(grossFactors, fig.grossSales.label, ' gross sales'),
      context: [
        { label: 'Purchases', value: fig.purchases.label },
        { label: 'Avg. revenue per payer', value: `₱${perPayer.toFixed(2)}` },
      ],
    }),
  };

  return VIEW_KPIS[view].map((id) => all[id]);
}
