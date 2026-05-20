import { useState, useEffect, useCallback, useRef } from 'react';
import { loadIssueCounts } from '../components/ChatBot';
import './DashboardView.css';

// ── Static seed — one entry per stat-card in the Dashboard grid
const SEED = [
  { id: 'power',   label: 'Power & Electrical Issues', icon: '⚡', trend: '—' },
  { id: 'brewing', label: 'Brewing Issues',            icon: '☕', trend: '—' },
  { id: 'heating', label: 'Heating Issues',            icon: '🔥', trend: '—' },
  { id: 'leaking', label: 'Leaking Issues',            icon: '💧', trend: '—' },
  { id: 'config',  label: 'Configuration Issues',      icon: '⚙️', trend: '—' },
  { id: 'other',   label: 'Other Issues',              icon: '📋', trend: '—' },
];

export default function DashboardView() {
  const [issueData, setIssueData] = useState(SEED);
  const prevRef                   = useRef(null);   // count snapshot for trend

  const fetchCounts = useCallback(async () => {
    const before = prevRef.current;                // counts at start of this tick

    try {
      const rows = await loadIssueCounts();

      setIssueData(prev => {
        const snap = {};           // count snapshot for this tick → becomes next tick's `before`
        return prev.map(seed => {
          const row   = rows.find(r => r.label === seed.label);
          const lbl   = seed.label;
          const count = row ? row.count : 0;
          snap[lbl]   = count;
          // heating & leaking are explicitly dangerous
          const badge = (seed.id === 'heating' || seed.id === 'leaking') ? 'danger' : 'warning';
          const trend = (before && typeof before[lbl] === 'number')
            ? ((count - before[lbl]) >= 0 ? '+' : '') + (count - before[lbl])
            : '—';
          return { ...seed, count, trend, badge };
        });
      });

      // snapshot for next poll
      prevRef.current = Object.fromEntries(rows.map(r => [r.label, r.count]));
    } catch (e) {
      console.warn('[dashboard] loadIssueCounts failed:', e);
    }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => {
    const id = setInterval(fetchCounts, 60_000); return () => clearInterval(id);
  }, [fetchCounts]);

  return (
    <div className="dashboard-view" style={{ padding: 0 }}>
      <div className="page-header">
        <h2>Welcome Back, Admin</h2>
        <p>Here's what's happening with your Teazzers Smart Brew system today.</p>
      </div>

      <p className="section-title">Issue Categories Overview</p>
      <div className="cards-grid">
        {issueData.map((item) => (
          <div key={item.id} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">{item.label}</span>
              <span className="stat-card-icon">{item.icon}</span>
            </div>
            <div className="stat-card-count">{item.count}</div>
            <div className="stat-card-footer">
              <span className={`stat-badge ${item.badge || 'warning'}`}>{item.trend} today</span>
              <span>Active issues</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
