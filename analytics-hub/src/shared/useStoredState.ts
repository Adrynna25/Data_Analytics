import { useCallback, useState } from 'react';

/** Safe localStorage helpers: every access is wrapped because storage can throw or be missing. */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: keep in-memory state only */
  }
}

/** useState that also persists to localStorage, validated on read. */
export function useStoredState<T extends string>(key: string, fallback: T, isValid: (v: string) => v is T) {
  const [value, setValue] = useState<T>(() => {
    const raw = readStorage(key);
    return raw !== null && isValid(raw) ? raw : fallback;
  });
  const set = useCallback(
    (next: T) => {
      setValue(next);
      writeStorage(key, next);
    },
    [key],
  );
  return [value, set] as const;
}
