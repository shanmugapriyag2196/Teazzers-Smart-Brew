import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { loadIssueCounts } from '../components/ChatBot';
import './DashboardView.css';

// ── Category definitions — identical order/labels to ChatBot.CATEGORIES ──────
const SEED_LABELS = [
  'Power & Electrical Issues',
  'Brewing Issues',
  'Heating Issues',
  'Leaking Issues',
  'Configuration Issues',
  'Other Issues',
];

const ICON = {
  'Power & Electrical Issues': '⚡',
  'Brewing Issues':            '☕',
  'Heating Issues':            '🔥',
  'Leaking Issues':            '💧',
  'Configuration Issues':      '⚙️',
  'Other Issues':              '📋',
};

const BADGE = {
  'Heating Issues': 'danger',
  'Leaking Issues': 'danger',
};

export default function DashboardView() {
  const { user } = useUser();
  const [rows, setRows] = useState(() =>
    SEED_LABELS.map(label => ({ label, count: 0, id: '', timestamp: 0 }))
  );
  const [isBoot, setIsBoot] = useState(true);   // true while first load is in-flight

  const fetchCounts = useCallback(() => {
    (async () => {
      try {
        const data = await loadIssueCounts();
        setTimeout(() => { setRows(data); setIsBoot(false); }, 0);
      } catch (e) {
        setTimeout(() => { setIsBoot(false); console.warn('[dashboard] loadIssueCounts failed:', e); }, 0);
      }
    })();
  }, []);

  // Load once on mount
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Poll every 60 s
  useEffect(() => {
    const id = setInterval(fetchCounts, 60_000); return () => clearInterval(id);
  }, [fetchCounts]);

  return (
    <div className="dashboard-view" style={{ padding: 0 }}>
      {/* ── Centred greeting + subtitle ───────────────────────────────────── */}
      <div className="dv-header">
        <div className="dv-header-mid">
          <h2>Welcome Back, {user?.name || 'Admin'}</h2>
          <p>Here's what's happening with your Teazzers Smart Brew system today.</p>
        </div>
      </div>

      {/* ── Boot overlay — only on first mount ────────────────────────────── */}
      {isBoot && (
        <div className="dv-loading">
          <div className="dv-spinner" />
          <span>Loading issue counts…</span>
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <p className="section-title">Issue Categories Overview</p>
      <div className="cards-grid">
        {rows.map((item) => {
          const badgeClass = BADGE[item.label] || 'warning';
          return (
            <div key={item.label} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">{item.label}</span>
                <span className="stat-card-icon">{ICON[item.label] || '📋'}</span>
              </div>
              <div className="stat-card-count">
                {isBoot ? '—' : item.count}
              </div>
              <div className="stat-card-footer">
                <span className={`stat-badge ${badgeClass}`}>
                  {isBoot ? '—' : 'up to date'}
                </span>
                <span>Active issues</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
