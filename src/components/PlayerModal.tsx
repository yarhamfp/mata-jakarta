import { Check, ChevronLeft, ChevronRight, Flag, Link2, Maximize2, PictureInPicture2, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Cam } from '../types';
import { camLabel, ownerOf, prettyName, shortArea } from '../format';
import { useHls } from '../hooks/useHls';
import StreamOverlay from './StreamOverlay';

interface Props {
  cam: Cam;
  spot: string | null;
  pinned: boolean;
  onPin: () => void;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
}

export default function PlayerModal({ cam, spot, pinned, onPin, onClose, onStep }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useHls(videoRef, cam.base);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onStep(1);
      else if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onStep]);

  const fullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (v.requestFullscreen) v.requestFullscreen();
    else (v as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
  };
  const pip = () => {
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else v.requestPictureInPicture().catch(() => {});
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };
  const owner = ownerOf(cam);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={prettyName(cam)}>
      <div className="modal-bar">
        <div className="modal-title">
          <h2>{prettyName(cam)}</h2>
          <p>
            {camLabel(cam)}{owner ? ` · ${owner}` : ''} · {shortArea(cam.area)}
            {spot && <>{' · '}<span className="spot"><Flag size={12} aria-hidden="true" /> {spot}</span></>}
          </p>
        </div>
        <button className="ibtn" onClick={() => onStep(-1)} title="Sebelumnya (←)" aria-label="Kamera sebelumnya"><ChevronLeft size={18} /></button>
        <button className="ibtn" onClick={() => onStep(1)} title="Berikutnya (→)" aria-label="Kamera berikutnya"><ChevronRight size={18} /></button>
        <span className="sep" />
        <button className={`ibtn${pinned ? ' on' : ''}`} onClick={onPin} title={pinned ? 'Lepas dari Live Wall' : 'Pin ke Live Wall'} aria-pressed={pinned}><Star size={16} fill={pinned ? 'currentColor' : 'none'} /></button>
        <button className="ibtn" onClick={copy} title="Salin tautan kamera ini" aria-label="Salin tautan">{copied ? <Check size={16} /> : <Link2 size={16} />}</button>
        {document.pictureInPictureEnabled && <button className="ibtn" onClick={pip} title="Picture-in-Picture" aria-label="Picture in picture"><PictureInPicture2 size={16} /></button>}
        <button className="ibtn" onClick={fullscreen} title="Layar penuh" aria-label="Layar penuh"><Maximize2 size={16} /></button>
        <button className="ibtn" onClick={onClose} title="Tutup (Esc)" aria-label="Tutup"><X size={18} /></button>
      </div>
      <div className="stage">
        <video ref={videoRef} controls muted autoPlay playsInline />
        <StreamOverlay base={cam.base} state={stream.state} attempt={stream.attempt} onRetry={stream.retry} />
      </div>
    </div>
  );
}
