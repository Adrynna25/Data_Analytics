import type { IconName } from '@/shared/Icon';

/** One input to a KPI: a part of a total, a weighted rate, or a ratio term. */
export interface Factor {
  label: string;
  value: string;
  /** Extra numbers that show how this factor feeds the KPI (weight, count, contribution). */
  detail?: string;
  /** Size of the factor as a % of the whole, drawn as a bar. Omit for ratio terms. */
  share?: number;
}

/**
 * How the parts make the headline:
 * sum — parts add up; weighted — weighted average of rates; ratio — one number divided by another;
 * product — funnel steps multiplied; share — parts are shares of a whole and the headline is the largest.
 */
export type BreakdownKind = 'sum' | 'weighted' | 'ratio' | 'product' | 'share';

export interface KpiBreakdown {
  kind: BreakdownKind;
  /** What the KPI is broken down by, e.g. "Platform", "Cause", "Channel". */
  dimension: string;
  /** How the headline number is built, in one sentence. */
  method: string;
  factors: Factor[];
  /** The arithmetic that turns the factors into the headline number. */
  reconcile: string;
  /** Related figures that give context but are not part of the calculation. */
  context?: { label: string; value: string }[];
  /** Overrides the auto-generated takeaway. */
  takeaway?: string;
}

export type Direction = 'up' | 'down';

/** A KPI as shown on a card and in its breakdown, shared by both platforms. */
export interface KpiData {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: Direction;
  /** Whether the change is good news (drives the pill color). */
  tone: 'good' | 'bad';
  detail: string;
  icon: IconName;
  breakdown: KpiBreakdown;
}
