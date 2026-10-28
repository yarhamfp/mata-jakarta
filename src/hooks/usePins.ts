import { useCallback, useEffect, useState } from 'react';

export const MAX_WALL = 9;
const KEY = 'cctvPins';

function readStored(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

// `initial` comes from a shared ?w= link and takes priority over what is stored.
export function usePins(initial?: string[]) {
  const [pins, setPins] = useState<string[]>(() => initial ?? readStored());

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(pins)); } catch { /* storage unavailable */ }
  }, [pins]);

  const toggle = useCallback((id: string) => {
    setPins((cur) => {
      if (cur.includes(id)) return cur.filter((p) => p !== id);
      if (cur.length >= MAX_WALL) { alert(`Maksimal ${MAX_WALL} kamera di Live Wall.`); return cur; }
      return [...cur, id];
    });
  }, []);

  return { pins, toggle };
}
