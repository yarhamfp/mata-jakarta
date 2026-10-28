import type { Cam } from './types';

// Label titik demo 28 Okt 2026. Pencocokan hanya berdasarkan NAMA JALAN di nama kamera
// (bukan koordinat resmi), jadi sifatnya perkiraan.
const RULES: Array<{ id: 'dpr' | 'hi'; label: string; test: RegExp }> = [
  { id: 'dpr', label: 'Sekitar DPR/MPR', test: /GATOT SUBROTO|GERBANG PEMUDA/i },
  { id: 'hi', label: 'Sekitar Bundaran HI', test: /THAMRIN|UOB/i },
];

export function demoSpotOf(cam: Cam): string | null {
  return RULES.find((r) => r.test.test(cam.name))?.label ?? null;
}

export const DEMO_FILTER = '__demo__';
