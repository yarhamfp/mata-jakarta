import { TriangleAlert, WifiOff, X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { isRecovered, isTrouble, useHealth } from '../hooks/health';

const subscribeOnline = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); };
};
const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine);

// Popup peringatan: muncul saat banyak kamera gagal sekaligus, dan hilang sendiri begitu pulih.
export default function HealthAlert() {
  const h = useHealth();
  const online = useOnline();
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // sekali muncul tetap tampil sampai benar-benar pulih, supaya tidak berkedip saat jumlahnya naik-turun
  useEffect(() => {
    if (isTrouble(h)) setActive(true);
    else if (isRecovered(h)) { setActive(false); setDismissed(false); }
  }, [h]);

  if (!online) {
    return (
      <div className="health-alert" role="alert">
        <WifiOff size={18} aria-hidden="true" />
        <div><b>Koneksi internet Anda terputus.</b><p>Video akan tersambung lagi otomatis begitu internet kembali.</p></div>
      </div>
    );
  }
  if (!active || dismissed) return null;

  return (
    <div className="health-alert" role="alert">
      <TriangleAlert size={18} aria-hidden="true" />
      <div>
        <b>Kemungkinan ada gangguan di server pusat CCTV</b>
        <p>
          {h.fail} dari {h.ok + h.fail} kamera yang dicoba tidak bisa dihubungi. Biasanya ini karena server sumber sedang penuh atau terganggu,
          bukan masalah di perangkat Anda. Kami mencoba lagi otomatis. Anda juga bisa memeriksa{' '}
          <a href="https://jakcctv.jakarta.go.id/publik" target="_blank" rel="noopener">portal resmi Pemprov DKI</a>.
        </p>
      </div>
      <button className="health-close" onClick={() => setDismissed(true)} aria-label="Tutup peringatan"><X size={16} /></button>
    </div>
  );
}
