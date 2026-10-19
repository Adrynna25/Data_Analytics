import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlatformContext, type PlatformContextValue } from './context';
import { PLATFORM_LIST, getPlatform } from './platforms';
import { sessionStore, type PlatformId, type Session } from './session';

type Phase =
  | { kind: 'loading'; target: PlatformId }
  | { kind: 'ready'; session: Session; data: unknown; mountId: number; focusSwitcher: boolean }
  | { kind: 'error'; target: PlatformId };

function applyPageBackground(color: string) {
  document.documentElement.style.background = color;
  document.body.style.background = color;
}

/**
 * Owns the session and decides which dashboard is mounted. Exactly one
 * dashboard exists at a time; switching unmounts it (DOM, listeners, timers)
 * before the new token is exchanged, and the next one mounts with a fresh key.
 */
export function PlatformShell() {
  const [phase, setPhase] = useState<Phase>(() => ({ kind: 'loading', target: sessionStore.loadPlatform() }));
  const mountCounter = useRef(0);
  const activeRef = useRef<PlatformId | null>(null);

  const open = useCallback(async (id: PlatformId, focusSwitcher: boolean) => {
    const def = getPlatform(id);
    activeRef.current = null;
    // Swapping to the loading phase unmounts the current dashboard entirely.
    setPhase({ kind: 'loading', target: id });
    applyPageBackground(def.bg);

    let data: unknown;
    try {
      const result = await sessionStore.switchTo(id, async (session) => {
        data = await def.load(session.token);
      });
      if (result.status === 'aborted') return; // a newer switch won

      activeRef.current = id;
      window.scrollTo(0, 0);
      setPhase({ kind: 'ready', session: result.session, data, mountId: ++mountCounter.current, focusSwitcher });
    } catch (err) {
      console.error(`Could not open ${def.name}`, err);
      setPhase({ kind: 'error', target: id });
    }
  }, []);

  // Initial mount (StrictMode's double effect just exercises the stale-switch path).
  useEffect(() => {
    void open(sessionStore.loadPlatform(), false);
  }, [open]);

  const switchTo = useCallback(
    (id: PlatformId) => {
      if (activeRef.current === id) return; // already active: the menu just closes
      void open(id, true);
    },
    [open],
  );

  const ctx = useMemo<PlatformContextValue | null>(
    () =>
      phase.kind === 'ready'
        ? {
            platformId: phase.session.platform,
            token: phase.session.token,
            platforms: PLATFORM_LIST,
            switchTo,
            focusSwitcherOnMount: phase.focusSwitcher,
          }
        : null,
    [phase, switchTo],
  );

  if (phase.kind === 'ready') {
    if (!ctx) return null;
    const { Component } = getPlatform(phase.session.platform);
    return (
      <PlatformContext.Provider value={ctx}>
        <Component key={phase.mountId} data={phase.data} />
      </PlatformContext.Provider>
    );
  }

  const target = getPlatform(phase.target);
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4 font-sans"
      style={{ background: target.bg, fontFamily: 'Inter, Montserrat, system-ui, sans-serif' }}
    >
      {phase.kind === 'loading' ? (
        <>
          <span
            aria-hidden
            className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 motion-reduce:animate-[spin_1.6s_linear_infinite]"
            style={{ borderTopColor: target.accent }}
          />
          <p role="status" aria-live="polite" className="text-sm font-semibold text-white/80">
            Opening {target.name}…
          </p>
        </>
      ) : (
        <div role="alert" className="flex flex-col items-center gap-3 text-center text-white/85">
          <p className="text-sm font-semibold">We couldn’t open {target.name}.</p>
          <button
            type="button"
            onClick={() => void open(phase.target, true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: target.accent }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
