// preview.jpg is slow (~7s each), so cap concurrent loads.
const MAX_CONCURRENT = 8;
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

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    start = () => {
      started = true;
      active++;
      img = new Image();
      const finish = () => { active--; pump(); };
      img.onload = () => { finish(); if (!cancelled) resolve(img!); };
      img.onerror = () => { finish(); reject(new Error('load failed')); };
      img.src = url;
    };
    pending.push(start);
    pump();
  });

  const cancel = () => {
    cancelled = true;
    if (!started) {
      const i = pending.indexOf(start);
      if (i >= 0) pending.splice(i, 1);
    }
  };
  return { promise, cancel };
}
