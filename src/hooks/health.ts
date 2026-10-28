import { useSyncExternalStore } from 'react';

// Pencatat bersama: setiap stream/snapshot melapor berhasil atau gagal, supaya aplikasi bisa membedakan
// satu kamera yang mati dari gangguan di server pusat (banyak kamera gagal sekaligus).
type Outcome = 'ok' | 'fail';
export interface Health { ok: number; fail: number }

const outcomes = new Map<string, Outcome>();
const listeners = new Set<() => void>();
let snapshot: Health = { ok: 0, fail: 0 };

function emit() {
  // kunci berbentuk "jenis:alamat"; satu kamera dihitung sekali, dan dianggap baik bila salah satu (video/gambar) berhasil
  const perCam = new Map<string, boolean>();
  outcomes.forEach((o, key) => {
    const cam = key.slice(key.indexOf(':') + 1);
    perCam.set(cam, (perCam.get(cam) ?? false) || o === 'ok');
  });
  let ok = 0;
  let fail = 0;
  perCam.forEach((good) => { if (good) ok++; else fail++; });
  if (ok === snapshot.ok && fail === snapshot.fail) return;
  snapshot = { ok, fail };
  listeners.forEach((l) => l());
}

// null = lupakan laporan ini (misalnya komponennya ditutup)
export function report(key: string, outcome: Outcome | null) {
  if (outcome === null) { if (!outcomes.delete(key)) return; }
  else if (outcomes.get(key) === outcome) return;
  else outcomes.set(key, outcome);
  emit();
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function useHealth(): Health {
  return useSyncExternalStore(subscribe, () => snapshot);
}

// Gangguan server pusat: sedikitnya 3 kegagalan dan mayoritas dari yang dicoba gagal.
// Kamera mati satu-dua (hal biasa di daftar ini) tidak memenuhi syarat itu.
export const isTrouble = (h: Health) => h.fail >= 3 && h.fail / (h.ok + h.fail) >= 0.6;
// Dianggap pulih kalau yang berhasil sudah lebih banyak daripada yang gagal.
export const isRecovered = (h: Health) => h.fail === 0 || (h.ok >= 2 && h.ok > h.fail);
