/**
 * Session + token handling for the platform switcher.
 *
 * Everything here is mocked but shaped like the real thing:
 *  - `issueToken`     → would come from your auth server / OAuth flow.
 *  - `exchangeToken`  → would call a token-exchange endpoint for the target platform.
 *  - `request`        → wraps any per-platform API call so a response that comes
 *                       back for a superseded token is rejected, never rendered.
 * Swap the bodies of `mockExchange` / the platform loaders for real calls; the
 * UI only depends on the function signatures.
 */

export type PlatformId = 'tripket' | 'beetzee';

export type Session = { platform: PlatformId; token: string };

export const PLATFORM_IDS: readonly PlatformId[] = ['tripket', 'beetzee'];
export const DEFAULT_PLATFORM: PlatformId = 'tripket';
export const STORAGE_KEY = 'pf-platform';
export const EXCHANGE_DELAY_MS = 380;

export function isPlatformId(v: unknown): v is PlatformId {
  return typeof v === 'string' && (PLATFORM_IDS as readonly string[]).includes(v);
}

/** Raised when a token is no longer the active session's token. Callers ignore it. */
export class StaleTokenError extends Error {
  constructor() {
    super('Session token is stale');
    this.name = 'StaleTokenError';
  }
}

export function isStale(e: unknown): e is StaleTokenError {
  return e instanceof StaleTokenError;
}

/** `${platformId}_${random}` using crypto.getRandomValues (128 bits, hex). */
export function issueToken(platform: PlatformId): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${platform}_${hex}`;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Storage-like subset so tests can pass a fake or a throwing implementation. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export interface SessionStoreOptions {
  storage?: KeyValueStorage | null;
  exchangeDelayMs?: number;
}

export type SwitchResult = { status: 'ok'; session: Session } | { status: 'aborted' };

export function createSessionStore(opts: SessionStoreOptions = {}) {
  const storage = opts.storage === undefined ? defaultStorage() : opts.storage;
  const exchangeDelay = opts.exchangeDelayMs ?? EXCHANGE_DELAY_MS;

  let session: Session | null = null;
  let switchSeq = 0;

  const isCurrentToken = (token: string) => session?.token === token;

  /** Mock token exchange (~380 ms). Resolves only if `token` is still the session token. */
  async function exchangeToken(token: string): Promise<void> {
    await wait(exchangeDelay);
    if (!isCurrentToken(token)) throw new StaleTokenError();
  }

  /**
   * Run a data request on behalf of `token`. Rejects up front if the token is
   * already stale, and rejects the response if the session moved on meanwhile.
   */
  async function request<T>(token: string, run: () => T | Promise<T>): Promise<T> {
    if (!isCurrentToken(token)) throw new StaleTokenError();
    const result = await run();
    if (!isCurrentToken(token)) throw new StaleTokenError();
    return result;
  }

  function loadPlatform(): PlatformId {
    try {
      const v = storage?.getItem(STORAGE_KEY);
      return isPlatformId(v) ? v : DEFAULT_PLATFORM;
    } catch {
      return DEFAULT_PLATFORM;
    }
  }

  function persistPlatform(id: PlatformId) {
    try {
      storage?.setItem(STORAGE_KEY, id);
    } catch {
      /* storage blocked: the switch still works for this page view */
    }
  }

  /**
   * Steps 2, 4, 6 and 8 of the switching flow. The caller (PlatformShell) is
   * responsible for unmounting the old dashboard before awaiting this, showing
   * the loading screen, and mounting the new dashboard on `ok`.
   * `prepare` runs after the exchange (e.g. the platform's initial data load)
   * and is subject to the same "latest switch wins" rule.
   */
  async function switchTo(
    platform: PlatformId,
    prepare?: (session: Session) => Promise<void>,
  ): Promise<SwitchResult> {
    const seq = ++switchSeq;
    const next: Session = { platform, token: issueToken(platform) };
    session = next; // new token is live before any request goes out

    try {
      await exchangeToken(next.token);
      if (seq !== switchSeq) return { status: 'aborted' };
      if (prepare) await prepare(next);
      if (seq !== switchSeq) return { status: 'aborted' };
    } catch (e) {
      if (isStale(e) || seq !== switchSeq) return { status: 'aborted' };
      throw e;
    }

    persistPlatform(platform);
    return { status: 'ok', session: next };
  }

  return {
    get session() {
      return session;
    },
    get switchSeq() {
      return switchSeq;
    },
    isCurrentToken,
    exchangeToken,
    request,
    switchTo,
    loadPlatform,
    persistPlatform,
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;

/** App-wide store. Platform data loaders call `sessionStore.request(token, …)`. */
export const sessionStore = createSessionStore();
