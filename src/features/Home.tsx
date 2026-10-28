import { ArrowRight, Camera, Flag, Navigation, Star } from 'lucide-react';
import type { ComponentType } from 'react';
import { CAMS, DEMO_COUNT, type View } from '../data';
import DemoNotice from '../components/DemoNotice';

interface Props {
  pinCount: number;
  onOpen: (v: View, area?: string) => void;
  onPrefetch: (v: View) => void;
}

export default function Home({ pinCount, onOpen, onPrefetch }: Props) {
  const tiles: Array<{ view: View; area?: string; title: string; text: string; Icon: ComponentType<{ size?: number }>; demo?: boolean }> = [
    { view: 'kamera', area: 'demo', title: 'Perkiraan titik demo', text: `${DEMO_COUNT} kamera di sekitar DPR/MPR dan Bundaran HI/Thamrin.`, Icon: Flag, demo: true },
    { view: 'kamera', area: 'all', title: 'Pantau CCTV', text: `${CAMS.length} kamera publik. Cari lokasi atau saring per area.`, Icon: Camera },
    { view: 'wall', title: 'Live Wall', text: pinCount ? `Putar ${pinCount} kamera pilihan Anda sekaligus.` : 'Pantau beberapa kamera sekaligus. Pin kamera dulu dengan ikon bintang.', Icon: Star },
    { view: 'macet', title: 'Hindari Macet', text: 'Cek jalur dari asal ke tujuan terhadap perkiraan titik demo, lengkap dengan navigasi ke Google Maps.', Icon: Navigation },
  ];

  return (
    <div className="page">
      <div className="hero">
        <h1>Pantau Jakarta, langsung dari kamera publik</h1>
        <p>Pantau lewat CCTV resmi Pemprov DKI dan cek jalur yang aman dari kemacetan demo. Pilih menu di bawah. Video dan snapshot baru dimuat saat Anda membukanya, jadi halaman ini ringan.</p>
      </div>

      <DemoNotice />

      <div className="tiles">
        {tiles.map(({ view, area, title, text, Icon, demo }) => (
          <button
            key={title}
            className={`tile${demo ? ' demo' : ''}`}
            onClick={() => onOpen(view, area)}
            onMouseEnter={() => onPrefetch(view)}
            onFocus={() => onPrefetch(view)}
          >
            <span className="tile-icon"><Icon size={18} /></span>
            <span className="tile-body">
              <strong>{title}</strong>
              <span>{text}</span>
            </span>
            <ArrowRight size={16} className="tile-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
