import { Bell, Calendar, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ThemeToggle } from '@/app/ThemeToggle';
import { DateRangeForm, type DateRange } from '@/shared/DateRangeForm';

export type { DateRange };

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
    <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-3 border-b border-border bg-[var(--chrome-header)] px-[34px] backdrop-blur-md max-[780px]:px-4">
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
        <ThemeToggle />
        <Button variant="outline" size="icon" aria-label="Notifications (new)" onClick={onBell} className="relative border-border text-muted-foreground">
          <Bell strokeWidth={1.8} />
          <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </Button>
        <Popover open={dateOpen} onOpenChange={onDateOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-label={`Date range: ${rangeLabel}. Change`} className="border-border px-3 text-[13px] font-semibold">
              <Calendar strokeWidth={1.8} className="text-brand2" />
              <span className="max-[780px]:hidden">{rangeLabel}</span>
              <ChevronDown strokeWidth={1.8} className="text-subtle max-[780px]:hidden" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-[300px] max-w-[calc(100vw-32px)]">
            {dateOpen && <DateRangeForm idPrefix="tp" initial={range} onApply={onApplyRange} />}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
