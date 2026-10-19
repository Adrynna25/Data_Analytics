import { useState } from 'react';
import { Bell, Calendar, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DateRange {
  from: string;
  to: string;
}

export function Header({
  title,
  rangeLabel,
  range,
  dateOpen,
  onDateOpenChange,
  onApplyRange,
  onOpenDrawer,
  onBell,
}: {
  title: string;
  rangeLabel: string;
  range: DateRange;
  dateOpen: boolean;
  onDateOpenChange: (o: boolean) => void;
  onApplyRange: (r: DateRange) => void;
  onOpenDrawer: () => void;
  onBell: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-3 border-b border-border bg-[#0d0c0bcc] px-[34px] backdrop-blur-md max-[780px]:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          onClick={onOpenDrawer}
          className="hidden text-muted-foreground max-[780px]:inline-flex"
        >
          <Menu strokeWidth={1.8} />
        </Button>
        <nav aria-label="Breadcrumb" className="min-w-0 max-[780px]:sr-only">
          <ol className="flex items-center gap-2 text-[13px]">
            <li className="text-subtle">Tripket PH</li>
            <li aria-hidden className="text-dim">›</li>
            <li aria-current="page" className="truncate font-semibold">
              {title}
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Notifications (new)" onClick={onBell} className="relative border-border text-muted-foreground">
          <Bell strokeWidth={1.8} />
          <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-[#0d0c0b]" />
        </Button>
        <Popover open={dateOpen} onOpenChange={onDateOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-label={`Date range: ${rangeLabel}. Change`} className="border-border px-3 text-[13px] font-semibold">
              <Calendar strokeWidth={1.8} className="text-brand2" />
              <span className="max-[780px]:hidden">{rangeLabel}</span>
              <ChevronDown strokeWidth={1.8} className="text-subtle max-[780px]:hidden" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-[300px] max-w-[calc(100vw-32px)] bg-[#171411]">
            {dateOpen && <DateForm initial={range} onApply={onApplyRange} />}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

function DateForm({ initial, onApply }: { initial: DateRange; onApply: (r: DateRange) => void }) {
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
          <Label htmlFor="tp-from">From</Label>
          <Input id="tp-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tp-to">To</Label>
          <Input id="tp-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <p className="mt-2.5 text-[11.5px] text-subtle" aria-live="polite">
        {valid ? 'Sets the reporting range for this report' : '“From” must be on or before “To”.'}
      </p>
      <Button type="submit" disabled={!valid} className="mt-3 w-full">
        Apply
      </Button>
    </form>
  );
}
