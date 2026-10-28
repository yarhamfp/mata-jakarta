import { useCallback, useEffect, useState } from 'react';

export const MAX_WALL = 9;
const KEY = 'cctvPins';

// Isi bawaan Live Wall untuk pengunjung baru: kamera di sekitar UOB Plaza dan Jl. MH. Thamrin (dekat Bundaran HI).
// Hanya dipakai kalau belum ada pilihan tersimpan; pin yang diubah pengguna tidak ditimpa.
export const DEFAULT_PINS = [
  '504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-02',
  '504866_JKP_POLRI_UOB-PLAZA-C01_CCTV-01',
  '502492_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C08_CCTV-02',
  '502493_JKP_SATPOL-PP_SIMPANG-JL.-MH.-THAMRIN-C09_CCTV-01',
  '501941_JKP_SATPOLPP_JL.-MH.-THAMRIN-C02_CCTV-02',
  '501941_JKP_SATPOLPP_JL.-MH.-THAMRIN-C02_CCTV-01',
];

// Daftar kosong dianggap "belum memilih": versi lama otomatis menyimpan [] untuk setiap pengunjung,
// jadi [] tidak bisa dibedakan dari pengunjung yang memang belum pernah memin kamera.
function readStored(): string[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw === null ? null : (JSON.parse(raw) as string[]);
    return parsed && parsed.length ? parsed : null;
  } catch { return null; }
}

// `initial` comes from a shared ?w= link and takes priority over what is stored.
export function usePins(initial?: string[]) {
  const [pins, setPins] = useState<string[]>(() => initial ?? readStored() ?? DEFAULT_PINS);

  useEffect(() => {
    // jangan simpan daftar bawaan: baru disimpan setelah pengguna mengubahnya, supaya perubahan bawaan nanti tetap sampai ke pengunjung lama
    if (pins === DEFAULT_PINS) return;
    try { localStorage.setItem(KEY, JSON.stringify(pins)); } catch { /* storage unavailable */ }
  }, [pins]);

  const toggle = useCallback((id: string) => {
    setPins((cur) => {
      if (cur.includes(id)) return cur.filter((p) => p !== id);
      if (cur.length >= MAX_WALL) { alert(`Maksimal ${MAX_WALL} kamera di Live Wall.`); return cur; }
      return [...cur, id];
    });
  }, []);

  return { pins, toggle };
}
