import type { Cam } from './types';

const OWNERS: Array<[RegExp, string]> = [
  [/^SATPOL\s?PP\s+/i, 'Satpol PP'],
  [/^POLDA\s+/i, 'Polda Metro'],
  [/^POLRI\s+/i, 'Polri'],
  [/^DISHUB\s+/i, 'Dishub'],
  [/^DBM\s+/i, 'Bina Marga'],
];
const KEEP = new Set(['DPR', 'MPR', 'UOB', 'JPO', 'PP', 'MH', 'KH', 'HI', 'DBM', 'S', 'M']);

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => {
      const bare = w.replace(/\.$/, '').toUpperCase();
      if (/^C\d+$/.test(bare) || KEEP.has(bare)) return bare + (w.endsWith('.') ? '.' : '');
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

export function ownerOf(cam: Cam): string | null {
  const n = cam.name.replace(/^(JKP|JKB)\s+/i, '');
  return OWNERS.find(([re]) => re.test(n))?.[1] ?? null;
}

export function prettyName(cam: Cam): string {
  let n = cam.name.replace(/^(JKP|JKB)\s+/i, '');
  for (const [re] of OWNERS) n = n.replace(re, '');
  n = n.replace(/-(C\d+)$/i, ' $1');
  return titleCase(n.trim());
}

export function shortArea(area: string): string {
  return area.replace(/\s*\(.*?\)\s*/g, '').trim();
}

export function camLabel(cam: Cam): string {
  return cam.cam.replace(/CCTV\s?/i, 'CCTV ').replace(/^CCTV\s0?(\d)$/, 'CCTV 0$1');
}
