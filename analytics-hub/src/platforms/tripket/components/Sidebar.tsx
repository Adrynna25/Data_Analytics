import { ChevronRight } from 'lucide-react';
import { PlatformSwitcher } from '@/app/PlatformSwitcher';
import { Icon } from '@/shared/Icon';
import { cn } from '@/lib/utils';
import type { TripketView, ViewDef } from '../data';

export function SidebarContent({
  views,
  active,
  onNavigate,
}: {
  views: ViewDef[];
  active: TripketView;
  onNavigate: (v: TripketView) => void;
}) {
  return (
    <div className="flex h-full flex-col px-3.5 pb-4 pt-4">
      <div className="px-0.5 pb-5">
        <PlatformSwitcher />
      </div>

      <p className="px-2.5 pb-2 text-[10.5px] font-bold uppercase tracking-[1.2px] text-dim">Workspace</p>
      <nav aria-label="Workspace" className="flex flex-col gap-1">
        {views.map((v) => {
          const on = v.id === active;
          return (
            <button
              key={v.id}
              type="button"
              aria-current={on ? 'page' : undefined}
              onClick={() => onNavigate(v.id)}
              className={cn(
                'relative flex items-center gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors',
                on ? 'tp-nav-active text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon name={v.navIcon} size={18} className={on ? 'text-brand2' : undefined} />
              <span className="flex-1">{v.nav}</span>
              {on && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_#f97316aa]" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <div className="tp-card flex items-start gap-2.5 p-3">
          <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-success shadow-[0_0_8px_2px_#34d39988]" />
          <div>
            <p className="text-[12.5px] font-semibold">All systems operational</p>
            <p className="text-[11px] text-subtle">Updated 2 minutes ago</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-1.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#fb923c] to-[#ea580c] text-xs font-extrabold text-white">
            JM
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">Jamie Mendoza</p>
            <p className="truncate text-[11px] text-subtle">Analytics admin</p>
          </div>
          <ChevronRight aria-hidden className="h-4 w-4 text-subtle" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
