import { Check, Link2, Maximize2, Minimize2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Cam } from '../types';
import { camLabel, prettyName } from '../format';
import { useHls } from '../hooks/useHls';
import StreamOverlay from './StreamOverlay';

function Cell({ cam, onRemove }: { cam: Cam; onRemove: () => void }) {
  const cellRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const stream = useHls(ref, cam.base);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === cellRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFull = () => {
    const cell = cellRef.current;
    const video = ref.current;
    if (!cell) return;
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (cell.requestFullscreen) cell.requestFullscreen().catch(() => {});
    // iOS Safari tidak mendukung fullscreen pada elemen biasa, hanya pada video
    else (video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)?.webkitEnterFullscreen?.();
  };

  return (
    <div ref={cellRef} className="wcell" onDoubleClick={toggleFull}>
      <video ref={ref} muted autoPlay playsInline />
      <StreamOverlay base={cam.base} state={stream.state} attempt={stream.attempt} onRetry={stream.retry} />
      <div className="wlabel">{prettyName(cam)} <span>{camLabel(cam)}</span></div>
      <div className="wtools">
        <button className="wb" title={full ? 'Keluar layar penuh' : 'Layar penuh (klik dua kali)'} aria-label={full ? 'Keluar layar penuh' : 'Layar penuh'} onClick={toggleFull}>
          {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button className="wb" title="Lepas dari Live Wall" aria-label="Lepas dari Live Wall" onClick={onRemove}><X size={14} /></button>
      </div>
    </div>
  );
}

interface Props {
  cams: Cam[];
  onRemove: (id: string) => void;
  onExit: () => void;
}

export default function LiveWall({ cams, onRemove, onExit }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const cols = cams.length <= 1 ? 1 : cams.length <= 4 ? 2 : 3;

  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };
  const fs = () => {
    const el = boxRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.().catch(() => {});
  };

  return (
    <div ref={boxRef} className="wallbox">
      <div className="toolbar">
        <span className="muted">Live Wall · {cams.length} kamera diputar bersamaan. Tutup bila tidak dipakai agar hemat kuota.</span>
        <div className="row">
          <button className="btn" onClick={copy} disabled={!cams.length}>{copied ? <Check size={15} /> : <Link2 size={15} />} {copied ? 'Tersalin' : 'Salin tautan'}</button>
          <button className="btn" onClick={fs} disabled={!cams.length}><Maximize2 size={15} /> Layar penuh</button>
          <button className="btn" onClick={onExit}>Kembali ke grid</button>
        </div>
      </div>
      {cams.length === 0 ? (
        <div className="empty">Belum ada kamera yang dipin. Klik ikon bintang pada kamera, lalu buka Live Wall.</div>
      ) : (
        <div className="wall" style={{ ['--wcols' as string]: cols }}>
          {cams.map((c) => <Cell key={c.id} cam={c} onRemove={() => onRemove(c.id)} />)}
        </div>
      )}
    </div>
  );
}
