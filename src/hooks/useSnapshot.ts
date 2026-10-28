import { useEffect, useState } from 'react';
import { report } from './health';
import { loadImage } from './snapshotQueue';
import type { CamStatus } from '../types';

export function useSnapshot(base: string, active: boolean, refreshMs: number, onStatus: (s: CamStatus) => void) {
  const [src, setSrc] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [status, setStatus] = useState<CamStatus>('wait');

  useEffect(() => {
    if (!active) return;
    let cancel: (() => void) | null = null;
    let busy = false;
    let failures = 0;
    let gotImage = false;

    const run = () => {
      // jangan menumpuk permintaan baru selagi yang sebelumnya masih menunggu server yang lambat
      if (busy) return;
      busy = true;
      const job = loadImage(`${base}/preview.jpg?t=${Date.now()}`);
      cancel = job.cancel;
      job.promise
        .then((img) => { failures = 0; gotImage = true; report(`snap:${base}`, 'ok'); setSrc(img.src); setLoadedAt(Date.now()); setStatus('ok'); onStatus('ok'); })
        .catch(() => {
          // satu kegagalan sesaat tidak langsung berarti offline selama masih ada gambar sebelumnya
          failures++;
          if (failures >= 2 || !gotImage) { report(`snap:${base}`, 'fail'); setStatus('off'); onStatus('off'); }
        })
        .finally(() => { busy = false; });
    };

    // tetap mencoba berkala setelah gagal, supaya kamera yang pulih kembali tampil tanpa refresh
    run();
    const timer = setInterval(() => { if (!document.hidden) run(); }, refreshMs);
    return () => { clearInterval(timer); cancel?.(); report(`snap:${base}`, null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, active, refreshMs]);

  return { src, loadedAt, status };
}
