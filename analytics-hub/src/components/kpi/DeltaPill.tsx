import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Direction } from './types';

/** Change pill: arrow shows direction, color shows whether it is good news. */
export function DeltaPill({
  direction,
  change,
  tone,
  className,
}: {
  direction: Direction;
  change: string;
  tone: 'good' | 'bad';
  className?: string;
}) {
  const up = direction === 'up';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold',
        tone === 'good' ? 'bg-success/10 text-success' : 'bg-danger/15 text-danger',
        className,
      )}
    >
      <ArrowUp aria-hidden strokeWidth={2.2} className={cn('h-3 w-3', up ? 'rotate-45' : 'rotate-[135deg]')} />
      <span className="sr-only">{up ? 'Up' : 'Down'} </span>
      {change}
    </span>
  );
}
