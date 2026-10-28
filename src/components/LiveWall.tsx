import { Check, Link2, Maximize2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Cam } from '../types';
import { camLabel, prettyName } from '../format';
import { useHls } from '../hooks/useHls';

function Cell({ cam, onRemove }: { cam: Cam; onRemove: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const msg = useHls(ref, cam.base);
  return (
    <div className="wcell">
      <video ref={ref} muted autoPlay playsInline />
      {msg && <div className="stage-msg">{msg}</div>}
      <div className="wlabel">{prettyName(cam)} <span>{camLabel(cam)}</span></div>
      <button className="wx" title="Lepas dari Live Wall" aria-label="Lepas dari Live Wall" onClick={onRemove}><X size={14} /></button>
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
    if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.();
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
