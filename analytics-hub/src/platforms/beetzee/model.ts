/** Builds the KPI tiles (and their breakdown cards) for a view + period + campaign. */
import type { BeetzeeData, BzPeriod, BzView, Campaign } from './data';
import { compact } from '@/shared/format';
import { buildSeries, sparkline } from './series';

export type Accent = 'gold' | 'orange' | 'teal' | 'violet' | 'coral' | 'blue';

export interface Breakdown {
  title: string;
  subtitle: string;
  /** `note` is an optional one-line explanation shown under the value. */
  metrics: { label: string; value: string; note?: string }[];
  method: { shows: string; calc: string; source: string };
}

export interface BzKpi {
  id: string;
  label: string;
  value: string;
  /** Signed percent change vs. the previous period. */
  trend: number;
  /** Whether the direction of `trend` is good for the business. */
  good: boolean;
  accent: Accent;
  spark?: number[];
  breakdown: Breakdown;
}

/** ROAS card: spelled out, with what the multiple means in pesos. */
const roasMetric = (roas: string) => ({
  label: 'Return on ad spend (ROAS)',
  value: roas,
  note: `₱${roas.replace('×', '')} in sales for every ₱1 of ad spend`,
});

const VIEW_KPIS: Record<BzView, string[]> = {
  core: ['investment', 'attributed-sales', 'active-users', 'signups', 'paying', 'completion', 'rewarded-ads', 'cac'],
  marketing: ['budget', 'ad-spend', 'impressions', 'clicks', 'active-app-users', 'cac'],
  app: ['gross-sales', 'active-users', 'completion', 'rewarded-ads', 'signups'],
};

export function findCampaign(data: BeetzeeData, id: string): Campaign | null {
  return data.campaigns.find((c) => c.id === id) ?? null;
}

export function buildKpis(
  data: BeetzeeData,
  view: BzView,
  period: BzPeriod,
  campaignId: string,
  rangeLabel = data.periods[period].range,
  /** Report filter shown in breakdown subtitles (e.g. a platform); campaigns name themselves. */
  filterLabel?: string,
): BzKpi[] {
  const fig = data.figures[period];
  const fx = data.fixed;
  const t = data.trends;
  const campaign = view === 'marketing' ? findCampaign(data, campaignId) : null;
  const spend = campaign?.spend[period] ?? fig.spend;
  const impressions = campaign?.impressions[period] ?? fig.impressions;
  const clicks = campaign?.clicks[period] ?? fig.clicks;
  const ctr = campaign?.ctr ?? fx.ctr;
  const roas = campaign?.roas ?? fx.roas;
  const scope = filterLabel ? ` · ${filterLabel}` : campaign ? ` · ${campaign.name}` : '';
  const sub = (s: string) => `${s} · ${rangeLabel}${scope}`;
  const spark = (total: number, key: string) => sparkline(buildSeries(total, period, key).values);

  /** Splits a user total across platforms (Android / iOS / Web) so the parts sum exactly to the total. */
  const splitByPlatform = (total: number) => {
    const parts = data.platformSplit.map((p) => Math.round((total * p.value) / 100));
    parts[parts.length - 1] += total - parts.reduce((a, b) => a + b, 0);
    return data.platformSplit.map((p, i) => ({ label: `${p.label} · ${p.value}%`, value: compact(parts[i]) }));
  };

  const activeUsers = (id: string, label: string): BzKpi => ({
    id,
    label,
    value: fig.activeUsers.label,
    trend: t.users,
    good: true,
    accent: 'teal',
    spark: spark(fig.activeUsers.n, 'users'),
    breakdown: {
      title: label,
      subtitle: sub('Active users by device platform'),
      metrics: splitByPlatform(fig.activeUsers.n),
      method: {
        shows: 'Unique users who opened the app and played at least one episode, split by the platform they watched on.',
        calc: 'Distinct user IDs with a play event; platform shares add up to the total',
        source: 'App analytics',
      },
    },
  });

  const all: Record<string, BzKpi> = {
    investment: {
      id: 'investment',
      label: 'Marketing investment',
      value: fig.spend.label,
      trend: t.investment,
      good: true,
      accent: 'gold',
      spark: spark(fig.spend.n, 'spend'),
      breakdown: {
        title: 'Marketing investment',
        subtitle: sub('Paid media spend against budget'),
        metrics: [
          { label: 'Ad spend', value: fig.spend.label },
          { label: 'Marketing budget', value: fig.budget.label },
          { label: 'Budget utilization', value: fx.budgetUtilization },
          { label: 'Remaining budget', value: fig.remaining.label },
        ],
        method: {
          shows: 'Paid media spend across all active campaigns.',
          calc: 'Sum of campaign spend in the period',
          source: 'Ad platforms',
        },
      },
    },
    'attributed-sales': {
      id: 'attributed-sales',
      label: 'Attributed sales',
      value: fig.attributedSales.label,
      trend: t.sales,
      good: true,
      accent: 'teal',
      spark: spark(fig.attributedSales.n, 'sales'),
      breakdown: {
        title: 'Attributed sales',
        subtitle: sub('Revenue linked to paid acquisition'),
        metrics: [
          { label: 'Attributed sales', value: fig.attributedSales.label },
          { label: 'Direct purchases', value: fig.purchases.label },
          roasMetric(fx.roas),
          { label: 'Store conversion', value: fx.storeConversion },
        ],
        method: {
          shows: 'Sales connected to users acquired through paid campaigns.',
          calc: 'Sum of attributed completed purchases',
          source: 'Marketing + payment data',
        },
      },
    },
    'active-users': activeUsers('active-users', 'Active users'),
    'active-app-users': activeUsers('active-app-users', 'Active app users'),
    signups: {
      id: 'signups',
      label: 'New sign-ups',
      value: fig.signups.label,
      trend: t.signups,
      good: true,
      accent: 'violet',
      spark: spark(fig.signups.n, 'signups'),
      breakdown: {
        title: 'New sign-ups',
        subtitle: sub('Accounts created from all sources'),
        metrics: [
          { label: 'Sign-ups', value: fig.signups.label },
          { label: 'Ad clicks', value: fig.clicks.label },
          { label: 'Click-to-sign-up', value: fx.clickToSignup },
          { label: 'Paying users', value: fig.paying.label },
        ],
        method: {
          shows: 'New accounts registered in the app during the period.',
          calc: 'Count of completed registrations',
          source: 'App analytics',
        },
      },
    },
    paying: {
      id: 'paying',
      label: 'Paying users',
      value: fig.paying.label,
      trend: t.paying,
      good: true,
      accent: 'orange',
      breakdown: {
        title: 'Paying users',
        subtitle: sub('Users with at least one completed purchase'),
        metrics: [
          { label: 'Paying users', value: fig.paying.label },
          { label: 'Purchases', value: fig.purchases.label },
          { label: 'Avg. revenue per payer', value: fx.revenuePerPayer },
          { label: 'Payment conversion', value: fx.storeConversion },
        ],
        method: {
          shows: 'Unique users who completed at least one coin or VIP purchase.',
          calc: 'Distinct payer IDs with a settled payment',
          source: 'Payment records',
        },
      },
    },
    completion: {
      id: 'completion',
      label: 'Episode completion',
      value: fx.completion,
      trend: fx.completionTrend,
      good: true,
      accent: 'blue',
      breakdown: {
        title: 'Episode completion',
        subtitle: sub('How much of each started episode is watched'),
        metrics: [
          { label: 'Total runtime', value: fig.runtimeHrs },
          { label: 'Watched hours', value: fig.watchedHrs },
        ],
        method: {
          shows: 'Share of started episode runtime that viewers actually watched.',
          calc: 'Watched hours ÷ runtime of started episodes',
          source: 'App analytics',
        },
      },
    },
    'rewarded-ads': {
      id: 'rewarded-ads',
      label: 'Rewarded ads served',
      value: fig.impressions.label,
      trend: t.ads,
      good: true,
      accent: 'orange',
      spark: spark(fig.impressions.n, 'impressions'),
      breakdown: {
        title: 'Rewarded ads served',
        subtitle: sub('Ads watched in exchange for coins'),
        metrics: [
          { label: 'Reward coin value', value: fig.rewardCoin.label },
          { label: 'Ads per ₱1.00 of coins', value: fx.adsPerPeso },
          { label: 'Peak impressions', value: fig.peak },
        ],
        method: {
          shows: 'Rewarded video ads completed by viewers to unlock episodes.',
          calc: 'Count of completed rewarded ad views',
          source: 'Ad mediation + app analytics',
        },
      },
    },
    cac: {
      id: 'cac',
      label: 'Customer acquisition cost',
      value: fx.cac,
      trend: fx.cacTrend,
      good: true,
      accent: 'coral',
      breakdown: {
        title: 'Customer acquisition cost',
        subtitle: sub('Paid cost to win one paying user'),
        metrics: [
          { label: 'Acquisition cost', value: fx.cac },
          { label: 'Marketing spend', value: fig.spend.label },
          { label: 'Paying users', value: fig.paying.label },
          { label: 'CPC', value: fx.cpc },
        ],
        method: {
          shows: 'Average paid media cost required to gain one paying user.',
          calc: 'Marketing spend ÷ new paying users',
          source: 'Marketing + payment data',
        },
      },
    },
    budget: {
      id: 'budget',
      label: 'Marketing budget',
      value: fig.budget.label,
      trend: t.budget,
      good: true,
      accent: 'gold',
      breakdown: {
        title: 'Marketing budget',
        subtitle: sub('Planned media budget for the period'),
        metrics: [
          { label: 'Budget', value: fig.budget.label },
          { label: 'Ad spend', value: fig.spend.label },
          { label: 'Remaining budget', value: fig.remaining.label },
          { label: 'Budget utilization', value: fx.budgetUtilization },
        ],
        method: {
          shows: 'Approved paid-media budget and how much of it is used.',
          calc: 'Ad spend ÷ approved budget',
          source: 'Finance plan + ad platforms',
        },
      },
    },
    'ad-spend': {
      id: 'ad-spend',
      label: 'Ad spend',
      value: spend.label,
      trend: t.investment,
      good: true,
      accent: 'orange',
      spark: spark(spend.n, `spend-${campaignId}`),
      breakdown: {
        title: 'Ad spend',
        subtitle: sub('Media cost and efficiency'),
        metrics: [
          { label: 'Ad spend', value: spend.label },
          { label: 'CPC', value: fx.cpc },
          { label: 'CPM', value: fx.cpm },
          roasMetric(roas),
        ],
        method: {
          shows: 'What was paid to ad platforms for delivered media.',
          calc: 'Sum of billed spend per campaign',
          source: 'Ad platforms',
        },
      },
    },
    impressions: {
      id: 'impressions',
      label: 'Impressions',
      value: impressions.label,
      trend: t.ads,
      good: true,
      accent: 'violet',
      spark: spark(impressions.n, `impressions-${campaignId}`),
      breakdown: {
        title: 'Impressions',
        subtitle: sub('Ad delivery volume'),
        metrics: [
          { label: 'Impressions', value: impressions.label },
          { label: 'CPM', value: fx.cpm },
          { label: 'CTR', value: ctr },
          { label: 'Peak impressions', value: fig.peak },
        ],
        method: {
          shows: 'How many times campaign ads were displayed.',
          calc: 'Sum of served impressions',
          source: 'Ad platforms',
        },
      },
    },
    clicks: {
      id: 'clicks',
      label: 'Ad clicks',
      value: clicks.label,
      trend: t.clicks,
      good: true,
      accent: 'blue',
      spark: spark(clicks.n, `clicks-${campaignId}`),
      breakdown: {
        title: 'Ad clicks',
        subtitle: sub('Engagement with paid ads'),
        metrics: [
          { label: 'Clicks', value: clicks.label },
          { label: 'CTR', value: ctr },
          { label: 'CPC', value: fx.cpc },
          { label: 'Sign-ups', value: fig.signups.label },
        ],
        method: {
          shows: 'Clicks from ads through to the app store or landing page.',
          calc: 'Sum of link clicks',
          source: 'Ad platforms',
        },
      },
    },
    'gross-sales': {
      id: 'gross-sales',
      label: 'Gross sales',
      value: fig.grossSales.label,
      trend: t.sales,
      good: true,
      accent: 'teal',
      spark: spark(fig.grossSales.n, 'gross'),
      breakdown: {
        title: 'Gross platform sales',
        subtitle: sub('All in-app purchases before fees'),
        metrics: [
          { label: 'Gross platform sales', value: fig.grossSales.label },
          { label: 'Purchases', value: fig.purchases.label },
          { label: 'Avg. revenue per payer', value: fx.revenuePerPayer },
          { label: 'Paying users', value: fig.paying.label },
        ],
        method: {
          shows: 'Total value of coin packs and VIP passes sold in the app.',
          calc: 'Sum of settled purchase amounts',
          source: 'Payment records',
        },
      },
    },
  };

  // A breakdown only lists what the tile doesn't already show.
  return VIEW_KPIS[view].map((id) => {
    const k = all[id];
    return { ...k, breakdown: { ...k.breakdown, metrics: k.breakdown.metrics.filter((m) => m.value !== k.value) } };
  });
}

export const VIEW_KPI_IDS = VIEW_KPIS;
