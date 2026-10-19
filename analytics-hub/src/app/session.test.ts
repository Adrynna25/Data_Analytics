import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PLATFORM,
  STORAGE_KEY,
  StaleTokenError,
  createSessionStore,
  issueToken,
  type KeyValueStorage,
} from './session';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const throwingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('token rotation', () => {
  it('issues platform-prefixed random tokens', () => {
    const a = issueToken('tripket');
    const b = issueToken('tripket');
    expect(a).toMatch(/^tripket_[0-9a-f]{32}$/);
    expect(issueToken('beetzee')).toMatch(/^beetzee_/);
    expect(a).not.toBe(b);
  });

  it('puts a new token in the session before the exchange resolves', async () => {
    const store = createSessionStore({ storage: memoryStorage() });
    const first = store.switchTo('tripket');
    const tokenA = store.session!.token;
    await vi.runAllTimersAsync();
    expect(await first).toEqual({ status: 'ok', session: { platform: 'tripket', token: tokenA } });

    const second = store.switchTo('beetzee');
    const tokenB = store.session!.token;
    expect(tokenB).not.toBe(tokenA);
    expect(store.session).toEqual({ platform: 'beetzee', token: tokenB });
    expect(store.isCurrentToken(tokenA)).toBe(false);
    await vi.runAllTimersAsync();
    expect((await second).status).toBe('ok');
  });
});

describe('stale responses', () => {
  it('only the latest switch wins when switches overlap', async () => {
    const store = createSessionStore({ storage: memoryStorage() });
    const a = store.switchTo('beetzee');
    await vi.advanceTimersByTimeAsync(100);
    const b = store.switchTo('tripket');
    await vi.runAllTimersAsync();
    expect(await a).toEqual({ status: 'aborted' });
    expect((await b).status).toBe('ok');
    expect(store.session?.platform).toBe('tripket');
  });

  it('exchangeToken rejects a token that is no longer the session token', async () => {
    const store = createSessionStore({ storage: memoryStorage() });
    void store.switchTo('tripket');
    const old = store.session!.token;
    void store.switchTo('beetzee');
    const pending = store.exchangeToken(old);
    const assertion = expect(pending).rejects.toBeInstanceOf(StaleTokenError);
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('ignores a data response that arrives after the session switched', async () => {
    const store = createSessionStore({ storage: memoryStorage() });
    void store.switchTo('tripket');
    const old = store.session!.token;
    const slowLoad = store.request(old, () => new Promise((r) => setTimeout(() => r('tripket-data'), 500)));
    const assertion = expect(slowLoad).rejects.toBeInstanceOf(StaleTokenError);
    void store.switchTo('beetzee'); // rotates the token while the request is in flight
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('rejects a request made with a stale token up front', async () => {
    const store = createSessionStore({ storage: memoryStorage() });
    void store.switchTo('tripket');
    const old = store.session!.token;
    void store.switchTo('beetzee');
    const run = vi.fn(() => 'data');
    await expect(store.request(old, run)).rejects.toBeInstanceOf(StaleTokenError);
    expect(run).not.toHaveBeenCalled();
  });

  it('aborts a switch whose prepare step finishes after a newer switch started', async () => {
    const store = createSessionStore({ storage: memoryStorage() });
    const a = store.switchTo('beetzee', () => new Promise((r) => setTimeout(r, 1000)));
    await vi.advanceTimersByTimeAsync(500); // exchange done, prepare still running
    const b = store.switchTo('tripket');
    await vi.runAllTimersAsync();
    expect(await a).toEqual({ status: 'aborted' });
    expect((await b).status).toBe('ok');
  });
});

describe('persistence', () => {
  it('defaults to Tripket and restores the last-used platform', () => {
    expect(createSessionStore({ storage: memoryStorage() }).loadPlatform()).toBe(DEFAULT_PLATFORM);
    expect(DEFAULT_PLATFORM).toBe('tripket');
    expect(createSessionStore({ storage: memoryStorage({ [STORAGE_KEY]: 'beetzee' }) }).loadPlatform()).toBe('beetzee');
  });

  it('ignores unknown stored values', () => {
    expect(createSessionStore({ storage: memoryStorage({ [STORAGE_KEY]: 'nope' }) }).loadPlatform()).toBe('tripket');
  });

  it('persists pf-platform only after a successful switch', async () => {
    const storage = memoryStorage();
    const store = createSessionStore({ storage });
    const a = store.switchTo('beetzee');
    const b = store.switchTo('tripket');
    await vi.runAllTimersAsync();
    await Promise.all([a, b]);
    expect(storage.data[STORAGE_KEY]).toBe('tripket');
  });

  it('survives storage that throws', async () => {
    const store = createSessionStore({ storage: throwingStorage });
    expect(store.loadPlatform()).toBe('tripket');
    const res = store.switchTo('beetzee');
    await vi.runAllTimersAsync();
    expect((await res).status).toBe('ok');
  });
});
