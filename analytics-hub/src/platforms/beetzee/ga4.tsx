/**
 * Real Beetzee Play app usage from Google Analytics 4 (pulled through Supermetrics).
 *
 * The snapshot lives in `ga4.snapshot.json`, which is git-ignored so real numbers are
 * never committed or deployed. When the file is missing (e.g. on Vercel) the
 * Application & Users page falls back to sample data.
 *
 * Ranges:
 *  - Presets (Daily / Weekly / Monthly), full calendar months and single days use totals GA
 *    calculated for exactly that range, so unique counts (active users, paying users) are exact.
 *  - Any other custom range is built from daily rows. New users, revenue, purchases and
 *    engagement time add up exactly; unique users cannot be added across days, so that view
 *    shows average daily active users and purchases instead, and says so.
 */
import { useState } from 'react';
import type { Factor, KpiBreakdown, KpiData } from '@/components/kpi/types';
import { DateRangeForm } from '@/shared/DateRangeForm';
import { formatDateRange, MONTHS } from '@/shared/format';
import type { IconName } from '@/shared/Icon';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACCENT_HEX, Donut, TrendChart } from './components/charts';
import type { ReportSection } from './components/Reports';
import type { BzPeriod } from './data';

interface Totals {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  userEngagementDuration: number;
  screenPageViews: number;
  totalPurchasers: number;
  ecommercePurchases: number;
  totalRevenue: number;
  crashAffectedUsers?: number;
}

/** [date, activeUsers, newUsers, sessions, engagedSessions, engagementSec, views, purchasers, purchases, revenue] */
type Row = [string, number, number, number, number, number, number, number, number, number];

export interface GaSnapshot {
  source: string;
  property: { id: string; name: string };
  fetchedAt: string;
  timezone: string;
  currency: string;
  dataStart: string;
  periods: Record<BzPeriod, { from: string; to: string; compareFrom: string; compareTo: string; current: Totals; previous: Totals }>;
  months: { month: string; from: string; to: string; totals: Totals }[];
  revenueByTransactionCurrency: { currencyCode: string; totalRevenue: number }[];
  history: Row[];
}

export type GaSelection =
  | { kind: 'preset'; period: BzPeriod }
  | { kind: 'month'; month: string }
  | { kind: 'custom'; from: string; to: string };

// Optional import: resolves to {} when the git-ignored snapshot is absent.
const files = import.meta.glob<GaSnapshot>('./ga4.snapshot.json', { eager: true, import: 'default' });
export const GA_SNAPSHOT: GaSnapshot | null = files['./ga4.snapshot.json'] ?? null;

// ── Formatting ──────────────────────────────────────────────────────────
const int = (n: number) => Math.round(n).toLocaleString('en-US');
const money = (n: number) => `₱${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number, d = 1) => `${n.toFixed(d)}%`;
const duration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${s}s`;
};
const shortDate = (iso: string) => formatDateRange(iso, iso).replace(/, \d{4}$/, '');
const monthName = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const share = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100);

// ── Dates ───────────────────────────────────────────────────────────────
const DAY = 86_400_000;
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => toIso(toTime(iso) + n * DAY);

export const gaBounds = (ga: GaSnapshot) => ({ min: ga.dataStart, max: ga.history[ga.history.length - 1][0] });

/** Daily rows for every calendar day in the range (GA omits empty days; those become zeros). */
function rowsBetween(ga: GaSnapshot, from: string, to: string): Row[] {
  const byDate = new Map(ga.history.map((r) => [r[0], r]));
  const out: Row[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(byDate.get(d) ?? [d, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  return out;
}

function sumRows(rows: Row[]) {
  const s = { dau: 0, newUsers: 0, sessions: 0, engagedSessions: 0, engagement: 0, views: 0, purchases: 0, revenue: 0 };
  for (const r of rows) {
    s.dau += r[1];
    s.newUsers += r[2];
    s.sessions += r[3];
    s.engagedSessions += r[4];
    s.engagement += r[5];
    s.views += r[6];
    s.purchases += r[8];
    s.revenue += r[9];
  }
  return s;
}

const rowTotals = (r: Row): Totals => ({
  activeUsers: r[1],
  newUsers: r[2],
  sessions: r[3],
  engagedSessions: r[4],
  userEngagementDuration: r[5],
  screenPageViews: r[6],
  totalPurchasers: r[7],
  ecommercePurchases: r[8],
  totalRevenue: r[9],
});

// ── Resolving a selection ───────────────────────────────────────────────
interface Resolved {
  from: string;
  to: string;
  label: string;
  comparison: string;
  /** True when unique counts come straight from GA for this exact range. */
  exact: boolean;
  cur?: Totals;
  prev?: Totals;
  rows: Row[];
  prevRows?: Row[];
}

export function resolveGa(ga: GaSnapshot, sel: GaSelection): Resolved {
  if (sel.kind === 'preset') {
    const p = ga.periods[sel.period];
    const comparison = { daily: 'vs. previous day', weekly: 'vs. previous 7 days', monthly: 'vs. previous 30 days' }[sel.period];
    return { from: p.from, to: p.to, label: formatDateRange(p.from, p.to), comparison, exact: true, cur: p.current, prev: p.previous, rows: rowsBetween(ga, p.from, p.to) };
  }
  if (sel.kind === 'month') {
    const i = ga.months.findIndex((m) => m.month === sel.month);
    const m = ga.months[i];
    const prevMonth = ga.months[i - 1];
    const partial = addDays(m.to, 1).slice(0, 7) === m.month; // data stops before the month ends
    return {
      from: m.from,
      to: m.to,
      label: `${formatDateRange(m.from, m.to)}${partial ? ' (month to date)' : ''}`,
      comparison: prevMonth ? `vs. ${partial ? 'all of ' : ''}${monthName(prevMonth.month)}` : 'no earlier month',
      exact: true,
      cur: m.totals,
      prev: prevMonth?.totals,
      rows: rowsBetween(ga, m.from, m.to),
    };
  }
  const { min, max } = gaBounds(ga);
  const from = sel.from < min ? min : sel.from;
  const to = sel.to > max ? max : sel.to;
  const rows = rowsBetween(ga, from, to);
  const len = rows.length;
  const prevFrom = addDays(from, -len);
  const prevTo = addDays(from, -1);
  const hasPrev = prevFrom >= min;
  const comparison = hasPrev ? `vs. ${formatDateRange(prevFrom, prevTo)}` : 'no earlier data';
  if (from === to) {
    // A single day's GA row is exact, unique counts included.
    const prevRow = hasPrev ? rowsBetween(ga, prevFrom, prevTo)[0] : undefined;
    return { from, to, label: formatDateRange(from, to), comparison, exact: true, cur: rowTotals(rows[0]), prev: prevRow && rowTotals(prevRow), rows };
  }
  return { from, to, label: formatDateRange(from, to), comparison, exact: false, rows, prevRows: hasPrev ? rowsBetween(ga, prevFrom, prevTo) : undefined };
}

// ── KPI cards ───────────────────────────────────────────────────────────
function change(cur: number, prev: number | undefined) {
  if (prev === undefined || prev === 0) return { change: '—', direction: 'up' as const, tone: 'neutral' as const };
  const delta = ((cur - prev) / prev) * 100;
  return { change: `${Math.abs(delta).toFixed(1)}%`, direction: delta >= 0 ? ('up' as const) : ('down' as const), tone: delta >= 0 ? ('good' as const) : ('bad' as const) };
}

const card = (
  id: string,
  label: string,
  value: string,
  cur: number,
  prev: number | undefined,
  detail: string,
  icon: IconName,
  breakdown: KpiBreakdown,
): KpiData => ({ id, label, value, ...change(cur, prev), detail, icon, breakdown });

/** ≤14 days → by day, ≤92 days → 7-day blocks, longer → calendar months. Column 2 new users, 8 purchases, 9 revenue. */
function timeSplit(rows: Row[], col: 2 | 8 | 9, fmt: (n: number) => string, noun: string): { factors: Factor[]; dimension: string } {
  const total = rows.reduce((a, r) => a + r[col], 0);
  const groups: Row[][] = [];
  let dimension: string;
  if (rows.length <= 14) {
    dimension = 'Day';
    rows.forEach((r) => groups.push([r]));
  } else if (rows.length <= 92) {
    dimension = 'Week';
    for (let i = 0; i < rows.length; i += 7) groups.push(rows.slice(i, i + 7));
  } else {
    dimension = 'Month';
    for (const r of rows) {
      const last = groups[groups.length - 1];
      if (last && last[0][0].slice(0, 7) === r[0].slice(0, 7)) last.push(r);
      else groups.push([r]);
    }
  }
  const factors = groups.map((g) => {
    const v = g.reduce((a, r) => a + r[col], 0);
    const label =
      dimension === 'Month'
        ? monthName(g[0][0].slice(0, 7))
        : g.length > 1
          ? `${shortDate(g[0][0])} – ${shortDate(g[g.length - 1][0])}`
          : shortDate(g[0][0]);
    return { label, value: fmt(v), share: share(v, total), detail: `${Math.round(share(v, total))}% of ${noun}` };
  });
  return { factors, dimension };
}

export function buildGaKpis(ga: GaSnapshot, sel: GaSelection): KpiData[] {
  const r = resolveGa(ga, sel);
  return r.exact ? exactKpis(ga, r) : derivedKpis(r);
}

/** Presets, full months and single days: GA's own totals for the range. */
function exactKpis(ga: GaSnapshot, r: Resolved): KpiData[] {
  const c = r.cur!;
  const p = r.prev;
  const oneDay = r.rows.length <= 1;
  const returning = Math.max(0, c.activeUsers - c.newUsers);
  const notEngaged = c.sessions - c.engagedSessions;
  const nonPaying = c.activeUsers - c.totalPurchasers;
  const arppu = c.totalPurchasers ? c.totalRevenue / c.totalPurchasers : 0;
  const engPerUser = c.activeUsers ? c.userEngagementDuration / c.activeUsers : 0;
  const prevEng = p && p.activeUsers ? p.userEngagementDuration / p.activeUsers : undefined;

  const newSplit = oneDay
    ? {
        dimension: 'User type',
        factors: [
          { label: 'New users', value: int(c.newUsers), share: share(c.newUsers, c.activeUsers), detail: `${pct(share(c.newUsers, c.activeUsers))} of active users` },
          { label: 'Returning users', value: int(returning), share: share(returning, c.activeUsers), detail: 'Active users who had opened the app before' },
        ],
      }
    : timeSplit(r.rows, 2, int, 'new users');
  const revSplit = oneDay
    ? {
        dimension: 'Calculation input',
        factors: [
          { label: 'Paying users', value: int(c.totalPurchasers), detail: 'Users with a completed purchase' },
          { label: 'Avg. revenue per paying user', value: money(arppu) },
        ],
      }
    : timeSplit(r.rows, 9, money, 'revenue');
  const isLast30 = r.from === ga.periods.monthly.from && r.to === ga.periods.monthly.to;

  return [
    card('ga-active-users', 'Active users', int(c.activeUsers), c.activeUsers, p?.activeUsers, 'Unique users who opened the app', 'users', {
      kind: 'sum',
      dimension: 'User type',
      method: 'Unique users who opened the app, split into first-time users and returning users (active users minus new users).',
      factors: [
        { label: 'New users', value: int(c.newUsers), share: share(c.newUsers, c.activeUsers), detail: `${pct(share(c.newUsers, c.activeUsers))} of active users` },
        { label: 'Returning users', value: int(returning), share: share(returning, c.activeUsers), detail: `${pct(share(returning, c.activeUsers))} of active users` },
      ],
      reconcile: `${int(c.newUsers)} new + ${int(returning)} returning = ${int(c.newUsers + returning)} active users`,
      context: [{ label: 'Platform', value: 'iOS (100% of users)' }],
    }),
    card('ga-new-users', 'New users', int(c.newUsers), c.newUsers, p?.newUsers, `${pct(share(c.newUsers, c.activeUsers))} of active users`, 'userPlus', {
      kind: oneDay ? 'ratio' : 'sum',
      dimension: newSplit.dimension,
      method: oneDay ? 'Users who opened the app for the first time, compared with everyone active that day.' : 'Users who opened the app for the first time, added up over the range.',
      factors: newSplit.factors,
      reconcile: oneDay
        ? `${int(c.newUsers)} new of ${int(c.activeUsers)} active users = ${pct(share(c.newUsers, c.activeUsers))}`
        : `${newSplit.factors.map((f) => f.value).join(' + ')} = ${int(c.newUsers)} new users`,
      context: [{ label: 'Acquisition source', value: '(direct) / (none) · 100%' }],
    }),
    card('ga-sessions', 'Sessions', int(c.sessions), c.sessions, p?.sessions, `${pct(share(c.engagedSessions, c.sessions))} engaged`, 'pulse', {
      kind: 'sum',
      dimension: 'Session type',
      method: 'App sessions, split into engaged sessions (10+ seconds, a key event, or 2+ screens) and the rest.',
      factors: [
        { label: 'Engaged sessions', value: int(c.engagedSessions), share: share(c.engagedSessions, c.sessions), detail: `${pct(share(c.engagedSessions, c.sessions))} of sessions` },
        { label: 'Not engaged', value: int(notEngaged), share: share(notEngaged, c.sessions), detail: `${pct(share(notEngaged, c.sessions))} of sessions` },
      ],
      reconcile: `${int(c.engagedSessions)} engaged + ${int(notEngaged)} not engaged = ${int(c.sessions)} sessions`,
      context: [{ label: 'Sessions per active user', value: c.activeUsers ? (c.sessions / c.activeUsers).toFixed(2) : '—' }],
    }),
    card('ga-paying', 'Paying users', int(c.totalPurchasers), c.totalPurchasers, p?.totalPurchasers, `${pct(share(c.totalPurchasers, c.activeUsers), 2)} of active users`, 'wallet', {
      kind: 'ratio',
      dimension: 'User type',
      method: 'Active users who completed at least one purchase, against everyone who was active.',
      factors: [
        { label: 'Paying users', value: int(c.totalPurchasers), share: share(c.totalPurchasers, c.activeUsers), detail: `${pct(share(c.totalPurchasers, c.activeUsers), 2)} of active users` },
        { label: 'Did not purchase', value: int(nonPaying), share: share(nonPaying, c.activeUsers), detail: `${pct(share(nonPaying, c.activeUsers), 2)} of active users` },
      ],
      reconcile: `${int(c.totalPurchasers)} paying of ${int(c.activeUsers)} active users = ${pct(share(c.totalPurchasers, c.activeUsers), 2)} purchaser conversion`,
      context: [{ label: 'Avg. revenue per paying user', value: money(arppu) }],
      takeaway: c.totalPurchasers ? `About ${int(c.activeUsers / c.totalPurchasers)} active users for every paying user.` : 'No purchases in this range.',
    }),
    card('ga-revenue', 'Revenue', money(c.totalRevenue), c.totalRevenue, p?.totalRevenue, `From ${int(c.totalPurchasers)} paying users`, 'coins', {
      kind: oneDay ? 'ratio' : 'sum',
      dimension: revSplit.dimension,
      method: oneDay ? 'In-app purchase revenue: paying users × average revenue per paying user.' : 'In-app purchase revenue in the property’s currency, added up over the range.',
      factors: revSplit.factors,
      reconcile: oneDay ? `${int(c.totalPurchasers)} × ${money(arppu)} = ${money(c.totalRevenue)}` : `${revSplit.factors.map((f) => f.value).join(' + ')} = ${money(c.totalRevenue)}`,
      context: [
        { label: 'Avg. revenue per paying user', value: money(arppu) },
        ...(isLast30 ? ga.revenueByTransactionCurrency.map((x) => ({ label: `Paid in ${x.currencyCode}`, value: money(x.totalRevenue) })) : []),
      ],
    }),
    card('ga-engagement', 'Engagement per user', duration(engPerUser), engPerUser, prevEng, 'Average time in the app per active user', 'clock', {
      kind: 'ratio',
      dimension: 'Calculation input',
      method: 'Total time users spent in the app, divided by active users.',
      factors: [
        { label: 'Total engagement time', value: `${int(c.userEngagementDuration / 3600)} hrs` },
        { label: 'Active users', value: int(c.activeUsers) },
      ],
      reconcile: `${int(c.userEngagementDuration / 3600)} hrs ÷ ${int(c.activeUsers)} users = ${duration(engPerUser)} per user`,
      context: [{ label: 'Screen views', value: int(c.screenPageViews) }],
    }),
  ];
}

/** Custom multi-day ranges: built from daily rows; unique counts become daily averages. */
function derivedKpis(r: Resolved): KpiData[] {
  const days = r.rows.length;
  const s = sumRows(r.rows);
  const ps = r.prevRows ? sumRows(r.prevRows) : undefined;
  const avgDau = s.dau / days;
  const prevAvgDau = ps ? ps.dau / days : undefined;
  const engPerDau = s.dau ? s.engagement / s.dau : 0;
  const prevEngPerDau = ps && ps.dau ? ps.engagement / ps.dau : undefined;
  const notEngaged = s.sessions - s.engagedSessions;
  const newSplit = timeSplit(r.rows, 2, int, 'new users');
  const buySplit = timeSplit(r.rows, 8, int, 'purchases');
  const revSplit = timeSplit(r.rows, 9, money, 'revenue');
  const note = 'Custom range: GA can’t add unique users across days, so this shows a daily average.';

  return [
    card('ga-avg-dau', 'Avg. daily active users', int(avgDau), avgDau, prevAvgDau, `Over ${days} days`, 'users', {
      kind: 'ratio',
      dimension: 'Calculation input',
      method: `${note} Each day’s active users are added up, then divided by the number of days.`,
      factors: [
        { label: 'Daily active users, added up', value: int(s.dau), detail: 'User-days: a person active on 3 days counts 3 times' },
        { label: 'Days in range', value: int(days) },
      ],
      reconcile: `${int(s.dau)} ÷ ${days} days = ${int(avgDau)} active users per day`,
      takeaway: 'For exact unique users, pick a full month or a Daily / Weekly / Monthly preset.',
    }),
    card('ga-new-users', 'New users', int(s.newUsers), s.newUsers, ps?.newUsers, 'First-time users in the range', 'userPlus', {
      kind: 'sum',
      dimension: newSplit.dimension,
      method: 'Users who opened the app for the first time, added up over the range (exact).',
      factors: newSplit.factors,
      reconcile: `${newSplit.factors.map((f) => f.value).join(' + ')} = ${int(s.newUsers)} new users`,
    }),
    card('ga-sessions', 'Sessions', int(s.sessions), s.sessions, ps?.sessions, `${pct(share(s.engagedSessions, s.sessions))} engaged`, 'pulse', {
      kind: 'sum',
      dimension: 'Session type',
      method: 'Daily sessions added up. A session that runs past midnight counts on both days, so this can be ~3% above GA’s own range total.',
      factors: [
        { label: 'Engaged sessions', value: int(s.engagedSessions), share: share(s.engagedSessions, s.sessions), detail: `${pct(share(s.engagedSessions, s.sessions))} of sessions` },
        { label: 'Not engaged', value: int(notEngaged), share: share(notEngaged, s.sessions), detail: `${pct(share(notEngaged, s.sessions))} of sessions` },
      ],
      reconcile: `${int(s.engagedSessions)} engaged + ${int(notEngaged)} not engaged = ${int(s.sessions)} sessions`,
    }),
    card('ga-purchases', 'Purchases', int(s.purchases), s.purchases, ps?.purchases, 'Completed in-app purchases', 'wallet', {
      kind: 'sum',
      dimension: buySplit.dimension,
      method: 'Completed in-app purchases, added up over the range (exact). Shown instead of paying users, which can’t be added across days.',
      factors: buySplit.factors,
      reconcile: `${buySplit.factors.map((f) => f.value).join(' + ')} = ${int(s.purchases)} purchases`,
    }),
    card('ga-revenue', 'Revenue', money(s.revenue), s.revenue, ps?.revenue, `From ${int(s.purchases)} purchases`, 'coins', {
      kind: 'sum',
      dimension: revSplit.dimension,
      method: 'In-app purchase revenue in the property’s currency, added up over the range (exact).',
      factors: revSplit.factors,
      reconcile: `${revSplit.factors.map((f) => f.value).join(' + ')} = ${money(s.revenue)}`,
      context: [{ label: 'Avg. revenue per purchase', value: s.purchases ? money(s.revenue / s.purchases) : '—' }],
    }),
    card('ga-engagement', 'Engagement per daily user', duration(engPerDau), engPerDau, prevEngPerDau, 'Average time in the app per user per day', 'clock', {
      kind: 'ratio',
      dimension: 'Calculation input',
      method: 'Total time in the app divided by daily active users added up (time per user, per day).',
      factors: [
        { label: 'Total engagement time', value: `${int(s.engagement / 3600)} hrs` },
        { label: 'Daily active users, added up', value: int(s.dau) },
      ],
      reconcile: `${int(s.engagement / 3600)} hrs ÷ ${int(s.dau)} user-days = ${duration(engPerDau)} per user per day`,
    }),
  ];
}

// ── Reports ─────────────────────────────────────────────────────────────
export function buildGaReports(ga: GaSnapshot, sel: GaSelection): ReportSection[] {
  const r = resolveGa(ga, sel);
  const rows = r.rows.length > 1 ? r.rows : rowsBetween(ga, addDays(r.to, -6) < ga.dataStart ? ga.dataStart : addDays(r.to, -6), r.to);
  const labels = rows.map((x) => shortDate(x[0]));
  const span = r.rows.length > 1 ? r.label : 'Last 7 days, for context';
  const s = sumRows(r.rows);
  const active = r.exact ? r.cur!.activeUsers : s.dau;
  const newUsers = r.exact ? r.cur!.newUsers : s.newUsers;
  const returning = Math.max(0, active - newUsers);

  return [
    {
      id: 'ga-users-trend',
      title: 'Active users by day',
      subtitle: span,
      legend: [
        { label: 'Active users', color: ACCENT_HEX.teal },
        { label: 'New users', color: ACCENT_HEX.gold },
      ],
      body: (
        <TrendChart
          ariaLabel="Daily active and new users"
          labels={labels}
          format={(n) => int(n)}
          series={[
            { key: 'ga-active', label: 'Active users', values: rows.map((x) => x[1]), color: ACCENT_HEX.teal, area: true },
            { key: 'ga-new', label: 'New users', values: rows.map((x) => x[2]), color: ACCENT_HEX.gold },
          ]}
        />
      ),
    },
    {
      id: 'ga-revenue-trend',
      title: 'Revenue by day',
      subtitle: `${span} · purchases are occasional, so the line is spiky`,
      legend: [{ label: 'Revenue', color: ACCENT_HEX.orange }],
      body: (
        <TrendChart
          ariaLabel="Daily in-app revenue"
          labels={labels}
          format={(n) => money(n)}
          series={[{ key: 'ga-rev', label: 'Revenue', values: rows.map((x) => x[9]), color: ACCENT_HEX.orange, area: true }]}
        />
      ),
    },
    {
      id: 'ga-user-mix',
      title: 'New vs. returning users',
      subtitle: r.exact ? 'Share of active users' : 'Share of daily active users (user-days)',
      legend: [
        { label: 'New', color: ACCENT_HEX.gold },
        { label: 'Returning', color: ACCENT_HEX.teal },
      ],
      body: (
        <Donut
          centerLabel={r.exact ? 'Active users' : 'User-days'}
          centerValue={int(active)}
          slices={[
            { label: 'New users', value: Math.round(share(newUsers, active)), color: ACCENT_HEX.gold },
            { label: 'Returning users', value: Math.round(share(returning, active)), color: ACCENT_HEX.teal },
          ]}
        />
      ),
    },
  ];
}

// ── Range picker ────────────────────────────────────────────────────────
type QuickRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

const QUICK_LABELS: Record<QuickRange, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  custom: 'Custom range',
};

/** "This month" / "last month" relative to the newest day in the snapshot. */
function relativeMonths(ga: GaSnapshot) {
  const { max } = gaBounds(ga);
  const i = ga.months.findIndex((m) => m.month === max.slice(0, 7));
  return { thisMonth: ga.months[i]?.month, lastMonth: ga.months[i - 1]?.month };
}

function quickFor(ga: GaSnapshot, sel: GaSelection): QuickRange {
  if (sel.kind === 'preset') return ({ daily: 'yesterday', weekly: 'last7', monthly: 'last30' } as const)[sel.period];
  if (sel.kind === 'month') {
    const { thisMonth, lastMonth } = relativeMonths(ga);
    if (sel.month === thisMonth) return 'thisMonth';
    if (sel.month === lastMonth) return 'lastMonth';
  }
  return 'custom';
}

/**
 * Date range dropdown (Yesterday, Last 7/30 days, This/Last month, Custom range)
 * plus the From/To filter. Any full calendar month entered as a custom range uses
 * GA's exact monthly totals.
 */
export function GaRangePicker({
  ga,
  value,
  onChange,
}: {
  ga: GaSnapshot;
  value: GaSelection;
  onChange: (sel: GaSelection) => void;
}) {
  const { min, max } = gaBounds(ga);
  const r = resolveGa(ga, value);
  const [custom] = useState({ from: r.from, to: r.to });
  const [quick, setQuick] = useState<QuickRange>(() => quickFor(ga, value));
  const { thisMonth, lastMonth } = relativeMonths(ga);
  // Today isn't in the snapshot (it ends yesterday), so it can't be chosen.
  const available: Record<QuickRange, boolean> = {
    today: false,
    yesterday: true,
    last7: true,
    last30: true,
    thisMonth: Boolean(thisMonth),
    lastMonth: Boolean(lastMonth),
    custom: true,
  };

  const pick = (q: QuickRange) => {
    setQuick(q);
    if (q === 'yesterday') onChange({ kind: 'preset', period: 'daily' });
    else if (q === 'last7') onChange({ kind: 'preset', period: 'weekly' });
    else if (q === 'last30') onChange({ kind: 'preset', period: 'monthly' });
    else if (q === 'thisMonth' && thisMonth) onChange({ kind: 'month', month: thisMonth });
    else if (q === 'lastMonth' && lastMonth) onChange({ kind: 'month', month: lastMonth });
    // "Custom range" just keeps the picker open on the date filter below.
  };

  return (
    <div>
      <Label htmlFor="ga-quick" className="text-[11px] font-bold uppercase tracking-wider text-subtle">
        Date range
      </Label>
      <Select value={quick} onValueChange={(v) => pick(v as QuickRange)}>
        <SelectTrigger id="ga-quick" className="mt-1.5 h-9 rounded-[11px] border-border-strong bg-soft text-[13px] font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-[11px] border-border-strong bg-popover">
          {(Object.keys(QUICK_LABELS) as QuickRange[]).map((q) => (
            <SelectItem key={q} value={q} disabled={!available[q]} className="focus:bg-accent">
              {QUICK_LABELS[q]}
              {q === 'today' && ' · not in snapshot'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-1.5 text-[11.5px] text-subtle">Data available {formatDateRange(min, max)}.</p>

      <div className="mt-4 border-t border-border pt-3">
        <DateRangeForm
          idPrefix="ga"
          initial={custom}
          min={min}
          max={max}
          submitClassName="bz-btn-primary mt-3 w-full hover:opacity-90"
          onApply={({ from, to }) => {
            const month = ga.months.find((m) => m.from === from && m.to === to);
            onChange(month ? { kind: 'month', month: month.month } : { kind: 'custom', from, to });
          }}
        />
      </div>
    </div>
  );
}

export const gaRangeLabel = (ga: GaSnapshot, sel: GaSelection) => resolveGa(ga, sel).label;
export const gaComparison = (ga: GaSnapshot, sel: GaSelection) => resolveGa(ga, sel).comparison;
export const gaIsExact = (ga: GaSnapshot, sel: GaSelection) => resolveGa(ga, sel).exact;
