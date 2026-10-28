import { useCallback, useState } from 'react';

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch { return initial; }
  });
  const set = useCallback((v: T | ((cur: T) => T)) => {
    setValue((cur) => {
      const next = typeof v === 'function' ? (v as (c: T) => T)(cur) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, [key]);
  return [value, set] as const;
}
