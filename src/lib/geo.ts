export type LatLng = [number, number]; // [lat, lng]

const R = 6371000;
const RAD = Math.PI / 180;

export function haversine(a: LatLng, b: LatLng): number {
  const x = Math.sin(((b[0] - a[0]) * RAD) / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(((b[1] - a[1]) * RAD) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Shortest distance (m) from point `c` to a polyline, using a local flat projection centred on `c`.
export function distToPath(c: LatLng, path: LatLng[]): number {
  if (path.length === 1) return haversine(c, path[0]);
  const k = Math.cos(c[0] * RAD);
  const xy = (p: LatLng): [number, number] => [(p[1] - c[1]) * RAD * R * k, (p[0] - c[0]) * RAD * R];
  let best = Infinity;
  let a = xy(path[0]);
  for (let i = 1; i < path.length; i++) {
    const b = xy(path[i]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(a[0] + t * dx, a[1] + t * dy));
    a = b;
  }
  return best;
}

export function nearestVertex(target: LatLng, path: LatLng[]): LatLng {
  let best = path[0];
  let bd = Infinity;
  for (const p of path) {
    const d = haversine(target, p);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
