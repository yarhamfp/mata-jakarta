import { Flag, LayoutList } from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  count: number;
  demo?: boolean;
}

interface Props {
  items: NavItem[];
  active: string;
  onSelect: (key: string) => void;
  dataSaver: boolean;
  onDataSaver: (v: boolean) => void;
}

export default function Sidebar({ items, active, onSelect, dataSaver, onDataSaver }: Props) {
  const top = items.filter((i) => i.key === 'all' || i.key === 'demo');
  const areas = items.filter((i) => i.key !== 'all' && i.key !== 'demo');

  const row = (i: NavItem) => (
    <button key={i.key} className={`nav-item${active === i.key ? ' active' : ''}${i.demo ? ' demo' : ''}`} onClick={() => onSelect(i.key)}>
      {i.key === 'demo' ? <Flag size={14} aria-hidden="true" /> : i.key === 'all' ? <LayoutList size={14} aria-hidden="true" /> : null}
      <span className="nav-label">{i.label}</span>
      <span className="num count">{i.count}</span>
    </button>
  );

  return (
    <aside className="sidebar">
      <nav aria-label="Filter kamera">
        <div className="nav-group">{top.map(row)}</div>
        <div className="nav-title">Area</div>
        <div className="nav-group">{areas.map(row)}</div>
      </nav>

      <div className="side-foot">
        <label className="switch">
          <input type="checkbox" checked={dataSaver} onChange={(e) => onDataSaver(e.target.checked)} />
          <span className="track" />
          <span>
            Hemat data
            <small>Snapshot diperbarui tiap 90 detik, bukan 30</small>
          </span>
        </label>
      </div>
    </aside>
  );
}
