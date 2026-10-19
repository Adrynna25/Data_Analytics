import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Direction } from '../data';

/** Green "up" / orange "down" pill with a rotated arrow. */
export function DeltaPill({ direction, change, className }: { direction: Direction; change: string; className?: string }) {
  const up = direction === 'up';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold',
        up ? 'bg-success/10 text-success' : 'bg-primary/15 text-brand2',
        className,
      )}
    >
      <ArrowUp aria-hidden strokeWidth={2.2} className={cn('h-3 w-3', up ? 'rotate-45' : 'rotate-[135deg]')} />
      <span className="sr-only">{up ? 'Up' : 'Down'} </span>
      {change}
    </span>
  );
}

export function StatusPill({ tone, children }: { tone: 'good' | 'warn'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
        tone === 'good' ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning',
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', tone === 'good' ? 'bg-success' : 'bg-warning')} />
      {children}
    </span>
  );
}
