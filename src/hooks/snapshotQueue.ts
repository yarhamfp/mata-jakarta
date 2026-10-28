// preview.jpg is slow (~7s each), so cap concurrent loads.
const MAX_CONCURRENT = 8;
// Server yang menerima koneksi tapi tidak menjawab tidak boleh menahan slot selamanya.
const TIMEOUT_MS = 20_000;
let active = 0;
const pending: Array<() => void> = [];

function pump() {
  while (active < MAX_CONCURRENT && pending.length) pending.shift()!();
}

export function loadImage(url: string): { promise: Promise<HTMLImageElement>; cancel: () => void } {
  let cancelled = false;
  let started = false;
  let img: HTMLImageElement | null = null;
  let start!: () => void;
  let settle: () => void = () => {};

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    start = () => {
      started = true;
      active++;
      const el = (img = new Image());
      let done = false;
      let timer = 0;
      // dipanggil tepat sekali: melepas slot dan menghentikan unduhan yang masih berjalan
      settle = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        el.onload = el.onerror = null;
        active--;
        pump();
      };
      el.onload = () => { settle(); if (!cancelled) resolve(el); };
      el.onerror = () => { settle(); reject(new Error('load failed')); };
      timer = window.setTimeout(() => { settle(); el.src = ''; reject(new Error('timeout')); }, TIMEOUT_MS);
      el.src = url;
    };
    pending.push(start);
    pump();
  });

  const cancel = () => {
    cancelled = true;
    if (!started) {
      const i = pending.indexOf(start);
      if (i >= 0) pending.splice(i, 1);
    } else if (img) {
      img.src = '';
      settle();
    }
  };
  return { promise, cancel };
}
