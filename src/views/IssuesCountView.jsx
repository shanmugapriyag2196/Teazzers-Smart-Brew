import { useState, useEffect, useCallback } from 'react';
import { loadIssueCounts, CATEGORIES, ISSUES_UPSERT_URL, ISSUES_QUERY_URL } from '../components/ChatBot';
import './IssuesCountView.css';

// Category display labels
const DISPLAY = {
  'Power & Electrical Issues':  '⚡ Power & Electrical',
  'Brewing Issues':             '☕ Brewing',
  'Heating Issues':             '🔥 Heating',
  'Leaking Issues':             '💧 Leaking',
  'Configuration Issues':       '⚙️ Configuration',
  'Other Issues':               '📦 Other',
};

function timeAgo(ms) {
  if (!ms) return '';
  const s  = Math.floor((Date.now() - ms) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const COLOR_MAP = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444',
];

export default function IssuesCountView() {
  const [rows, setRows]   = useState(() => CATEGORIES.map(l => ({ label: l, count: 0, id: '', timestamp: 0 })));
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadIssueCounts();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll every 60 s so the table and chart stay live without a refresh
  useEffect(() => {
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const maxCount = Math.max(...rows.map(r => r.count), 1);

  return (
    <div className="issues-count-section">
      <div className="issues-count-header">
        <div>
          <h2>Issue Categories — Live Counts</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0' }}>
            Auto-classified from every user message in the AI Assistant.
            Updated in real-time from index <code>issues-count</code>.
          </p>
        </div>
        <button
          className="issues-count-badge"
          onClick={fetchData}
          disabled={loading}
          style={{ cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* ── Bar chart ─────────────────────────────────────────── */}
      <div className="bar-chart">
        {rows.map((row, i) => {
          const pct  = Math.round((row.count / maxCount) * 100);
          const disp = DISPLAY[row.label] || row.label;
          return (
            <div className="bar-row" key={row.label}>
              <div className="bar-label" title={row.label}>{disp}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: loading ? '0%' : `${pct}%`,
                    background: `linear-gradient(135deg, ${COLOR_MAP[i % COLOR_MAP.length]}, ${COLOR_MAP[(i + 1) % COLOR_MAP.length]})`,
                    transitionDelay: `${i * 60}ms`,
                  }}
                >
                  <span>{loading ? '—' : row.count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Data table ────────────────────────────────────────── */}
      <div className="table-wrap">
        <div className="table-caption">pinecone ▸ teazzers ▸ issue-count</div>
        <table className="issues-count-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Count</th>
              <th>Last Updated</th>
              <th>Record ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label}>
                <td style={{ fontWeight: 600 }}>{DISPLAY[row.label] || row.label}</td>
                <td>
                  <span className="count-pill">
                    <span className="count-number">{loading ? '—' : row.count}</span>
                  </span>
                </td>
                <td className="time-str">{fmtDate(row.timestamp)}</td>
                <td style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {row.id || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
