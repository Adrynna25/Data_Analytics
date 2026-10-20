/**
 * Tripket sample data. All figures are illustrative; replace `loadTripketData`
 * with a real API call that returns the same `TripketData` shape.
 */
import type { IconName } from '@/shared/Icon';
import { sessionStore } from '@/app/session';

export type TripketView = 'overview' | 'marketing' | 'operators';
export type Period = 'daily' | 'weekly' | 'monthly';
export type Direction = 'up' | 'down';
export type Tone = 'good' | 'warn';

export interface BreakdownRow {
  label: string;
  value: string;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: Direction;
  detail: string;
  icon: IconName;
  breakdown: BreakdownRow[];
}

export interface Signal {
  label: string;
  value: string;
}

export interface WorkspaceSummary {
  status: 'Positive' | 'Watch' | 'Healthy';
  tone: Tone;
  line: string;
  copy: string;
  signals: Signal[];
}

export interface ViewDef {
  id: TripketView;
  nav: string;
  navIcon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  /** Every KPI this workspace knows about (cards, reports, and platform-health stats). */
  kpis: Kpi[];
  /** KPIs shown as cards at the top of the page. */
  cardIds: string[];
  /** KPIs shown as Detailed Reports accordions (with their breakdown inside). */
  reportIds?: string[];
  scopes?: string[];
  summary?: WorkspaceSummary;
}

export interface PeriodPreset {
  id: Period;
  label: string;
  unit: 'day' | 'week' | 'month';
  from: string;
  to: string;
}

export interface TripketData {
  views: Record<TripketView, ViewDef>;
  platform: WorkspaceSummary;
  bookings: { current: number[]; previous: number[]; month: string };
  periods: Record<Period, PeriodPreset>;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

type Row = [label: string, value: string];

const BREAKDOWNS: Record<string, Row[]> = {
  'Route & schedule popularity': [['Cebu → Tagbilaran · 6:00 AM', '4.2K'], ['Batangas → Calapan · 8:00 AM', '3.6K'], ['Cebu → Ormoc · 1:00 PM', '2.9K'], ['Manila → Coron · 7:00 PM', '2.1K']],
  // Downtime per service over 30 days (43,200 min), from each service's uptime.
  'Server downtime metrics': [['Operator integrations', '26 min'], ['Payment services', '17 min'], ['Passenger app & web', '9 min'], ['Booking services', '4 min']],
  'Payment gateway & refund report': [['GCash refunds', '₱512K'], ['Card refunds', '₱386K'], ['Maya refunds', '₱244K'], ['Over-the-counter refunds', '₱98K']],
  Sales: [['Passenger fares', '₱51.6M'], ['Vehicle & cargo fares', '₱9.8M'], ['Add-ons (baggage, insurance)', '₱4.6M'], ['Rebooking & change fees', '₱2.4M']],
  'Service charge': [['Mobile app bookings', '₱1.52M'], ['Web bookings', '₱0.83M'], ['Partner agents', '₱0.38M'], ['Over-the-counter', '₱0.14M']],
  Passengers: [['Adults', '312.4K'], ['Students', '84.1K'], ['Seniors & PWD', '52.6K'], ['Children', '37.2K']],
  'Vessels or partners': [['RoRo vessels', '118'], ['Fast craft', '92'], ['Conventional ferries', '71'], ['Small boats / bangka', '45']],
  'Customer acquisition cost (CAC)': [['Organic search', '₱82'], ['Social media ads', '₱216'], ['Referral partners', '₱148'], ['Direct / app stores', '₱171']],
  'Customer lifetime value': [['Daily commuters', '₱7,240'], ['Leisure travelers', '₱4,180'], ['Student passengers', '₱2,760'], ['Vehicle & cargo', '₱8,920']],
  'Monthly active bookers': [['New passengers', '14.8K'], ['Repeat passengers', '25.6K'], ['Returning after 90 days', '5.1K'], ['Business accounts', '2.7K']],
  'Booking conversion': [['Search to trip selection', '82.0%'], ['Trip to passenger details', '86.6%'], ['Details to payment', '90.1%'], ['Payment to confirmation', '98.1%']],
  'Payment gateway success': [['GCash', '98.2%'], ['Maya', '97.1%'], ['Credit / debit cards', '94.8%'], ['Over-the-counter', '91.6%']],
  'Cart abandonment': [['Trip selection', '8.4%'], ['Passenger details', '6.9%'], ['Payment method', '4.7%'], ['Payment confirmation', '1.3%']],
  'Top acquisition channel': [['Organic search', '36.8%'], ['Social media ads', '28.4%'], ['Referral links', '19.6%'], ['Direct / app stores', '15.2%']],
  'Highest-demand route': [['Cebu → Tagbilaran', '12.8K'], ['Batangas → Calapan', '10.4K'], ['Cebu → Ormoc', '8.7K'], ['Manila → Coron', '6.2K']],
  'Promo redemption rate': [['Summer Sail', '34.2%'], ['Student Saver', '29.8%'], ['Partner Rewards', '26.1%'], ['First Trip', '24.3%']],
  'Booking transaction failure': [['Payment timeouts', '1.2%'], ['Seat selection conflicts', '0.8%'], ['Search errors', '0.4%'], ['Ticket issuance', '0.3%']],
  'App performance / crash rate': [['Android', '0.51%'], ['iOS', '0.31%'], ['Mobile web', '0.22%'], ['Desktop web', '0.08%']],
  'Monthly recurring revenue': [['Enterprise ferry lines', '₱1.42M'], ['Mid-size operators', '₱0.88M'], ['Small boat operators', '₱0.36M'], ['Add-on modules', '₱0.18M']],
  'Take rate': [['Small boat operators', '5.2%'], ['Fast craft operators', '4.6%'], ['Vehicle & cargo', '4.4%'], ['Large ferry lines', '3.8%']],
  'Capacity utilization': [['RoRo vessels', '84.2%'], ['Fast craft', '81.7%'], ['Conventional ferries', '72.5%'], ['Small boats / bangka', '63.9%']],
  'Weather-disrupted trips': [['Typhoon / storm signals', '2.1%'], ['Gale & small-craft advisories', '1.0%'], ['Low visibility', '0.4%'], ['Seasonal tide restrictions', '0.3%']],
  'Operator feature adoption': [['Online booking & e-ticketing', '96.0%'], ['Dispatch & passenger manifest', '82.4%'], ['Dynamic pricing', '58.3%'], ['Fleet scheduling', '49.7%']],
  'Support SLA compliance': [['Operator (B2B) tickets in SLA', '97.1%'], ['Passenger (B2C) tickets in SLA', '93.8%'], ['Median first response', '4m 12s'], ['Median resolution time', '3.6 hrs']],
  'Gross booking value': [['Large ferry lines', '₱38.2M'], ['Fast craft operators', '₱18.6M'], ['Small boat operators', '₱7.4M'], ['Vehicle & cargo add-ons', '₱4.2M']],
};

function kpi(label: string, value: string, change: string, direction: Direction, detail: string, icon: IconName): Kpi {
  const rows = BREAKDOWNS[label] ?? [];
  return { id: slug(label), label, value, change, direction, detail, icon, breakdown: rows.map(([l, v]) => ({ label: l, value: v })) };
}

const OVERVIEW_KPIS: Kpi[] = [
  // Cards (tech side)
  kpi('Booking transaction failure', '2.7%', '0.8%', 'down', 'Payment, seat, and search errors', 'ticket'),
  kpi('Payment gateway success', '96.4%', '1.8%', 'up', 'GCash, Maya, cards & OTC', 'card'),
  kpi('Cart abandonment', '21.3%', '3.6%', 'down', 'Checkout exits before payment', 'cart'),
  kpi('App performance / crash rate', '0.42%', '0.11%', 'down', 'Android, iOS, and web', 'mobile'),
  kpi('Server downtime metrics', '13 min', '41.2%', 'down', 'Unplanned downtime · 99.97% uptime (30 days)', 'server'),
  kpi('Payment gateway & refund report', '₱1.24M', '7.5%', 'down', 'Refunded across 1,842 refund & change requests', 'refresh'),
  // Cards (core business)
  kpi('Route & schedule popularity', 'CEB → TAG', '12.4%', 'up', 'Most-booked route · 6:00 AM departure (4.2K passengers)', 'route'),
  // Detailed reports (the previous overview cards)
  kpi('Monthly recurring revenue', '₱2.84M', '6.3%', 'up', 'ARR run-rate ₱34.1M', 'trend'),
  kpi('Gross booking value', '₱68.4M', '9.8%', 'up', '212.6K transactions processed', 'coins'),
  kpi('Monthly active bookers', '48.2K', '10.7%', 'up', 'Unique paying passengers', 'users'),
  kpi('Booking conversion', '62.8%', '4.1%', 'up', 'Search to confirmed booking', 'ticket'),
];

const MARKETING_KPIS: Kpi[] = [
  // Cards
  kpi('Sales', '₱68.4M', '9.8%', 'up', 'Gross ticket sales across all routes', 'banknote'),
  kpi('Service charge', '₱2.87M', '10.6%', 'up', 'Platform fees collected (4.2% of sales)', 'coins'),
  kpi('Passengers', '486.3K', '11.2%', 'up', 'Tickets issued to travelers', 'users'),
  kpi('Customer acquisition cost (CAC)', '₱184', '8.2%', 'down', 'Blended cost per paying user', 'target'),
  kpi('Vessels or partners', '326', '5.2%', 'up', 'Active vessels from 58 partner operators', 'ship'),
  // Detailed reports
  kpi('Customer lifetime value', '₱4,860', '12.4%', 'up', 'Expected revenue per passenger', 'wallet'),
  kpi('Top acquisition channel', 'Organic', '36.8%', 'up', 'Share of confirmed bookings', 'megaphone'),
  kpi('Highest-demand route', 'CEB → TAG', '18.6%', 'up', 'Cebu to Tagbilaran', 'route'),
  kpi('Promo redemption rate', '28.6%', '6.9%', 'up', 'Active seasonal campaigns', 'tag'),
];

const OPERATOR_KPIS: Kpi[] = [
  kpi('Take rate', '4.2%', '0.3%', 'up', 'Platform fee share of bookings', 'percent'),
  kpi('Capacity utilization', '78.4%', '5.1%', 'up', 'Average load factor across fleets', 'ship'),
  kpi('Operator feature adoption', '71.5%', '8.2%', 'up', 'Operators using 3+ core modules', 'layers'),
  kpi('Support SLA compliance', '94.6%', '2.3%', 'up', 'Operator and passenger tickets', 'lifebuoy'),
  kpi('Weather-disrupted trips', '3.8%', '1.4%', 'down', 'Peaks in Jul–Oct typhoon season', 'cloud'),
];

export const TRIPKET_DATA: TripketData = {
  views: {
    overview: {
      id: 'overview',
      nav: 'Analytics Overview',
      navIcon: 'grid',
      eyebrow: 'Executive overview',
      title: 'Tripket Analytics',
      description: 'Top-line business results, platform health, and the status of each workspace.',
      kpis: OVERVIEW_KPIS,
      cardIds: OVERVIEW_KPIS.slice(0, 7).map((k) => k.id),
      reportIds: OVERVIEW_KPIS.slice(7).map((k) => k.id),
    },
    marketing: {
      id: 'marketing',
      nav: 'Marketing & Customer',
      navIcon: 'megaphone',
      eyebrow: 'Marketing & customer',
      title: 'Passenger Growth',
      description: 'How efficiently Tripket wins passengers and where demand is strongest.',
      kpis: MARKETING_KPIS,
      cardIds: MARKETING_KPIS.slice(0, 5).map((k) => k.id),
      reportIds: MARKETING_KPIS.slice(5).map((k) => k.id),
      scopes: ['All passengers & channels', 'Daily commuters', 'Leisure travelers', 'Vehicle & cargo'],
      summary: {
        status: 'Positive',
        tone: 'good',
        line: 'Acquisition is cheaper and passenger value is rising.',
        copy: 'Passenger growth is positive. Acquisition costs are falling while lifetime value climbs, and demand is concentrated on a few high-volume routes.',
        signals: [
          { label: 'Acquisition efficiency', value: 'Improving' },
          { label: 'Passenger demand', value: 'Strong' },
          { label: 'Promotion impact', value: 'Positive' },
        ],
      },
    },
    operators: {
      id: 'operators',
      nav: 'Operators & Support',
      navIcon: 'anchor',
      eyebrow: 'Operators & support',
      title: 'Operator Performance',
      description: 'Operator monetization, fleet use, and service quality at a glance.',
      kpis: OPERATOR_KPIS,
      cardIds: OPERATOR_KPIS.slice(0, 4).map((k) => k.id),
      reportIds: OPERATOR_KPIS.slice(4).map((k) => k.id),
      scopes: ['All operators & vessels', 'Large ferry lines', 'Fast craft operators', 'Small boat operators'],
      summary: {
        status: 'Watch',
        tone: 'warn',
        line: 'Fleets are fuller; typhoon season is driving refunds.',
        copy: 'Operators are using more of the platform and running fuller trips. Typhoon-season disruption is the main risk, but support is staying within SLA.',
        signals: [
          { label: 'Operator monetization', value: 'Growing' },
          { label: 'Fleet utilization', value: 'Improving' },
          { label: 'Weather disruption', value: 'Watch' },
        ],
      },
    },
  },
  platform: {
    status: 'Healthy',
    tone: 'good',
    line: 'Core services are within target, no critical incidents.',
    copy: 'The platform is stable. Booking and payment services are within target ranges, and there were no critical availability or security events.',
    signals: [],
  },
  bookings: {
    month: 'May',
    current: [3100, 3600, 4200, 3900, 4600, 5200, 4800, 5400, 6100, 5600, 5900, 6700, 7300, 6900, 6500, 7400, 8200, 7800, 8600, 9400, 8900, 9200, 10300, 9800, 10800, 11600, 11100, 12300, 12900, 12600, 13800],
    previous: [2400, 2900, 2700, 3300, 3700, 3400, 3900, 4300, 4100, 4600, 4400, 5000, 5500, 5200, 5600, 6100, 5900, 6400, 7000, 6600, 7200, 7700, 7400, 8100, 8700, 8300, 9000, 9600, 9300, 10300, 11000],
  },
  periods: {
    daily: { id: 'daily', label: 'Daily', unit: 'day', from: '2025-05-31', to: '2025-05-31' },
    weekly: { id: 'weekly', label: 'Weekly', unit: 'week', from: '2025-05-25', to: '2025-05-31' },
    monthly: { id: 'monthly', label: 'Monthly', unit: 'month', from: '2025-05-01', to: '2025-05-31' },
  },
};

export const DEFAULT_PERIOD: Period = 'monthly';
export const VIEW_ORDER: TripketView[] = ['overview', 'marketing', 'operators'];

/** Mock API: resolves with the dataset only while `token` is the live session token. */
export function loadTripketData(token: string): Promise<TripketData> {
  return sessionStore.request(token, () => new Promise<TripketData>((r) => setTimeout(() => r(TRIPKET_DATA), 120)));
}
