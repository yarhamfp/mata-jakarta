import { useEffect, useState } from 'react';

// Penghitung publik gratis (CORS terbuka). Hanya angka yang disimpan di sana, tanpa data pengunjung.
const API = 'https://countapi.mileshilliard.com/api/v1';
// Saat pengembangan lokal pakai kunci terpisah supaya angka asli tidak terdorong.
const KEY = import.meta.env.DEV ? 'mata-jakarta-pengunjung-dev' : 'mata-jakarta-pengunjung';
const SEEN = 'cctvVisited';

// Satu browser dihitung sekali: kunjungan pertama menaikkan angka, kunjungan berikutnya hanya membaca.
// Kalau layanan tidak bisa dihubungi, hasilnya null dan badge tidak ditampilkan.
export function useVisitors() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    let seen = false;
    try { seen = localStorage.getItem(SEEN) === '1'; } catch { /* storage unavailable */ }

    const call = (op: 'get' | 'hit') =>
      fetch(`${API}/${op}/${KEY}`, { signal: ac.signal }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

    // 'get' gagal kalau kunci belum pernah dibuat, jadi coba 'hit' sebagai gantinya
    (seen ? call('get').catch(() => call('hit')) : call('hit'))
      .then((d: { value?: number }) => {
        if (typeof d.value !== 'number') return;
        setCount(d.value);
        if (!seen) { try { localStorage.setItem(SEEN, '1'); } catch { /* storage unavailable */ } }
      })
      .catch(() => { /* badge simply stays hidden */ });

    return () => ac.abort();
  }, []);

  return count;
}
