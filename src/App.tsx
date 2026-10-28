import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BY_SHORT, CAMS, NAV_KEYS, SHORT, type View } from './data';
import { DEFAULT_PINS, usePins } from './hooks/usePins';
import { useTheme } from './hooks/useTheme';
import Footer from './components/Footer';
import Header from './components/Header';
import Home from './features/Home';

// Each feature is its own chunk: nothing below is downloaded until its menu is opened (or hovered).
const loaders = {
  kamera: () => import('./features/Cameras'),
  wall: () => import('./components/LiveWall'),
  macet: () => import('./features/Macet'),
};
const Cameras = lazy(loaders.kamera);
const LiveWall = lazy(loaders.wall);
const Macet = lazy(loaders.macet);
const prefetch = (v: View) => { if (v !== 'home') loaders[v](); };

const VIEWS = new Set<string>(['home', 'kamera', 'wall', 'macet']);

function readUrl() {
  const p = new URLSearchParams(location.search);
  const a = p.get('a');
  const c = p.get('c');
  const w = (p.get('w') ?? '').split(',').map((s) => BY_SHORT.get(s)).filter((x): x is string => !!x);
  const v = p.get('v');
  const view: View = v && VIEWS.has(v) ? (v as View) : w.length ? 'wall' : a || c || p.get('q') ? 'kamera' : 'wall';
  return {
    view,
    area: a && NAV_KEYS.has(a) ? a : 'all',
    q: p.get('q') ?? '',
    open: c ? BY_SHORT.get(c) ?? null : null,
    wall: w,
  };
}

export default function App() {
  const [init] = useState(readUrl);
  const [view, setView] = useState<View>(init.view);
  const [area, setArea] = useState(init.area);
  const [q, setQ] = useState(init.q);
  const [openId, setOpenId] = useState<string | null>(init.open);
  // Cameras stays mounted after the first visit so snapshots are not re-fetched when switching menus.
  const [camerasSeen, setCamerasSeen] = useState(init.view === 'kamera');
  const { pins, toggle } = usePins(init.wall.length ? init.wall : undefined);
  const { theme, toggle: toggleTheme } = useTheme();

  const go = useCallback((v: View, nextArea?: string) => {
    if (v === 'home') { setQ(''); setArea('all'); }
    if (nextArea) { setArea(nextArea); setQ(''); }
    if (v !== 'kamera') setOpenId(null);
    if (v === 'kamera') setCamerasSeen(true);
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);

  // keep the address bar shareable: menu, filter, search, open camera, and wall
  useEffect(() => {
    const p = new URLSearchParams();
    if (view !== 'wall') p.set('v', view); // Live Wall adalah tampilan awal, jadi alamat utamanya tidak perlu parameter
    if (view === 'kamera') {
      if (area !== 'all') p.set('a', area);
      if (q) p.set('q', q);
      if (openId) p.set('c', SHORT.get(openId)!);
    }
    if (view === 'wall' && pins.length && pins !== DEFAULT_PINS) p.set('w', pins.map((id) => SHORT.get(id)).filter(Boolean).join(','));
    const s = p.toString();
    history.replaceState(null, '', s ? `?${s}` : location.pathname);
  }, [view, area, q, openId, pins]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey || openId) return;
      if (e.key.toLowerCase() === 'w') go(view === 'wall' ? 'kamera' : 'wall');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, openId, go]);

  const fallback = <div className="page"><div className="empty">Memuat…</div></div>;

  return (
    <>
      <Header view={view} pinCount={pins.length} theme={theme} onTheme={toggleTheme} onNav={go} onPrefetch={prefetch} />

      {view === 'home' && <Home pinCount={pins.length} onOpen={go} onPrefetch={prefetch} />}

      {camerasSeen && (
        <Suspense fallback={view === 'kamera' ? fallback : null}>
          <Cameras
            active={view === 'kamera'}
            area={area} onArea={setArea}
            q={q} onQ={setQ}
            openId={openId} onOpen={setOpenId}
            pins={pins} onPin={toggle}
          />
        </Suspense>
      )}

      {view === 'wall' && (
        <Suspense fallback={fallback}>
          <div className="page wide">
            <LiveWall cams={pins.map((id) => CAMS.find((c) => c.id === id)).filter((c): c is (typeof CAMS)[number] => !!c)} onRemove={toggle} onExit={() => go('kamera')} />
          </div>
        </Suspense>
      )}

      {view === 'macet' && (
        <Suspense fallback={fallback}>
          <Macet theme={theme} />
        </Suspense>
      )}

      <div className="page"><Footer /></div>
    </>
  );
}
