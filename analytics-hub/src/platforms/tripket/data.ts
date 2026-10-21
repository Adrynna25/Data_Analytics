/**
 * Tripket sample data. All figures are illustrative; replace `loadTripketData`
 * with a real API call that returns the same `TripketData` shape.
 */
import type { IconName } from '@/shared/Icon';
import type { Direction, KpiBreakdown, KpiData } from '@/components/kpi/types';
import { sessionStore } from '@/app/session';

export type TripketView = 'overview' | 'marketing' | 'operators';
export type Period = 'daily' | 'weekly' | 'monthly';
export type Tone = 'good' | 'warn';

/** A Tripket KPI uses the shared card/breakdown shape. */
export type Kpi = KpiData;
export type { Direction };

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
  /** Every KPI this workspace knows about (cards and reports). */
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

/**
 * How each KPI's headline is built. Every breakdown reconciles: its factors add up
 * (or average, or divide) to exactly the number on the card.
 */
const BREAKDOWNS: Record<string, KpiBreakdown> = {
  // ── Analytics Overview ──────────────────────────────────────────────
  'Booking transaction failure': {
    method: 'Share of the 218,500 booking attempts this month that failed, added up by cause.',
    factors: [
      { label: 'Payment timeouts', value: '1.2%', detail: '2,622 failed bookings · 44% of failures', share: 44.4 },
      { label: 'Seat selection conflicts', value: '0.8%', detail: '1,748 failed bookings · 30% of failures', share: 29.6 },
      { label: 'Search errors', value: '0.4%', detail: '874 failed bookings · 15% of failures', share: 14.8 },
      { label: 'Ticket issuance errors', value: '0.3%', detail: '656 failed bookings · 11% of failures', share: 11.1 },
    ],
    reconcile: '1.2% + 0.8% + 0.4% + 0.3% = 2.7% (5,900 failed of 218,500 attempts)',
  },
  'Payment gateway success': {
    method: 'Each gateway’s success rate, weighted by its share of payment transactions.',
    factors: [
      { label: 'GCash', value: '98.2%', detail: '41% of transactions → 40.26 pts', share: 41 },
      { label: 'Maya', value: '97.1%', detail: '26% of transactions → 25.25 pts', share: 26 },
      { label: 'Credit / debit cards', value: '94.8%', detail: '21% of transactions → 19.91 pts', share: 21 },
      { label: 'Over-the-counter', value: '91.6%', detail: '12% of transactions → 10.99 pts', share: 12 },
    ],
    reconcile: '40.26 + 25.25 + 19.91 + 10.99 = 96.41 → 96.4% of payments succeed',
    takeaway: 'GCash carries the most payments (41%) and has the best success rate (98.2%).',
  },
  'Cart abandonment': {
    method: 'Share of started checkouts that were abandoned, added up by the step where shoppers left.',
    factors: [
      { label: 'At trip selection', value: '8.4%', detail: '39% of abandonments', share: 39.4 },
      { label: 'At passenger details', value: '6.9%', detail: '32% of abandonments', share: 32.4 },
      { label: 'At payment method', value: '4.7%', detail: '22% of abandonments', share: 22.1 },
      { label: 'At payment confirmation', value: '1.3%', detail: '6% of abandonments', share: 6.1 },
    ],
    reconcile: '8.4% + 6.9% + 4.7% + 1.3% = 21.3% of checkouts abandoned',
  },
  'App performance / crash rate': {
    method: 'Each platform’s crash rate, weighted by its share of app sessions.',
    factors: [
      { label: 'Android', value: '0.51%', detail: '65% of sessions → 0.332 pts', share: 65 },
      { label: 'iOS', value: '0.31%', detail: '22% of sessions → 0.068 pts', share: 22 },
      { label: 'Mobile web', value: '0.22%', detail: '9% of sessions → 0.020 pts', share: 9 },
      { label: 'Desktop web', value: '0.08%', detail: '4% of sessions → 0.003 pts', share: 4 },
    ],
    reconcile: '0.332 + 0.068 + 0.020 + 0.003 = 0.423 → 0.42% of sessions crash',
    takeaway: 'Android drives most crashes: it has the highest rate (0.51%) and 65% of sessions.',
  },
  'Server downtime metrics': {
    method: 'Customer-facing downtime in the last 30 days (43,200 minutes), added up by cause.',
    factors: [
      { label: 'Payment provider outage', value: '5 min', detail: '1 incident · 38% of downtime', share: 38.5 },
      { label: 'Planned maintenance overrun', value: '4 min', detail: '1 incident · 31% of downtime', share: 30.8 },
      { label: 'Database failover', value: '3 min', detail: '1 incident · 23% of downtime', share: 23.1 },
      { label: 'CDN / network', value: '1 min', detail: '1 incident · 8% of downtime', share: 7.7 },
    ],
    reconcile: '5 + 4 + 3 + 1 = 13 min down of 43,200 → 99.97% uptime',
  },
  'Payment gateway & refund report': {
    method: 'Money refunded to passengers this month, added up by the gateway it was paid back through.',
    factors: [
      { label: 'GCash refunds', value: '₱512K', detail: '41% of refunds', share: 41.3 },
      { label: 'Card refunds', value: '₱386K', detail: '31% of refunds', share: 31.1 },
      { label: 'Maya refunds', value: '₱244K', detail: '20% of refunds', share: 19.7 },
      { label: 'Over-the-counter refunds', value: '₱98K', detail: '8% of refunds', share: 7.9 },
    ],
    reconcile: '₱512K + ₱386K + ₱244K + ₱98K = ₱1.24M refunded',
  },
  'Route & schedule popularity': {
    method: 'Passengers on the most-booked route (Cebu → Tagbilaran), added up by departure time.',
    factors: [
      { label: '6:00 AM departure', value: '4.2K', detail: '33% of the route’s passengers', share: 32.8 },
      { label: '9:30 AM departure', value: '3.5K', detail: '27% of the route’s passengers', share: 27.3 },
      { label: '1:00 PM departure', value: '2.9K', detail: '23% of the route’s passengers', share: 22.7 },
      { label: '5:30 PM departure', value: '2.2K', detail: '17% of the route’s passengers', share: 17.2 },
    ],
    reconcile: '4.2K + 3.5K + 2.9K + 2.2K = 12.8K passengers on Cebu → Tagbilaran',
  },
  'Monthly recurring revenue': {
    method: 'Recurring subscription revenue from operators, added up by operator tier.',
    factors: [
      { label: 'Enterprise ferry lines', value: '₱1.42M', detail: '50% of MRR', share: 50.0 },
      { label: 'Mid-size operators', value: '₱0.88M', detail: '31% of MRR', share: 31.0 },
      { label: 'Small boat operators', value: '₱0.36M', detail: '13% of MRR', share: 12.7 },
      { label: 'Add-on modules', value: '₱0.18M', detail: '6% of MRR', share: 6.3 },
    ],
    reconcile: '₱1.42M + ₱0.88M + ₱0.36M + ₱0.18M = ₱2.84M a month (× 12 = ₱34.1M ARR)',
  },
  'Gross booking value': {
    method: 'Total value of bookings made through Tripket, added up by operator type.',
    factors: [
      { label: 'Large ferry lines', value: '₱38.2M', detail: '56% of booking value', share: 55.8 },
      { label: 'Fast craft operators', value: '₱18.6M', detail: '27% of booking value', share: 27.2 },
      { label: 'Small boat operators', value: '₱7.4M', detail: '11% of booking value', share: 10.8 },
      { label: 'Vehicle & cargo add-ons', value: '₱4.2M', detail: '6% of booking value', share: 6.1 },
    ],
    reconcile: '₱38.2M + ₱18.6M + ₱7.4M + ₱4.2M = ₱68.4M',
  },
  'Monthly active bookers': {
    method: 'Unique passengers who paid for at least one booking this month, by type of booker.',
    factors: [
      { label: 'Repeat passengers', value: '25.6K', detail: '53% of bookers', share: 53.1 },
      { label: 'New passengers', value: '14.8K', detail: '31% of bookers', share: 30.7 },
      { label: 'Returning after 90+ days', value: '5.1K', detail: '11% of bookers', share: 10.6 },
      { label: 'Business accounts', value: '2.7K', detail: '6% of bookers', share: 5.6 },
    ],
    reconcile: '25.6K + 14.8K + 5.1K + 2.7K = 48.2K active bookers',
  },
  'Booking conversion': {
    method: 'Each step of the booking funnel keeps a share of shoppers; multiplying the steps gives search-to-booking conversion.',
    factors: [
      { label: 'Search → trip selection', value: '82.0%', detail: 'Loses 18.0% of shoppers', share: 82.0 },
      { label: 'Trip selection → passenger details', value: '86.6%', detail: 'Loses 13.4%', share: 86.6 },
      { label: 'Passenger details → payment', value: '90.1%', detail: 'Loses 9.9%', share: 90.1 },
      { label: 'Payment → confirmed booking', value: '98.1%', detail: 'Loses 1.9%', share: 98.1 },
    ],
    reconcile: '82.0% × 86.6% × 90.1% × 98.1% = 62.8% of searches become bookings',
    takeaway: 'The first step loses the most shoppers (18% leave after searching).',
  },

  // ── Marketing & Customer ────────────────────────────────────────────
  Sales: {
    method: 'Gross ticket sales across all routes, added up by what was sold.',
    factors: [
      { label: 'Passenger fares', value: '₱51.6M', detail: '75% of sales', share: 75.4 },
      { label: 'Vehicle & cargo fares', value: '₱9.8M', detail: '14% of sales', share: 14.3 },
      { label: 'Add-ons (baggage, insurance)', value: '₱4.6M', detail: '7% of sales', share: 6.7 },
      { label: 'Rebooking & change fees', value: '₱2.4M', detail: '4% of sales', share: 3.5 },
    ],
    reconcile: '₱51.6M + ₱9.8M + ₱4.6M + ₱2.4M = ₱68.4M in sales',
  },
  'Service charge': {
    method: 'Platform fees Tripket collected, added up by booking channel. Fees are 4.2% of sales.',
    factors: [
      { label: 'Mobile app bookings', value: '₱1.52M', detail: '53% of fees', share: 53.0 },
      { label: 'Web bookings', value: '₱0.83M', detail: '29% of fees', share: 28.9 },
      { label: 'Partner agents', value: '₱0.38M', detail: '13% of fees', share: 13.2 },
      { label: 'Over-the-counter', value: '₱0.14M', detail: '5% of fees', share: 4.9 },
    ],
    reconcile: '₱1.52M + ₱0.83M + ₱0.38M + ₱0.14M = ₱2.87M (4.2% × ₱68.4M sales)',
  },
  Passengers: {
    method: 'Tickets issued to travelers this month, added up by fare type.',
    factors: [
      { label: 'Adults', value: '312.4K', detail: '64% of passengers', share: 64.2 },
      { label: 'Students', value: '84.1K', detail: '17% of passengers', share: 17.3 },
      { label: 'Seniors & PWD', value: '52.6K', detail: '11% of passengers', share: 10.8 },
      { label: 'Children', value: '37.2K', detail: '8% of passengers', share: 7.6 },
    ],
    reconcile: '312.4K + 84.1K + 52.6K + 37.2K = 486.3K passengers',
  },
  'Customer acquisition cost (CAC)': {
    method: 'Total acquisition spend divided by new paying users. Each channel shows its own cost per user and how many users it brought.',
    factors: [
      { label: 'Social media ads', value: '₱216', detail: '5,684 users · ₱1.23M spend', share: 58 },
      { label: 'Direct / app stores', value: '₱171', detail: '1,764 users · ₱302K spend', share: 18 },
      { label: 'Referral partners', value: '₱148', detail: '1,274 users · ₱189K spend', share: 13 },
      { label: 'Organic search', value: '₱82', detail: '1,078 users · ₱88K spend', share: 11 },
    ],
    reconcile: '₱1.81M total spend ÷ 9,800 new paying users = ₱184 per user',
    takeaway: 'Social ads bring 58% of new paying users but cost the most per user (₱216).',
  },
  'Vessels or partners': {
    method: 'Active vessels listed on Tripket by 58 partner operators, added up by vessel type.',
    factors: [
      { label: 'RoRo vessels', value: '118', detail: '36% of the fleet', share: 36.2 },
      { label: 'Fast craft', value: '92', detail: '28% of the fleet', share: 28.2 },
      { label: 'Conventional ferries', value: '71', detail: '22% of the fleet', share: 21.8 },
      { label: 'Small boats / bangka', value: '45', detail: '14% of the fleet', share: 13.8 },
    ],
    reconcile: '118 + 92 + 71 + 45 = 326 active vessels',
  },
  'Customer lifetime value': {
    method: 'Lifetime value of each passenger segment, weighted by its share of passengers.',
    factors: [
      { label: 'Leisure travelers', value: '₱4,180', detail: '47% of passengers → ₱1,965', share: 47 },
      { label: 'Daily commuters', value: '₱7,240', detail: '22% of passengers → ₱1,593', share: 22 },
      { label: 'Students', value: '₱2,820', detail: '24% of passengers → ₱677', share: 24 },
      { label: 'Vehicle & cargo', value: '₱8,920', detail: '7% of passengers → ₱624', share: 7 },
    ],
    reconcile: '₱1,965 + ₱1,593 + ₱677 + ₱624 = ₱4,859 ≈ ₱4,860 per passenger',
    takeaway: 'Leisure travelers contribute the most value (₱1,965 of ₱4,860) because they are the largest group.',
  },
  'Top acquisition channel': {
    method: 'Share of confirmed bookings by the channel that first brought the passenger. The largest share is the top channel.',
    factors: [
      { label: 'Organic search', value: '36.8%', share: 36.8 },
      { label: 'Social media ads', value: '28.4%', share: 28.4 },
      { label: 'Referral links', value: '19.6%', share: 19.6 },
      { label: 'Direct / app stores', value: '15.2%', share: 15.2 },
    ],
    reconcile: '36.8% + 28.4% + 19.6% + 15.2% = 100% of bookings · Organic leads',
  },
  'Highest-demand route': {
    method: 'Passengers on the four busiest routes this month. The route with the most passengers is the highest-demand route.',
    factors: [
      { label: 'Cebu → Tagbilaran', value: '12.8K', detail: '34% of top-4 route passengers', share: 33.6 },
      { label: 'Batangas → Calapan', value: '10.4K', detail: '27%', share: 27.3 },
      { label: 'Cebu → Ormoc', value: '8.7K', detail: '23%', share: 22.8 },
      { label: 'Manila → Coron', value: '6.2K', detail: '16%', share: 16.3 },
    ],
    reconcile: '12.8K + 10.4K + 8.7K + 6.2K = 38.1K passengers · Cebu → Tagbilaran leads',
  },
  'Promo redemption rate': {
    method: 'Promo codes redeemed divided by codes issued (12,500 per campaign), added up across campaigns.',
    factors: [
      { label: 'Summer Sail', value: '34.2%', detail: '4,275 of 12,500 codes redeemed', share: 29.9 },
      { label: 'Student Saver', value: '29.8%', detail: '3,725 of 12,500 codes', share: 26.0 },
      { label: 'Partner Rewards', value: '26.1%', detail: '3,263 of 12,500 codes', share: 22.8 },
      { label: 'First Trip', value: '24.3%', detail: '3,038 of 12,500 codes', share: 21.2 },
    ],
    reconcile: '(4,275 + 3,725 + 3,263 + 3,038) ÷ 50,000 codes = 14,301 ÷ 50,000 = 28.6%',
    takeaway: 'Summer Sail performs best (34.2% of its codes redeemed).',
  },

  // ── Operators & Support ─────────────────────────────────────────────
  'Take rate': {
    method: 'Platform fees earned from each operator type, divided by total booking value.',
    factors: [
      { label: 'Large ferry lines', value: '3.8%', detail: '₱1.45M fees on ₱38.2M bookings', share: 50.4 },
      { label: 'Fast craft operators', value: '4.6%', detail: '₱0.86M fees on ₱18.6M', share: 29.8 },
      { label: 'Small boat operators', value: '5.2%', detail: '₱0.38M fees on ₱7.4M', share: 13.4 },
      { label: 'Vehicle & cargo', value: '4.4%', detail: '₱0.18M fees on ₱4.2M', share: 6.4 },
    ],
    reconcile: '(₱1.45M + ₱0.86M + ₱0.38M + ₱0.18M) ÷ ₱68.4M = ₱2.88M ÷ ₱68.4M = 4.2%',
    takeaway: 'Large ferry lines pay the lowest rate (3.8%) but bring half of all fees.',
  },
  'Capacity utilization': {
    method: 'Each vessel type’s load factor, weighted by its share of seats offered.',
    factors: [
      { label: 'RoRo vessels', value: '84.2%', detail: '40% of seats → 33.68 pts', share: 40 },
      { label: 'Fast craft', value: '81.7%', detail: '25% of seats → 20.43 pts', share: 25 },
      { label: 'Conventional ferries', value: '72.5%', detail: '22% of seats → 15.95 pts', share: 22 },
      { label: 'Small boats / bangka', value: '63.9%', detail: '13% of seats → 8.31 pts', share: 13 },
    ],
    reconcile: '33.68 + 20.43 + 15.95 + 8.31 = 78.37 → 78.4% of seats filled',
  },
  'Operator feature adoption': {
    method: 'Share of the 58 partner operators that use 3 or more core modules (booking, manifest, pricing, scheduling).',
    factors: [
      { label: 'All 4 core modules', value: '18', detail: '31.0% of operators · counted', share: 31.0 },
      { label: 'Exactly 3 modules', value: '24', detail: '41.4% of operators · counted', share: 41.4 },
      { label: '1–2 modules', value: '13', detail: '22.4% of operators · not counted', share: 22.4 },
      { label: 'Online booking only', value: '3', detail: '5.2% of operators · not counted', share: 5.2 },
    ],
    reconcile: '18 + 24 = 42 of 58 operators use 3+ modules = 72.4%',
    takeaway: 'Most operators already use 3+ modules; 16 still use two or fewer.',
  },
  'Support SLA compliance': {
    method: 'Tickets resolved within SLA divided by all tickets, across operator and passenger support.',
    factors: [
      { label: 'Operator (B2B) tickets', value: '97.1%', detail: '1,204 of 1,240 in SLA', share: 23.1 },
      { label: 'Passenger (B2C) tickets', value: '93.8%', detail: '3,865 of 4,120 in SLA', share: 76.9 },
    ],
    reconcile: '(1,204 + 3,865) ÷ (1,240 + 4,120) = 5,069 ÷ 5,360 = 94.6% in SLA',
    context: [
      { label: 'Median first response', value: '4m 12s' },
      { label: 'Median resolution time', value: '3.6 hrs' },
    ],
    takeaway: 'Passenger tickets are 77% of volume and the main thing holding the rate below 95%.',
  },
  'Weather-disrupted trips': {
    method: 'Share of the 9,450 scheduled trips cancelled or delayed by weather, added up by cause.',
    factors: [
      { label: 'Typhoon / storm signals', value: '2.1%', detail: '198 trips · 55% of disruptions', share: 55.2 },
      { label: 'Gale & small-craft advisories', value: '1.0%', detail: '95 trips · 26%', share: 26.5 },
      { label: 'Low visibility', value: '0.4%', detail: '38 trips · 11%', share: 10.6 },
      { label: 'Seasonal tide restrictions', value: '0.3%', detail: '28 trips · 8%', share: 7.8 },
    ],
    reconcile: '2.1% + 1.0% + 0.4% + 0.3% = 3.8% (359 of 9,450 trips)',
  },
};

/** Tripket colors changes by direction: up is green, down is orange. */
function kpi(label: string, value: string, change: string, direction: Direction, detail: string, icon: IconName): Kpi {
  const breakdown = BREAKDOWNS[label];
  if (!breakdown) throw new Error(`Missing breakdown for ${label}`);
  return { id: slug(label), label, value, change, direction, tone: direction === 'up' ? 'good' : 'bad', detail, icon, breakdown };
}

const OVERVIEW_KPIS: Kpi[] = [
  // Cards (tech side)
  kpi('Booking transaction failure', '2.7%', '0.8%', 'down', 'Payment, seat, and search errors', 'ticket'),
  kpi('Payment gateway success', '96.4%', '1.8%', 'up', 'GCash, Maya, cards & OTC', 'card'),
  kpi('Cart abandonment', '21.3%', '3.6%', 'down', 'Checkout exits before payment', 'cart'),
  kpi('App performance / crash rate', '0.42%', '0.11%', 'down', 'Android, iOS, and web', 'mobile'),
  kpi('Server downtime metrics', '13 min', '41.2%', 'down', 'Customer-facing downtime · 99.97% uptime (30 days)', 'server'),
  kpi('Payment gateway & refund report', '₱1.24M', '7.5%', 'down', 'Refunded across 1,842 refund & change requests', 'refresh'),
  // Cards (core business)
  kpi('Route & schedule popularity', 'CEB → TAG', '12.4%', 'up', '12.8K passengers · busiest at 6:00 AM', 'route'),
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
  kpi('Customer acquisition cost (CAC)', '₱184', '8.2%', 'down', 'Acquisition spend ÷ new paying users', 'target'),
  kpi('Vessels or partners', '326', '5.2%', 'up', 'Active vessels from 58 partner operators', 'ship'),
  // Detailed reports
  kpi('Customer lifetime value', '₱4,860', '12.4%', 'up', 'Expected revenue per passenger', 'wallet'),
  kpi('Top acquisition channel', 'Organic', '36.8%', 'up', 'Share of confirmed bookings', 'megaphone'),
  kpi('Highest-demand route', 'CEB → TAG', '18.6%', 'up', 'Cebu to Tagbilaran · 12.8K passengers', 'route'),
  kpi('Promo redemption rate', '28.6%', '6.9%', 'up', '14,301 of 50,000 codes redeemed', 'tag'),
];

const OPERATOR_KPIS: Kpi[] = [
  kpi('Take rate', '4.2%', '0.3%', 'up', 'Platform fee share of bookings', 'percent'),
  kpi('Capacity utilization', '78.4%', '5.1%', 'up', 'Average load factor across fleets', 'ship'),
  kpi('Operator feature adoption', '72.4%', '8.2%', 'up', '42 of 58 operators use 3+ core modules', 'layers'),
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
