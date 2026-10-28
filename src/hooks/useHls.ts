import { useEffect, useState, type RefObject } from 'react';
import type Hls from 'hls.js';

export function useHls(videoRef: RefObject<HTMLVideoElement | null>, base: string) {
  const [msg, setMsg] = useState('Menghubungkan…');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const url = `${base}/index.m3u8`;
    setMsg('Menghubungkan…');
    const onOk = () => { setMsg(''); video.play().catch(() => {}); };
    const onErr = () => setMsg('Stream tidak tersedia atau sedang offline.');
    let hls: Hls | null = null;
    let cancelled = false;

    // Stop pulling video while the tab is in the background: saves data and spares the source server.
    const onVis = () => {
      if (document.hidden) { hls?.stopLoad(); video.pause(); }
      else { hls?.startLoad(-1); video.play().catch(() => {}); }
    };
    document.addEventListener('visibilitychange', onVis);

    // hls.js is heavy and not needed for the snapshot grid, so load it on first playback.
    import('hls.js').then(({ default: HlsLib }) => {
      if (cancelled) return;
      if (HlsLib.isSupported()) {
        hls = new HlsLib({ lowLatencyMode: false, maxBufferLength: 10, liveSyncDurationCount: 3 });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(HlsLib.Events.MANIFEST_PARSED, onOk);
        hls.on(HlsLib.Events.ERROR, (_, d) => { if (d.fatal) { hls?.destroy(); hls = null; onErr(); } });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.onloadedmetadata = onOk;
        video.onerror = onErr;
      } else {
        setMsg('Browser tidak mendukung HLS.');
      }
    }).catch(onErr);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [videoRef, base]);

  return msg;
}
