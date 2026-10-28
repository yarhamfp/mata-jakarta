import { distToPath, haversine, nearestVertex, type LatLng } from './geo';
import type { Zone } from './zones';

export interface Place {
  name: string;
  pos: LatLng;
}

export interface ZoneHit {
  zone: Zone;
  closest: number; // meter dari pusat zona ke rute
}

export interface Candidate {
  id: string;
  label: string;
  duration: number; // detik, tanpa kemacetan
  distance: number; // meter
  path: LatLng[];
  hits: ZoneHit[];
  via: LatLng[]; // titik lewat untuk dipaksakan ke Google Maps
}

const OSRM = 'https://router.project-osrm.org/route/v1/driving';

// Titik pengalih: kota-kota yang bisa dipakai membelokkan rute menjauh dari pusat aksi.
const ANCHORS: Array<{ name: string; pos: LatLng }> = [
  { name: 'Pancoran', pos: [-6.244, 106.8435] },
  { name: 'Mampang Prapatan', pos: [-6.2437, 106.8208] },
  { name: 'Kuningan', pos: [-6.2287, 106.8285] },
  { name: 'Cawang', pos: [-6.245, 106.87] },
  { name: 'Manggarai', pos: [-6.215, 106.85] },
  { name: 'Salemba', pos: [-6.196, 106.85] },
  { name: 'Kemayoran', pos: [-6.165, 106.845] },
  { name: 'Tomang', pos: [-6.176, 106.79] },
  { name: 'Slipi', pos: [-6.199, 106.7975] },
  { name: 'Senopati', pos: [-6.229, 106.81] },
];

export async function geocode(q: string, signal?: AbortSignal): Promise<Place | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=id&accept-language=id&viewbox=106.55,-5.95,107.25,-6.55`;
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`geocode ${r.status}`);
  const d = (await r.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!d.length) return null;
  return { name: d[0].display_name.split(',').slice(0, 2).join(',').trim(), pos: [Number(d[0].lat), Number(d[0].lon)] };
}

interface Raw { duration: number; distance: number; path: LatLng[] }

async function osrm(points: LatLng[], alternatives: boolean, signal?: AbortSignal): Promise<Raw[]> {
  const coords = points.map(([la, lo]) => `${lo.toFixed(5)},${la.toFixed(5)}`).join(';');
  const r = await fetch(`${OSRM}/${coords}?alternatives=${alternatives}&overview=full&geometries=geojson&steps=false`, { signal });
  if (!r.ok) throw new Error(`routing ${r.status}`);
  const d = (await r.json()) as { code: string; routes?: Array<{ duration: number; distance: number; geometry: { coordinates: Array<[number, number]> } }> };
  if (d.code !== 'Ok' || !d.routes) throw new Error(d.code);
  return d.routes.map((x) => ({ duration: x.duration, distance: x.distance, path: x.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng) }));
}

function evaluate(zones: Zone[], path: LatLng[]): ZoneHit[] {
  return zones
    .map((zone) => ({ zone, closest: distToPath(zone.center, path) }))
    .filter((h) => h.closest < h.zone.radius);
}

function sample(path: LatLng[], n: number): LatLng[] {
  return Array.from({ length: n }, (_, i) => path[Math.floor((path.length * (i + 1)) / (n + 1))]);
}

export async function findCandidates(o: Place, d: Place, zones: Zone[], signal?: AbortSignal): Promise<Candidate[]> {
  const cands: Candidate[] = [];
  const add = (raw: Raw, label: string, via: LatLng[]) => {
    const dup = cands.some((c) => Math.abs(c.distance - raw.distance) < 300 && Math.abs(c.duration - raw.duration) < 60);
    if (!dup) cands.push({ id: `r${cands.length}`, label, duration: raw.duration, distance: raw.distance, path: raw.path, hits: evaluate(zones, raw.path), via });
  };

  const direct = await osrm([o.pos, d.pos], true, signal);
  direct.forEach((r, i) => add(r, i === 0 ? 'Rute tercepat' : `Alternatif ${i}`, i === 0 ? [] : sample(r.path, 2)));

  // Hanya cari jalur pengalih kalau semua rute langsung menyentuh area demo.
  if (zones.length && cands.every((c) => c.hits.length)) {
    const usable = ANCHORS
      .filter((a) => zones.every((z) => haversine(a.pos, z.center) > z.radius + 800))
      .filter((a) => haversine(a.pos, o.pos) > 1500 && haversine(a.pos, d.pos) > 1500)
      .map((a) => ({ a, cost: haversine(o.pos, a.pos) + haversine(a.pos, d.pos) }))
      .sort((x, y) => x.cost - y.cost)
      .slice(0, 4);
    const res = await Promise.allSettled(usable.map(({ a }) => osrm([o.pos, a.pos, d.pos], false, signal)));
    res.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value[0]) add(r.value[0], `Lewat ${usable[i].a.name}`, [nearestVertex(usable[i].a.pos, r.value[0].path)]);
    });
  }
  return cands;
}
