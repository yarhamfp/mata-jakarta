import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Candidate, Place } from '../lib/routing';
import type { Zone } from '../lib/zones';

interface Props {
  zones: Zone[];
  origin: Place;
  dest: Place;
  cands: Candidate[];
  selectedId: string;
  fastestId: string;
  theme: 'light' | 'dark';
}

const pin = (letter: string) =>
  L.divIcon({ className: '', html: `<div class="map-pin">${letter}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });

export default function RouteMap({ zones, origin, dest, cands, selectedId, fastestId, theme }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([-6.21, 106.83], 11);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; tiles.current = null; layer.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tiles.current?.remove();
    tiles.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      className: theme === 'dark' ? 'tiles-dark' : '',
    }).addTo(m);
  }, [theme]);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();

    zones.forEach((z) => {
      L.circle(z.center, { radius: z.radius, color: '#f97316', weight: 1.5, fillColor: '#f97316', fillOpacity: 0.16 })
        .bindTooltip(`Perkiraan titik demo: ${z.name}`, { sticky: true })
        .addTo(g);
    });

    // non-selected first so the selected route draws on top
    [...cands].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)).forEach((c) => {
      const sel = c.id === selectedId;
      const risky = c.hits.length > 0;
      L.polyline(c.path, {
        color: sel ? (risky ? '#ef4444' : '#22c55e') : '#94a3b8',
        weight: sel ? 6 : 4,
        opacity: sel ? 0.95 : 0.6,
        dashArray: !sel || (risky && c.id === fastestId) ? '8 8' : undefined,
      }).addTo(g);
    });

    L.marker(origin.pos, { icon: pin('A') }).bindTooltip(origin.name).addTo(g);
    L.marker(dest.pos, { icon: pin('B') }).bindTooltip(dest.name).addTo(g);

    const sel = cands.find((c) => c.id === selectedId) ?? cands[0];
    const bounds = L.latLngBounds(sel.path);
    zones.forEach((z) => bounds.extend(L.latLng(z.center)));
    m.fitBounds(bounds, { padding: [24, 24] });
  }, [zones, origin, dest, cands, selectedId, fastestId]);

  return <div ref={el} className="route-map" />;
}
