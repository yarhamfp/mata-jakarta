import { Grid3x3, LayoutGrid, Search, Square } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CAMS, NAV } from '../data';
import type { CamStatus } from '../types';
import { demoSpotOf } from '../demo';
import { prettyName } from '../format';
import { useLocalState } from '../hooks/useLocalState';
import CameraCard from '../components/CameraCard';
import DemoNotice from '../components/DemoNotice';
import PlayerModal from '../components/PlayerModal';
import Sidebar from '../components/Sidebar';

const DENSITY = { s: 220, m: 300, l: 440 } as const;
type Density = keyof typeof DENSITY;

interface Props {
  active: boolean;
  area: string;
  onArea: (k: string) => void;
  q: string;
  onQ: (v: string) => void;
  openId: string | null;
  onOpen: (id: string | null) => void;
  pins: string[];
  onPin: (id: string) => void;
}

export default function Cameras({ active, area, onArea, q, onQ, openId, onOpen, pins, onPin }: Props) {
  const [status, setStatus] = useState<Record<string, CamStatus>>({});
  const [density, setDensity] = useLocalState<Density>('cctvDensity', 'm');
  const [dataSaver, setDataSaver] = useLocalState('cctvSaver', false);
  const searchRef = useRef<HTMLInputElement>(null);

  const onStatus = useCallback((id: string, s: CamStatus) => {
    setStatus((cur) => (cur[id] === s ? cur : { ...cur, [id]: s }));
  }, []);

  const visibleIds = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return new Set(
      CAMS.filter((c) =>
        (area === 'all' || (area === 'demo' ? !!demoSpotOf(c) : c.area === area)) &&
        (!needle || `${c.name} ${prettyName(c)} ${c.area} ${c.cam}`.toLowerCase().includes(needle)) &&
        status[c.id] !== 'off',
      ).map((c) => c.id),
    );
  }, [q, area, status]);

  const vals = Object.values(status);
  const okCount = vals.filter((s) => s === 'ok').length;
  const offCount = vals.filter((s) => s === 'off').length;
  const openCam = CAMS.find((c) => c.id === openId) ?? null;

  const step = useCallback((dir: 1 | -1) => {
    const ids = CAMS.filter((c) => visibleIds.has(c.id)).map((c) => c.id);
    const i = openId ? ids.indexOf(openId) : -1;
    if (i >= 0 && ids.length) onOpen(ids[(i + dir + ids.length) % ids.length]);
  }, [visibleIds, openId, onOpen]);
  const close = useCallback(() => onOpen(null), [onOpen]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey || openId) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, openId]);

  const activeLabel = NAV.find((n) => n.key === area)?.label ?? 'Semua kamera';

  return (
    <div className="shell" hidden={!active}>
      <Sidebar items={NAV} active={area} onSelect={onArea} dataSaver={dataSaver} onDataSaver={setDataSaver} />

      <main>
        <DemoNotice />
        <div className="toolbar">
          <label className="search">
            <Search size={15} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={q}
              onChange={(e) => onQ(e.target.value)}
              placeholder="Cari lokasi, mis. Thamrin atau Gerbang Pemuda"
            />
            <kbd>/</kbd>
          </label>
          <span className="muted num grow">
            {activeLabel} · {visibleIds.size} kamera
            {okCount + offCount > 0 && <> · {okCount} aktif{offCount > 0 && `, ${offCount} offline`}</>}
          </span>
          <div className="seg" role="group" aria-label="Ukuran kartu">
            {([['s', Grid3x3, 'Kecil'], ['m', LayoutGrid, 'Sedang'], ['l', Square, 'Besar']] as const).map(([k, Icon, label]) => (
              <button key={k} className={density === k ? 'on' : ''} onClick={() => setDensity(k)} title={label} aria-label={label} aria-pressed={density === k}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid" style={{ '--min': `${DENSITY[density]}px` } as CSSProperties}>
          {CAMS.map((c) => (
            <CameraCard
              key={c.id}
              cam={c}
              hidden={!visibleIds.has(c.id)}
              spot={demoSpotOf(c)}
              paused={!active}
              pinned={pins.includes(c.id)}
              refreshMs={dataSaver ? 90000 : 30000}
              onOpen={onOpen}
              onPin={onPin}
              onStatus={onStatus}
            />
          ))}
        </div>
        {visibleIds.size === 0 && <div className="empty">Tidak ada kamera yang cocok dengan filter ini.</div>}
      </main>

      {active && openCam && (
        <PlayerModal
          key={openCam.id}
          cam={openCam}
          spot={demoSpotOf(openCam)}
          pinned={pins.includes(openCam.id)}
          onPin={() => onPin(openCam.id)}
          onClose={close}
          onStep={step}
        />
      )}
    </div>
  );
}
