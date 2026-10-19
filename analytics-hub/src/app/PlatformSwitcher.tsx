import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usePlatform } from './context';
import { isPlatformId } from './session';

const tint = (color: string, pct: number, base = 'transparent') =>
  `color-mix(in srgb, ${color} ${pct}%, ${base})`;

/**
 * The business logo in each dashboard's top-left slot doubles as the platform
 * switcher. Built on shadcn's DropdownMenu (Radix): radio items give
 * role="menuitemradio" + aria-checked, `loop` wraps Arrow keys, and Escape /
 * outside click close the menu and return focus to the trigger.
 */
export function PlatformSwitcher({ logoWidth, className }: { logoWidth?: number; className?: string }) {
  const { platforms, platformId, switchTo, focusSwitcherOnMount } = usePlatform();
  const active = platforms.find((p) => p.id === platformId) ?? platforms[0];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // After a switch, focus lands on the (visible) switcher of the new dashboard.
  useEffect(() => {
    const el = triggerRef.current;
    if (focusSwitcherOnMount && el && el.offsetParent !== null) el.focus({ preventScroll: true });
  }, []);

  // Opening (by click or keyboard) puts focus on the active platform's row.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => activeItemRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const Logo = active.Logo;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        ref={triggerRef}
        aria-label={`Current platform: ${active.name}. Switch platform`}
        style={{ '--sw-accent': active.accent } as CSSProperties}
        className={cn(
          'group inline-flex max-w-full items-center gap-2 rounded-[10px] border border-transparent px-2 py-1.5 text-left outline-none transition-colors',
          'hover:border-[var(--sw-hover-border)] hover:bg-[var(--sw-hover)] data-[state=open]:border-[var(--sw-hover-border)] data-[state=open]:bg-[var(--sw-hover)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sw-accent)]',
          className,
        )}
      >
        <span className="min-w-0 shrink">
          <Logo width={logoWidth} />
        </span>
        <ChevronRight
          aria-hidden
          strokeWidth={1.8}
          className="h-4 w-4 shrink-0 rotate-90 text-[var(--sw-muted)] transition-transform duration-200 group-data-[state=open]:-rotate-90 group-data-[state=open]:text-[var(--sw-accent)]"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        loop
        onEscapeKeyDown={(e) => {
          // The menu owns this Escape: keep it away from dashboard handlers.
          // Radix then dismisses and returns focus to the trigger.
          e.stopPropagation();
        }}
        className="w-[288px] max-w-[calc(100vw-32px)] data-[state=closed]:animate-none rounded-xl border-[var(--sw-border)] bg-[var(--sw-bg)] p-1.5 text-[var(--sw-text)] shadow-[var(--sw-shadow)]"
      >
        <DropdownMenuLabel className="px-2.5 pb-2 pt-2 text-[10.5px] font-bold uppercase tracking-[1.2px] text-[var(--sw-muted)]">
          Switch platform
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={platformId}
          onValueChange={(v) => {
            if (isPlatformId(v) && v !== platformId) switchTo(v);
          }}
        >
          {platforms.map((p) => {
            const isActive = p.id === platformId;
            const Mark = p.Mark;
            return (
              <DropdownMenuRadioItem
                key={p.id}
                value={p.id}
                hideIndicator
                ref={isActive ? activeItemRef : undefined}
                style={{ '--row-accent': p.accent, '--row-active': tint(p.accent, 16) } as CSSProperties}
                className={cn(
                  'my-0.5 gap-3 rounded-[9px] px-2.5 py-2 pl-2.5 focus:bg-[var(--sw-row-focus)]',
                  isActive && 'bg-[var(--row-active)] focus:bg-[var(--row-active)]',
                )}
              >
                <span
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px]"
                  style={{
                    background: tint(p.accent, 20, 'var(--sw-tile-base)'),
                    boxShadow: `inset 0 0 0 1px ${tint(p.accent, 45)}`,
                  }}
                >
                  <Mark size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">{p.name}</span>
                  <span className="block truncate text-[11px] text-[var(--sw-muted)]">{p.subtitle}</span>
                </span>
                {isActive && <Check aria-hidden strokeWidth={2.2} className="h-4 w-4 shrink-0 text-[var(--row-accent)]" />}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        <p className="mt-1 border-t border-[var(--sw-divider)] px-2.5 pb-1.5 pt-2.5 text-[10.5px] leading-snug text-[var(--sw-footer)]">
          Each platform opens with its own session and data.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
