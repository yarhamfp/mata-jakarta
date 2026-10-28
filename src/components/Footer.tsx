import { useVisitors } from '../hooks/useVisitors';

export default function Footer() {
  const visitors = useVisitors();
  return (
    <footer>
      <p>
        Daftar kamera berasal dari portal publik Pemprov DKI Jakarta (
        <a href="https://jakcctv.jakarta.go.id/publik" target="_blank" rel="noopener">jakcctv.jakarta.go.id/publik</a>
        ); video disajikan langsung dari server penyedianya (Bali Tower) ke browser Anda. Situs ini tidak merekam, menyimpan, atau meneruskan video.
      </p>
      <p>
        Situs independen, tidak berafiliasi dengan Pemprov DKI Jakarta. Kamera dapat mati atau terganggu sewaktu-waktu.
        Gunakan untuk memantau kondisi lalu lintas dan keramaian, bukan untuk mengidentifikasi atau menyebarkan data pribadi orang.
      </p>
      <p>
        Sumber lain:{' '}
        <a href="https://smartcity.jakarta.go.id/maps/" target="_blank" rel="noopener">Jakarta Smart City</a>,{' '}
        <a href="https://lewatmana.com/" target="_blank" rel="noopener">Lewat Mana</a>,{' '}
        <a href="https://www.molecool.id/live-cctv" target="_blank" rel="noopener">Molecool</a> (belum diuji dari sini).
        Pintasan di Pantau CCTV: <kbd>/</kbd> cari, <kbd>←</kbd> <kbd>→</kbd> pindah kamera. <kbd>W</kbd> membuka Live Wall.
      </p>
      {visitors !== null && <p className="visitors">{visitors.toLocaleString('id-ID')}</p>}
    </footer>
  );
}
