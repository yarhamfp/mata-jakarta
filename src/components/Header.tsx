import { Camera, House, Moon, Navigation, Star, Sun } from 'lucide-react';
import type { ComponentType } from 'react';
import type { View } from '../data';

interface Props {
  view: View;
  pinCount: number;
  theme: 'light' | 'dark';
  onTheme: () => void;
  onNav: (v: View) => void;
  onPrefetch: (v: View) => void;
}

const ITEMS: Array<{ view: View; label: string; Icon: ComponentType<{ size?: number }>; mobileOnly?: boolean }> = [
  { view: 'home', label: 'Beranda', Icon: House },
  { view: 'kamera', label: 'Pantau CCTV', Icon: Camera },
  { view: 'wall', label: 'Live Wall', Icon: Star },
  { view: 'macet', label: 'Hindari Macet', Icon: Navigation },
];

export default function Header({ view, pinCount, theme, onTheme, onNav, onPrefetch }: Props) {
  return (
    <header className="topbar">
      <a
        className="brand"
        href={location.pathname}
        aria-label="Mata Jakarta, ke Live Wall"
        onClick={(e) => {
          // plain click resets the view in place; modified clicks keep the normal "open in new tab" behaviour
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          onNav('wall');
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="var(--text)" />
          <circle cx="16" cy="16" r="6.5" fill="none" stroke="var(--bg)" strokeWidth="2.2" />
          <circle cx="16" cy="16" r="2.4" fill="var(--demo)" />
        </svg>
        <span className="brand-name">Mata Jakarta</span>
      </a>

      <nav className="menu" aria-label="Menu utama">
        {ITEMS.map(({ view: v, label, Icon, mobileOnly }) => (
          <button
            key={v}
            className={`menu-item${view === v ? ' active' : ''}${mobileOnly ? ' mobile-only' : ''}`}
            onClick={() => onNav(v)}
            onMouseEnter={() => onPrefetch(v)}
            onFocus={() => onPrefetch(v)}
            aria-current={view === v ? 'page' : undefined}
          >
            <Icon size={16} />
            <span>{label}</span>
            {v === 'wall' && pinCount > 0 && <span className="num count">{pinCount}</span>}
          </button>
        ))}
      </nav>

      <div className="grow" />
      <button className="ibtn" onClick={onTheme} title="Ganti tema" aria-label="Ganti tema">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  );
}
