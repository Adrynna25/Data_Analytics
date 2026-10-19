import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold leading-4 whitespace-nowrap',
  {
    variants: {
      variant: {
        good: 'border-success/30 bg-success/10 text-success',
        warn: 'border-warning/30 bg-warning/10 text-warning',
        bad: 'border-danger/30 bg-danger/10 text-danger',
        neutral: 'border-border bg-accent text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
