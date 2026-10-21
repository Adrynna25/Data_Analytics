/**
 * Beetzee Play sample data. All figures are illustrative; replace
 * `loadBeetzeeData` with a real API call returning the same `BeetzeeData` shape.
 */
import { sessionStore } from '@/app/session';

export type BzView = 'core' | 'marketing' | 'app';
export type BzPeriod = 'daily' | 'weekly' | 'monthly';

/** A figure keeps the numeric value (for charts) and the exact display string. */
export interface Fig {
  n: number;
  label: string;
}

export interface PeriodInfo {
  id: BzPeriod;
  label: string;
  range: string;
  /** ISO dates of the preset reporting range. */
  from: string;
  to: string;
  comparison: string;
}

export interface PeriodFigures {
  budget: Fig;
  spend: Fig;
  impressions: Fig;
  clicks: Fig;
  activeUsers: Fig;
  attributedSales: Fig;
  grossSales: Fig;
  signups: Fig;
  purchases: Fig;
  paying: Fig;
  rewardCoin: Fig;
  remaining: Fig;
  watchedHrs: string;
  runtimeHrs: string;
  peak: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: 'Active' | 'Paused';
  share: number;
  roas: string;
  ctr: string;
  spend: Record<BzPeriod, Fig>;
  impressions: Record<BzPeriod, Fig>;
  clicks: Record<BzPeriod, Fig>;
}

export interface Show {
  title: string;
  meta: string;
  completion: number;
  change: number;
}

export interface Share {
  label: string;
  value: number;
  change?: number;
}

export interface Service {
  name: string;
  latency: string;
}

export interface BeetzeeData {
  periods: Record<BzPeriod, PeriodInfo>;
  figures: Record<BzPeriod, PeriodFigures>;
  fixed: {
    completion: string;
    completionTrend: number;
    cac: string;
    cacTrend: number;
    roas: string;
    budgetUtilization: string;
    cpc: string;
    cpm: string;
    storeConversion: string;
    revenuePerPayer: string;
    ctr: string;
    clickToSignup: string;
    adsPerPeso: string;
    uptime: string;
  };
  trends: {
    investment: number;
    sales: number;
    users: number;
    signups: number;
    paying: number;
    ads: number;
    budget: number;
    clicks: number;
  };
  campaigns: Campaign[];
  channelSplit: Share[];
  shows: Show[];
  platformSplit: Share[];
  wallets: Share[];
  services: Service[];
}

const f = (n: number, label: string): Fig => ({ n, label });
const per = (d: Fig, w: Fig, m: Fig): Record<BzPeriod, Fig> => ({ daily: d, weekly: w, monthly: m });

export const BEETZEE_DATA: BeetzeeData = {
  periods: {
    daily: { id: 'daily', label: 'Daily', range: 'May 31, 2025', from: '2025-05-31', to: '2025-05-31', comparison: 'vs. previous day' },
    weekly: { id: 'weekly', label: 'Weekly', range: 'May 25 – May 31, 2025', from: '2025-05-25', to: '2025-05-31', comparison: 'vs. previous week' },
    monthly: { id: 'monthly', label: 'Monthly', range: 'May 1 – May 31, 2025', from: '2025-05-01', to: '2025-05-31', comparison: 'vs. previous month' },
  },
  figures: {
    daily: {
      budget: f(21_000, '₱21.0K'),
      spend: f(16_000, '₱16.0K'),
      impressions: f(201_300, '201.3K'),
      clicks: f(7_700, '7.7K'),
      activeUsers: f(78_400, '78.4K'),
      attributedSales: f(155_500, '₱155.5K'),
      grossSales: f(49_000, '₱49.0K'),
      signups: f(3_200, '3.2K'),
      purchases: f(587, '587'),
      paying: f(559, '559'),
      rewardCoin: f(2_010, '₱2.01K'),
      remaining: f(5_000, '₱5.0K'),
      watchedHrs: '309 hrs',
      runtimeHrs: '419 hrs',
      peak: '9.2K (8 PM)',
    },
    weekly: {
      budget: f(147_000, '₱147K'),
      spend: f(112_000, '₱112K'),
      impressions: f(1_409_000, '1.41M'),
      clicks: f(54_100, '54.1K'),
      activeUsers: f(312_400, '312.4K'),
      attributedSales: f(1_088_000, '₱1.09M'),
      grossSales: f(343_200, '₱343.2K'),
      signups: f(22_300, '22.3K'),
      purchases: f(4_109, '4.1K'),
      paying: f(3_916, '3.9K'),
      rewardCoin: f(14_090, '₱14.1K'),
      remaining: f(35_000, '₱35.0K'),
      watchedHrs: '2,163 hrs',
      runtimeHrs: '2,935 hrs',
      peak: '238K (May 28, 2025)',
    },
    monthly: {
      budget: f(650_000, '₱650K'),
      spend: f(496_000, '₱496K'),
      impressions: f(6_240_000, '6.24M'),
      clicks: f(239_600, '239.6K'),
      activeUsers: f(842_600, '842.6K'),
      attributedSales: f(4_820_000, '₱4.82M'),
      grossSales: f(1_520_000, '₱1.52M'),
      signups: f(98_400, '98.4K'),
      purchases: f(18_200, '18.2K'),
      paying: f(17_343, '17.3K'),
      rewardCoin: f(62_400, '₱62.4K'),
      remaining: f(154_000, '₱154K'),
      watchedHrs: '9,568 hrs',
      runtimeHrs: '13,000 hrs',
      peak: '238K (May 28, 2025)',
    },
  },
  fixed: {
    completion: '73.6%',
    completionTrend: 4.1,
    cac: '₱28.60',
    cacTrend: -6.8,
    roas: '9.72×',
    budgetUtilization: '76.3%',
    cpc: '₱2.07',
    cpm: '₱79.49',
    storeConversion: '17.6%',
    revenuePerPayer: '₱87.86',
    ctr: '3.84%',
    clickToSignup: '41.1%',
    adsPerPeso: '100',
    uptime: '99.98%',
  },
  trends: { investment: 8.2, sales: 12.4, users: 10.7, signups: 9.8, paying: 8.6, ads: 14.3, budget: 4.0, clicks: 9.8 },
  campaigns: [
    {
      id: 'drama-rush',
      name: 'Drama Rush',
      channel: 'Meta',
      status: 'Active',
      share: 33.5,
      roas: '10.4×',
      ctr: '4.20%',
      spend: per(f(5_400, '₱5.4K'), f(37_500, '₱37.5K'), f(166_000, '₱166K')),
      impressions: per(f(70_300, '70.3K'), f(492_300, '492.3K'), f(2_180_000, '2.18M')),
      clicks: per(f(3_000, '3.0K'), f(20_700, '20.7K'), f(91_600, '91.6K')),
    },
    {
      id: 'love-stories',
      name: 'Love Stories',
      channel: 'TikTok',
      status: 'Active',
      share: 25.0,
      roas: '9.9×',
      ctr: '3.70%',
      spend: per(f(4_000, '₱4.0K'), f(28_000, '₱28.0K'), f(124_000, '₱124K')),
      impressions: per(f(50_300, '50.3K'), f(352_300, '352.3K'), f(1_560_000, '1.56M')),
      clicks: per(f(1_900, '1.9K'), f(13_000, '13.0K'), f(57_700, '57.7K')),
    },
    {
      id: 'new-user-acquisition',
      name: 'New User Acquisition',
      channel: 'Google',
      status: 'Active',
      share: 22.6,
      roas: '9.1×',
      ctr: '3.60%',
      spend: per(f(3_600, '₱3.6K'), f(25_300, '₱25.3K'), f(112_000, '₱112K')),
      impressions: per(f(46_100, '46.1K'), f(322_900, '322.9K'), f(1_430_000, '1.43M')),
      clicks: per(f(1_700, '1.7K'), f(11_600, '11.6K'), f(51_500, '51.5K')),
    },
    {
      id: 'viewer-retargeting',
      name: 'Viewer Retargeting',
      channel: 'YouTube',
      status: 'Active',
      share: 18.9,
      roas: '8.7×',
      ctr: '3.63%',
      spend: per(f(3_000, '₱3.0K'), f(21_200, '₱21.2K'), f(94_000, '₱94K')),
      impressions: per(f(34_500, '34.5K'), f(241_600, '241.6K'), f(1_070_000, '1.07M')),
      clicks: per(f(1_300, '1.3K'), f(8_800, '8.8K'), f(38_800, '38.8K')),
    },
  ],
  channelSplit: [
    { label: 'Meta', value: 34 },
    { label: 'TikTok', value: 25 },
    { label: 'Google', value: 22 },
    { label: 'YouTube', value: 19 },
  ],
  shows: [
    { title: 'The Boss’s Secret Bride', meta: 'Romance · 80 eps', completion: 81.2, change: 5.4 },
    { title: 'Love in Ten Episodes', meta: 'Romance · 10 eps', completion: 78.9, change: 3.1 },
    { title: 'Sarah’s Second Chance', meta: 'Drama · 64 eps', completion: 72.4, change: 2.2 },
    { title: 'The CEO’s Hidden Heir', meta: 'Drama · 92 eps', completion: 66.0, change: -1.8 },
  ],
  platformSplit: [
    { label: 'Android', value: 58 },
    { label: 'iOS', value: 27 },
    { label: 'Web & partners', value: 15 },
  ],
  wallets: [
    { label: 'GCash', value: 48.2, change: 3.2 },
    { label: 'Maya', value: 27.5, change: 1.8 },
    { label: 'GlobeOne', value: 14.1, change: -0.6 },
    { label: 'Palawan Pay', value: 10.2, change: 0.9 },
  ],
  services: [
    { name: 'Streaming CDN', latency: '42 ms' },
    { name: 'Payments API', latency: '118 ms' },
    { name: 'Ad delivery', latency: '64 ms' },
  ],
};

export const BZ_VIEWS: { id: BzView; nav: string; icon: 'grid' | 'megaphone' | 'pulse' }[] = [
  { id: 'core', nav: 'Core Metrics Engine', icon: 'grid' },
  { id: 'marketing', nav: 'Marketing Ads', icon: 'megaphone' },
  { id: 'app', nav: 'Application & Users', icon: 'pulse' },
];

export const isBzView = (v: string): v is BzView => v === 'core' || v === 'marketing' || v === 'app';
export const isBzPeriod = (v: string): v is BzPeriod => v === 'daily' || v === 'weekly' || v === 'monthly';

/** Mock API: resolves with the dataset only while `token` is the live session token. */
export function loadBeetzeeData(token: string): Promise<BeetzeeData> {
  return sessionStore.request(token, () => new Promise<BeetzeeData>((r) => setTimeout(() => r(BEETZEE_DATA), 120)));
}
