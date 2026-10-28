import { jakartaNow, type Zone } from './zones';
import type { Candidate, Place } from './routing';
import { haversine, type LatLng } from './geo';

export interface Advice {
  level: 'ok' | 'warn' | 'bad' | 'none';
  headline: string;
  avoid: string[];
  notes: string[];
  best: Candidate;
  fastest: Candidate;
  extraMin: number;
}

const min = (s: number) => Math.round(s / 60);

function score(c: Candidate) {
  return [c.hits.length, c.hits.reduce((s, h) => s + (h.zone.radius - h.closest), 0), c.duration] as const;
}

function trafficNotes(now: Date, active: boolean): string[] {
  const { hour, weekend } = jakartaNow(now);
  const notes: string[] = [];
  if (!weekend && ((hour >= 6 && hour < 9.5) || (hour >= 16 && hour < 20))) {
    notes.push('Sekarang jam sibuk: ruas utama (tol dalam kota, Sudirman, Gatot Subroto, Cawang) biasanya padat walau tanpa demo.');
  } else if (!weekend && hour >= 9.5 && hour < 16) {
    notes.push('Sekarang di luar jam sibuk, tapi lalu lintas siang di Jakarta tetap sering ramai.');
  }
  if (active) {
    if (hour < 10) notes.push('Aksi dijadwalkan mulai sekitar pukul 10.00 WIB (TMC Polda Metro Jaya) dan 14.00 WIB (BEM UI). Berangkat sebelum itu memberi ruang.');
    else if (hour < 18) notes.push('Aksi kemungkinan sedang atau akan berlangsung. Pengalihan arus bisa berubah mendadak.');
    else notes.push('Aksi biasanya sudah mereda, tapi pengalihan arus dan sisa kepadatan bisa bertahan. Cek akun TMC Polda Metro Jaya.');
  }
  return notes;
}

export function buildAdvice(o: Place, d: Place, cands: Candidate[], zones: Zone[], now: Date): Advice {
  const fastest = cands.reduce((a, b) => (b.duration < a.duration ? b : a));
  const clean = cands.filter((c) => !c.hits.length);
  const best = clean.length
    ? clean.reduce((a, b) => (b.duration < a.duration ? b : a))
    : cands.reduce((a, b) => {
        const sa = score(a), sb = score(b);
        return sb[0] < sa[0] || (sb[0] === sa[0] && (sb[1] < sa[1] || (sb[1] === sa[1] && sb[2] < sa[2]))) ? b : a;
      });
  const extraMin = min(best.duration - fastest.duration);
  const notes = trafficNotes(now, zones.length > 0);

  const inside = zones.filter((z) => haversine(o.pos, z.center) < z.radius || haversine(d.pos, z.center) < z.radius);
  if (inside.length) notes.unshift(`Titik awal atau tujuan Anda berada di dekat ${inside.map((z) => z.name).join(', ')}, jadi sulit dihindari sepenuhnya. Pertimbangkan jalan kaki, KRL, atau MRT untuk menutup jarak terakhir.`);

  if (!zones.length) {
    return { level: 'none', headline: 'Tidak ada data aksi untuk hari ini. Rute di bawah hanya rute jalan biasa, tanpa penyaringan titik demo.', avoid: [], notes, best: fastest, fastest, extraMin: 0 };
  }

  if (!fastest.hits.length) {
    return { level: 'ok', headline: 'Rute tercepat tidak melewati perkiraan titik demo. Tetap cek kondisi lalu lintas langsung sebelum berangkat.', avoid: [], notes, best: fastest, fastest, extraMin: 0 };
  }

  const avoid = fastest.hits.map((h) => h.zone.road);
  if (!best.hits.length) {
    return {
      level: 'warn',
      headline: `Jangan lewat ${avoid.join(' dan ')}: rute tercepat melewatinya dan berpotensi macet akibat demo. Lebih aman pilih “${best.label}”${extraMin > 0 ? `, sekitar ${extraMin} menit lebih lama dari rute tercepat (tanpa hitungan macet)` : ''}.`,
      avoid, notes, best, fastest, extraMin,
    };
  }
  return {
    level: 'bad',
    headline: `Semua jalur yang kami cek menyentuh area demo. Yang paling sedikit terdampak: “${best.label}”, menyentuh ${best.hits.map((h) => h.zone.name).join(', ')}. Pertimbangkan menunda, berangkat lebih awal, atau naik KRL/MRT.`,
    avoid, notes, best, fastest, extraMin,
  };
}

export function googleNavUrl(o: LatLng, d: LatLng, via: LatLng[]): string {
  const f = (p: LatLng) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
  const wp = via.length ? `&waypoints=${via.map(f).join('%7C')}` : '';
  return `https://www.google.com/maps/dir/?api=1&origin=${f(o)}&destination=${f(d)}&travelmode=driving${wp}`;
}

export function wazeUrl(d: LatLng): string {
  return `https://waze.com/ul?ll=${d[0].toFixed(5)},${d[1].toFixed(5)}&navigate=yes`;
}
