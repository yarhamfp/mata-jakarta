import camsData from './cams.json';
import type { Cam } from './types';
import type { NavItem } from './components/Sidebar';
import { demoSpotOf } from './demo';
import { shortArea } from './format';
import { shortId } from './ids';

// kamera di titik demo ditaruh paling atas (sort stabil, urutan lain tetap)
export const CAMS = [...(camsData as Cam[])].sort((a, b) => Number(!!demoSpotOf(b)) - Number(!!demoSpotOf(a)));
export const BY_SHORT = new Map(CAMS.map((c) => [shortId(c.id), c.id]));
export const SHORT = new Map(CAMS.map((c) => [c.id, shortId(c.id)]));
export const DEMO_COUNT = CAMS.filter((c) => demoSpotOf(c)).length;
const AREAS = Array.from(new Set(CAMS.map((c) => c.area)));
export const NAV: NavItem[] = [
  { key: 'all', label: 'Semua kamera', count: CAMS.length },
  { key: 'demo', label: 'Perkiraan titik demo', count: DEMO_COUNT, demo: true },
  ...AREAS.map((a) => ({ key: a, label: shortArea(a), count: CAMS.filter((c) => c.area === a).length })),
];
export const NAV_KEYS = new Set(NAV.map((n) => n.key));

export type View = 'home' | 'kamera' | 'wall' | 'macet';
