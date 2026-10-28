import { RefreshCw, VideoOff } from 'lucide-react';
import { MAX_TRIES, type StreamState } from '../hooks/useHls';
import { useSnapshot } from '../hooks/useSnapshot';

interface Props {
  base: string;
  state: StreamState;
  attempt: number;
  onRetry: () => void;
}

const noop = () => {};

// Lapisan di atas video: pesan saat menghubungkan, dan penanda offline dengan gambar terakhir bila ada.
// Gambar hanya diminta saat kamera offline, jadi tidak menambah beban ke server yang sedang penuh.
export default function StreamOverlay({ base, state, attempt, onRetry }: Props) {
  const snap = useSnapshot(base, state === 'offline', 60_000, noop);
  if (state === 'playing') return null;

  if (state === 'connecting') {
    return (
      <div className="stage-msg">
        {attempt > 1 ? `Server sedang ramai, mencoba lagi (${attempt}/${MAX_TRIES})…` : 'Menghubungkan…'}
      </div>
    );
  }

  return (
    <div className="offline-overlay">
      {snap.src && <img src={snap.src} alt="" />}
      <div className="offline-body">
        <span className="offline-badge"><VideoOff size={14} aria-hidden="true" /> Offline</span>
        <p>
          {snap.src
            ? 'Video tidak masuk. Ini gambar terakhir yang berhasil diambil.'
            : 'Tidak ada sinyal dari kamera, atau server sumber sedang penuh. Dicoba lagi otomatis tiap menit.'}
        </p>
        <button className="btn" onClick={onRetry}><RefreshCw size={13} aria-hidden="true" /> Coba lagi</button>
      </div>
    </div>
  );
}
