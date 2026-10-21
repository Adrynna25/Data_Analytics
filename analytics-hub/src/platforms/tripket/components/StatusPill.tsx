import { cn } from '@/lib/utils';

/** Workspace status pill (Positive / Watch / Healthy). */
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
