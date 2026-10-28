import { Flag, Star, VideoOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Cam, CamStatus } from '../types';
import { camLabel, ownerOf, prettyName } from '../format';
import { useInView } from '../hooks/useInView';
import { useSnapshot } from '../hooks/useSnapshot';

interface Props {
  cam: Cam;
  hidden: boolean;
  spot: string | null;
  paused: boolean;
  pinned: boolean;
  refreshMs: number;
  onOpen: (id: string) => void;
  onPin: (id: string) => void;
  onStatus: (id: string, s: CamStatus) => void;
}

function useAge(at: number) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!at) return;
    const t = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, [at]);
  if (!at) return '';
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  return s < 60 ? `${s} dtk lalu` : `${Math.floor(s / 60)} mnt lalu`;
}

export default function CameraCard({ cam, hidden, spot, paused, pinned, refreshMs, onOpen, onPin, onStatus }: Props) {
  const { ref, visible } = useInView<HTMLElement>();
  const { src, loadedAt, status } = useSnapshot(cam.base, visible && !paused, refreshMs, (s) => onStatus(cam.id, s));
  const age = useAge(loadedAt);
  const owner = ownerOf(cam);

  return (
    <article ref={ref} className={`card${status === 'off' ? ' off' : ''}`} hidden={hidden}>
      <button className="media" onClick={() => onOpen(cam.id)} aria-label={`Buka live ${prettyName(cam)}`}>
        {src ? <img src={src} alt="" /> : status === 'off' ? <span className="media-off"><VideoOff size={22} aria-hidden="true" />Tidak ada sinyal</span> : <span className="skeleton" />}
        {status === 'off' && <span className="offline-badge"><VideoOff size={12} aria-hidden="true" /> Offline</span>}
        <span className="media-foot">
          <span className={`dot${status === 'ok' ? '' : ' idle'}`} />
          {status === 'off' ? (age ? `Gambar terakhir · ${age}` : 'Offline') : status === 'ok' ? `Live · ${age}` : 'Memuat'}
        </span>
      </button>
      <button className={`pinbtn${pinned ? ' on' : ''}`} onClick={() => onPin(cam.id)} title={pinned ? 'Lepas dari Live Wall' : 'Pin ke Live Wall'} aria-pressed={pinned}>
        <Star size={14} fill={pinned ? 'currentColor' : 'none'} />
      </button>
      <div className="info">
        <h3>{prettyName(cam)}</h3>
        <p>{camLabel(cam)}{owner ? ` · ${owner}` : ''}</p>
        {spot && <p className="spot"><Flag size={12} aria-hidden="true" /> {spot}</p>}
      </div>
    </article>
  );
}
