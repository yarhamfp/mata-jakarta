import { ChevronDown, Info } from 'lucide-react';
import { useLocalState } from '../hooks/useLocalState';

export default function DemoNotice() {
  const [open, setOpen] = useLocalState('cctvNoticeOpen', matchMedia('(min-width: 881px)').matches);
  return (
    <section className="notice">
      <button className="notice-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Info size={15} aria-hidden="true" />
        <span>Info demo Rabu, 28 Oktober 2026 (#IndonesiaSadar)</span>
        <ChevronDown size={15} className={open ? 'flip' : ''} aria-hidden="true" />
      </button>
      {open && (
        <div className="notice-body">
          <ul>
            <li>TMC Polda Metro Jaya menyebut titik aksi: <b>Gedung DPR/MPR, Bundaran HI, Monas, Tugu Tani</b>, mulai pukul 10.00 WIB.</li>
            <li>BEM UI menyebut <b>Bundaran HI</b>, pukul 14.00 WIB. Poster lain menyebut pukul 07.00 WIB, jadi jam bisa berubah.</li>
            <li>Ruas terdampak: Gatot Subroto sekitar DPR/MPR, Sudirman–Thamrin, dan kawasan Monas.</li>
          </ul>
          <p>
            Daftar kamera resmi <b>belum punya kamera di Monas dan Tugu Tani</b>. Label bendera pada kamera hanya perkiraan dari nama jalan,
            bukan koordinat resmi, jadi cek gambarnya dulu. Sumber:{' '}
            <a href="https://www.cnbcindonesia.com/news/20261028015004-4-780030/hindari-lokasi-ini-massa-mahasiswa-mau-turun-ke-jalan-demo-28-oktober" target="_blank" rel="noopener">CNBC Indonesia</a>,{' '}
            <a href="https://www.owrite.id/megapolitan/2026/10/28/demo-besar-28-oktober-di-jakarta-4-titik-jadi-sasaran-polisi-siapkan-rekayasa-lalu-lintas/" target="_blank" rel="noopener">Owrite</a>,{' '}
            <a href="https://www.beritasatu.com/nasional/3036917/viral-seruan-demo-28-oktober-fakta-atau-hoaks-begini-penjelasannya" target="_blank" rel="noopener">Beritasatu</a>.
            Konfirmasi lewat akun resmi BEM UI dan TMC Polda Metro Jaya.
          </p>
        </div>
      )}
    </section>
  );
}
