import { AlertTriangle, ArrowLeftRight, CheckCircle2, ExternalLink, Info, LocateFixed, Navigation, ShieldAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import RouteMap from '../components/RouteMap';
import { buildAdvice, googleNavUrl, wazeUrl, type Advice } from '../lib/advice';
import { findCandidates, geocode, type Candidate, type Place } from '../lib/routing';
import { activeZones, type Zone } from '../lib/zones';

const PRESETS: Array<Place & { area?: string }> = [
  { name: 'Bekasi', pos: [-6.2349, 106.9923] },
  { name: 'Depok', pos: [-6.3728, 106.8317] },
  { name: 'Tangerang', pos: [-6.1783, 106.6319] },
  { name: 'Bogor', pos: [-6.595, 106.8166] },
  { name: 'Blok M', pos: [-6.2441, 106.7983], area: 'Blok M – Kebayoran Baru' },
  { name: 'Kelapa Gading', pos: [-6.157, 106.905] },
  { name: 'Kota Tua', pos: [-6.1352, 106.8133] },
  { name: 'Tanah Abang', pos: [-6.1862, 106.8116], area: 'Tanah Abang & sekitarnya' },
  { name: 'Bandara Soekarno-Hatta', pos: [-6.1256, 106.6559] },
];

interface Field { text: string; place: Place | null }
interface Result { o: Place; d: Place; cands: Candidate[]; advice: Advice; zones: Zone[] }

const min = (s: number) => Math.round(s / 60);
const km = (m: number) => (m / 1000).toFixed(1);

function PlaceField({ label, value, onChange, gps }: { label: string; value: Field; onChange: (f: Field) => void; gps?: boolean }) {
  const [locating, setLocating] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); onChange({ text: 'Lokasi saya', place: { name: 'Lokasi saya', pos: [p.coords.latitude, p.coords.longitude] } }); },
      () => { setLocating(false); alert('Lokasi tidak bisa diakses. Ketik asal Anda atau pilih dari daftar.'); },
      { timeout: 10000 },
    );
  };
  return (
    <div className="field">
      <span>{label}</span>
      <div className="chips">
        {gps && (
          <button className={`chip${value.place?.name === 'Lokasi saya' ? ' on' : ''}`} onClick={locate} disabled={locating}>
            <LocateFixed size={12} aria-hidden="true" /> {locating ? 'Mencari…' : 'Lokasi saya'}
          </button>
        )}
        {PRESETS.map((p) => (
          <button key={p.name} className={`chip${value.place?.name === p.name ? ' on' : ''}`} onClick={() => onChange({ text: p.name, place: p })}>{p.name}</button>
        ))}
      </div>
      <input value={value.text} onChange={(e) => onChange({ text: e.target.value, place: null })} placeholder="Atau ketik alamat / nama tempat" />
    </div>
  );
}

export default function Macet({ theme }: { theme: 'light' | 'dark' }) {
  const [from, setFrom] = useState<Field>({ text: '', place: null });
  const [to, setTo] = useState<Field>({ text: 'Bekasi', place: PRESETS[0] });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [res, setRes] = useState<Result | null>(null);
  const [sel, setSel] = useState('');
  const abort = useRef<AbortController | null>(null);

  const swap = () => { setFrom(to); setTo(from); };

  const run = async () => {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setError(''); setRes(null);
    try {
      if (!from.text.trim() || !to.text.trim()) { setError('Isi dulu asal dan tujuan.'); return; }
      setBusy('Mencari lokasi…');
      const o = from.place ?? (await geocode(from.text, ac.signal));
      const d = to.place ?? (await geocode(to.text, ac.signal));
      if (!o || !d) { setError(`Lokasi tidak ditemukan: ${!o ? from.text : to.text}. Coba tulis lebih spesifik, mis. nama jalan atau mal.`); return; }
      setBusy('Memeriksa beberapa jalur…');
      const now = new Date();
      const zones = activeZones(now);
      const cands = await findCandidates(o, d, zones, ac.signal);
      if (!cands.length) { setError('Tidak ada rute mobil yang ditemukan antara dua titik itu.'); return; }
      const advice = buildAdvice(o, d, cands, zones, now);
      setRes({ o, d, cands, advice, zones });
      setSel(advice.best.id);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('Layanan rute sedang tidak bisa dihubungi. Coba lagi sebentar, atau buka langsung di Google Maps.');
    } finally {
      if (abort.current === ac) setBusy('');
    }
  };

  const adv = res?.advice;
  const chosen = res?.cands.find((c) => c.id === sel) ?? adv?.best;
  const Icon = adv?.level === 'ok' || adv?.level === 'none' ? CheckCircle2 : adv?.level === 'warn' ? AlertTriangle : ShieldAlert;

  return (
    <div className="page macet-page">
      <div className="hero">
        <h1>Hindari macet akibat demo <span className="badge-est">Perkiraan</span></h1>
        <p>Masukkan asal dan tujuan. Kami memeriksa beberapa jalur terhadap perkiraan titik demo hari ini dan menyarankan jalur yang menghindarinya.</p>
      </div>

      <div className="callout" role="note">
        <Info size={16} aria-hidden="true" />
        <p>
          <b>Ini hanya perkiraan, bukan jaminan jalur bebas macet.</b> Saran dihitung dari titik demo yang kami perkirakan dari berita
          (lokasi dan radiusnya bisa meleset) dan dari durasi rute tanpa kemacetan. Penutupan atau pengalihan jalan yang sebenarnya bisa berbeda,
          dan kami tidak punya data lalu lintas langsung. Sebelum berangkat, cek Google Maps atau Waze dan akun TMC Polda Metro Jaya.
        </p>
      </div>

      <div className="macet-grid">
        <div className="macet-side">
          <div className="sheet">
            <PlaceField label="Dari" value={from} onChange={setFrom} gps />
            <button className="btn swap" onClick={swap} title="Tukar asal dan tujuan"><ArrowLeftRight size={14} /> Tukar</button>
            <PlaceField label="Ke" value={to} onChange={setTo} />
            <button className="btn primary wide-btn" onClick={run} disabled={!!busy}>
              <Navigation size={15} aria-hidden="true" /> {busy || 'Cek jalur'}
            </button>
            {error && <p className="form-error">{error}</p>}
          </div>

          {adv && res && chosen && (
            <div className="sheet result">
              <div className="result-head">
                <strong>Saran jalur</strong>
                <span className="badge-est">Perkiraan</span>
              </div>
              <div className={`verdict ${adv.level}`}>
                <Icon size={18} aria-hidden="true" />
                <p>{adv.headline}</p>
              </div>

              {adv.avoid.length > 0 && (
                <div className="avoid">
                  <b>Hindari:</b>
                  <ul>{adv.avoid.map((a) => <li key={a}>{a}</li>)}</ul>
                </div>
              )}

              <div className="routes" role="radiogroup" aria-label="Pilihan jalur">
                {res.cands.map((c) => (
                  <button key={c.id} role="radio" aria-checked={c.id === sel} className={`route-card${c.id === sel ? ' on' : ''}`} onClick={() => setSel(c.id)}>
                    <span className="route-top">
                      <strong>{c.label}</strong>
                      {c.id === adv.best.id && <span className="tag good">Disarankan</span>}
                    </span>
                    <span className="route-meta num">{min(c.duration)} menit tanpa macet · {km(c.distance)} km</span>
                    <span className={`route-hit${c.hits.length ? ' bad' : ' ok'}`}>
                      {c.hits.length ? `Menyentuh ${c.hits.map((h) => h.zone.name).join(', ')}` : res.zones.length ? 'Menghindari semua perkiraan titik demo' : 'Rute jalan biasa'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="sheet-actions">
                <a className="btn primary" href={googleNavUrl(res.o.pos, res.d.pos, chosen.via)} target="_blank" rel="noopener">
                  <ExternalLink size={15} aria-hidden="true" /> Mulai navigasi di Google Maps
                </a>
                <a className="btn" href={wazeUrl(res.d.pos)} target="_blank" rel="noopener">
                  <ExternalLink size={15} aria-hidden="true" /> Waze (tujuan saja)
                </a>
              </div>
              <p className="sheet-note small">
                Google Maps membuka jalur yang dipilih dengan kemacetan langsung dari mereka. Pada jalur selain tercepat, kami menyisipkan titik lewat
                agar Google mengikuti jalur itu; titik tersebut akan tampil sebagai persinggahan. Waze tidak mendukung titik lewat, jadi hanya tujuan yang diisi.
              </p>

              {adv.notes.length > 0 && <ul className="notes">{adv.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
            </div>
          )}
        </div>

        <div className="macet-map">
          {res && chosen ? (
            <RouteMap zones={res.zones} origin={res.o} dest={res.d} cands={res.cands} selectedId={sel} fastestId={res.cands.reduce((a, b) => (b.duration < a.duration ? b : a)).id} theme={theme} />
          ) : (
            <div className="map-empty">Peta jalur akan muncul di sini setelah Anda menekan “Cek jalur”.</div>
          )}
          <p className="sheet-note small">
            Garis hijau: jalur terpilih yang menghindari area demo. Garis merah putus-putus: jalur terpilih yang menyentuh area demo. Lingkaran oranye:
            perkiraan titik demo (koordinat dan radius kasar, bukan batas resmi penutupan jalan). Durasi dari OpenStreetMap/OSRM tanpa memperhitungkan kemacetan.
          </p>
        </div>
      </div>
    </div>
  );
}
