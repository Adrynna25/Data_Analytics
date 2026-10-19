import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BeetzeeData, BzPeriod } from '../data';

const ROW = 'grid grid-cols-[minmax(150px,1.6fr)_repeat(3,minmax(64px,1fr))] items-center gap-2';

export function CampaignPicker({
  data,
  period,
  value,
  onChange,
}: {
  data: BeetzeeData;
  period: BzPeriod;
  value: string;
  onChange: (id: string) => void;
}) {
  const fig = data.figures[period];
  const active = data.campaigns.filter((c) => c.status === 'Active').length;
  const rows = [
    { id: 'all', name: 'All campaigns', status: `${active} active`, spend: fig.spend.label, impressions: fig.impressions.label, ctr: data.fixed.ctr },
    ...data.campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      channel: c.channel,
      spend: c.spend[period].label,
      impressions: c.impressions[period].label,
      ctr: c.ctr,
    })),
  ];
  const current = rows.find((r) => r.id === value) ?? rows[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Campaigns: ${current.name}, ${current.status}. Change campaign`}
        className="group flex min-w-0 items-center gap-3 rounded-[11px] border border-border bg-[#ffffff06] px-3 py-1.5 text-left transition-colors hover:border-[#4e3a66] data-[state=open]:border-[#4e3a66]"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[1.2px] text-subtle">Campaigns</span>
          <span className="block truncate text-[13px] font-bold">
            {current.name} · <span className="font-semibold text-success">{current.status}</span>
          </span>
        </span>
        <ChevronDown aria-hidden strokeWidth={2} className="h-4 w-4 shrink-0 text-subtle transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} loop className="w-[480px] max-w-[calc(100vw-32px)] overflow-x-auto rounded-xl border-[#4e3a66] bg-[#1a1124] p-1.5">
        <div className="min-w-[400px]">
          <DropdownMenuLabel className={cn(ROW, 'px-2.5 text-[10px] font-bold uppercase tracking-[1px] text-subtle')}>
            <span>Campaign</span>
            <span className="text-right">Spend</span>
            <span className="text-right">Impressions</span>
            <span className="text-right">CTR</span>
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
            {rows.map((r) => (
              <DropdownMenuRadioItem
                key={r.id}
                value={r.id}
                hideIndicator
                className={cn(ROW, 'rounded-lg px-2.5 py-2 focus:bg-[#271439] data-[state=checked]:bg-[#2d0044]')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold">{r.name}</span>
                  <span className="block text-[11px] text-subtle">
                    {'channel' in r && r.channel ? `${r.channel} · ` : ''}
                    <span className="text-success">{r.status}</span>
                  </span>
                </span>
                <span className="text-right text-[12.5px] font-semibold">{r.spend}</span>
                <span className="text-right text-[12.5px] font-semibold">{r.impressions}</span>
                <span className="text-right text-[12.5px] font-semibold">{r.ctr}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
