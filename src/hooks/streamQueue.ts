// Memulai beberapa stream sekaligus justru memperlambat semuanya saat server sumber sedang ramai.
// Slot ini membatasi berapa stream yang boleh sedang "menghubungkan" pada saat yang sama.
const MAX_CONNECTING = 2;
// Pengaman: slot yang tidak pernah dilepas (koneksi menggantung) tidak boleh menahan stream lain selamanya.
const HOLD_MS = 25_000;

let busy = 0;
const waiting: Array<() => void> = [];

function pump() {
  while (busy < MAX_CONNECTING && waiting.length) waiting.shift()!();
}

export function acquireSlot(): { ready: Promise<void>; release: () => void } {
  let state: 'waiting' | 'held' | 'done' = 'waiting';
  let timer = 0;
  let start!: () => void;

  function release() {
    if (state === 'held') {
      busy--;
      clearTimeout(timer);
      state = 'done';
      pump();
    } else if (state === 'waiting') {
      const i = waiting.indexOf(start);
      if (i >= 0) waiting.splice(i, 1);
      state = 'done';
    }
  }

  const ready = new Promise<void>((resolve) => {
    start = () => {
      state = 'held';
      busy++;
      timer = window.setTimeout(release, HOLD_MS);
      resolve();
    };
    waiting.push(start);
    pump();
  });

  return { ready, release };
}
