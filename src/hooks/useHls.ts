import { useCallback, useEffect, useState, type RefObject } from 'react';
import type Hls from 'hls.js';
import { report } from './health';
import { acquireSlot } from './streamQueue';

export type StreamState = 'connecting' | 'playing' | 'offline';

export const MAX_TRIES = 3;
const BACKOFF_MS = [3000, 8000];      // jeda sebelum percobaan ke-2 dan ke-3
const WATCHDOG_MS = 30_000;           // koneksi yang menggantung tanpa error dianggap gagal
const REPROBE_MS = 60_000;            // kamera yang dinyatakan offline dicoba lagi pelan-pelan

export function useHls(videoRef: RefObject<HTMLVideoElement | null>, base: string) {
  const [state, setState] = useState<StreamState>('connecting');
  const [attempt, setAttempt] = useState(1);
  const [nonce, setNonce] = useState(0);
  const retry = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const url = `${base}/index.m3u8`;
    let hls: Hls | null = null;
    let slot: ReturnType<typeof acquireSlot> | null = null;
    let native = false;
    let cancelled = false;
    let tries = 0;
    let retryTimer = 0;
    let watchdog = 0;

    setState('connecting');
    setAttempt(1);

    const teardown = () => {
      clearTimeout(watchdog);
      hls?.destroy();
      hls = null;
      slot?.release();
      slot = null;
      if (native) { video.onerror = null; video.removeAttribute('src'); video.load(); native = false; }
    };

    // Gagal: coba lagi dengan jeda yang makin panjang, lalu tandai offline dan tetap diperiksa berkala.
    const fail = () => {
      teardown();
      if (cancelled) return;
      tries++;
      if (tries >= 2) report(`hls:${base}`, 'fail'); // dua kali gagal berturut-turut baru dihitung sebagai gangguan
      if (tries < MAX_TRIES) {
        setAttempt(tries + 1);
        setState('connecting');
        retryTimer = window.setTimeout(connect, BACKOFF_MS[tries - 1]);
      } else {
        setState('offline');
        retryTimer = window.setTimeout(() => { tries = 0; setAttempt(1); setState('connecting'); connect(); }, REPROBE_MS);
      }
    };

    const onPlaying = () => {
      clearTimeout(watchdog);
      slot?.release();
      slot = null;
      tries = 0;
      report(`hls:${base}`, 'ok');
      setAttempt(1);
      setState('playing');
    };
    video.addEventListener('playing', onPlaying);

    const connect = () => {
      if (cancelled) return;
      const mine = (slot = acquireSlot());
      mine.ready.then(() => {
        if (cancelled || slot !== mine) return;
        // tab tersembunyi menghentikan pemuatan dengan sengaja, jadi itu bukan tanda kamera bermasalah
        const arm = () => { watchdog = window.setTimeout(() => (document.hidden ? arm() : fail()), WATCHDOG_MS); };
        arm();
        // hls.js is heavy and not needed for the snapshot grid, so load it on first playback.
        return import('hls.js').then(({ default: HlsLib }) => {
          if (cancelled || slot !== mine) return;
          if (HlsLib.isSupported()) {
            hls = new HlsLib({ lowLatencyMode: false, maxBufferLength: 10, liveSyncDurationCount: 3 });
            hls.on(HlsLib.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
            hls.on(HlsLib.Events.ERROR, (_, d) => { if (d.fatal) fail(); });
            hls.loadSource(url);
            hls.attachMedia(video);
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            native = true;
            video.onerror = fail;
            video.src = url;
            video.play().catch(() => {});
          } else {
            clearTimeout(watchdog);
            slot?.release();
            setState('offline');
          }
        });
      }).catch(fail);
    };
    connect();

    // Stop pulling video while the tab is in the background: saves data and spares the source server.
    const onVis = () => {
      if (document.hidden) { hls?.stopLoad(); video.pause(); }
      else { hls?.startLoad(-1); video.play().catch(() => {}); }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', onVis);
      video.removeEventListener('playing', onPlaying);
      report(`hls:${base}`, null);
      teardown();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [videoRef, base, nonce]);

  return { state, attempt, retry };
}
