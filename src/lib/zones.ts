import type { LatLng } from './geo';

export interface Zone {
  id: string;
  name: string;
  road: string; // ruas yang sebaiknya dihindari
  center: LatLng;
  radius: number; // meter
}

// Perkiraan titik aksi 28 Okt 2026 (#IndonesiaSadar), dari TMC Polda Metro Jaya dan BEM UI.
// Koordinat dan radius adalah perkiraan kasar, bukan batas resmi penutupan jalan.
export const ZONE_DATE = '2026-10-28';

export const ZONES: Zone[] = [
  { id: 'dpr', name: 'DPR/MPR', road: 'Jl. Gatot Subroto sekitar DPR/MPR', center: [-6.2097, 106.8004], radius: 800 },
  { id: 'hi', name: 'Bundaran HI', road: 'Jl. Sudirman–Thamrin sekitar Bundaran HI', center: [-6.1951, 106.823], radius: 1000 },
  { id: 'monas', name: 'Monas', road: 'Jl. Medan Merdeka sekitar Monas', center: [-6.1754, 106.8272], radius: 900 },
  { id: 'tani', name: 'Tugu Tani', road: 'Jl. Perwira dan sekitar Tugu Tani', center: [-6.1818, 106.8348], radius: 500 },
];

export function jakartaNow(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')) % 24 + Number(get('minute')) / 60,
    weekend: ['Sat', 'Sun'].includes(get('weekday')),
  };
}

export function activeZones(now: Date): Zone[] {
  return jakartaNow(now).date === ZONE_DATE ? ZONES : [];
}
