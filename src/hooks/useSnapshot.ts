import { useEffect, useState } from 'react';
import { loadImage } from './snapshotQueue';
import type { CamStatus } from '../types';

export function useSnapshot(base: string, active: boolean, refreshMs: number, onStatus: (s: CamStatus) => void) {
  const [src, setSrc] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [status, setStatus] = useState<CamStatus>('wait');

  useEffect(() => {
    if (!active) return;
    let cancel: (() => void) | null = null;
    let off = false;

    const run = () => {
      if (off) return;
      const job = loadImage(`${base}/preview.jpg?t=${Date.now()}`);
      cancel = job.cancel;
      job.promise
        .then((img) => { setSrc(img.src); setLoadedAt(Date.now()); setStatus('ok'); onStatus('ok'); })
        .catch(() => { off = true; setStatus('off'); onStatus('off'); });
    };

    run();
    const timer = setInterval(() => { if (!document.hidden) run(); }, refreshMs);
    return () => { clearInterval(timer); cancel?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, active, refreshMs]);

  return { src, loadedAt, status };
}
