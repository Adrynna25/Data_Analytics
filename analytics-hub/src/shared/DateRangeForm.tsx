import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface DateRange {
  from: string;
  to: string;
}

/** From/To date-range form used in each dashboard's date popover (styled by the active theme). */
export function DateRangeForm({
  initial,
  onApply,
  idPrefix,
  submitClassName,
}: {
  initial: DateRange;
  onApply: (r: DateRange) => void;
  idPrefix: string;
  submitClassName?: string;
}) {
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const valid = Boolean(from && to && from <= to);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onApply({ from, to });
      }}
    >
      <h2 className="font-display text-sm font-extrabold">Filter date range</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-from`}>From</Label>
          <Input id={`${idPrefix}-from`} type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-to`}>To</Label>
          <Input id={`${idPrefix}-to`} type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <p className="mt-2.5 text-[11.5px] text-subtle" aria-live="polite">
        {valid ? 'Sets the reporting range for this report' : '“From” must be on or before “To”.'}
      </p>
      <Button type="submit" disabled={!valid} className={submitClassName ?? 'mt-3 w-full'}>
        Apply
      </Button>
    </form>
  );
}
