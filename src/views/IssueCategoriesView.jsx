import { useState, useEffect, useCallback } from 'react';
import { loadRecentHistory } from '../components/ChatBot';
import './IssueCategoriesView.css';

const DOT_COLOR = {
  'Power & Electrical Issues': '#f97316',
  'Brewing Issues':            '#14b8a6',
  'Heating Issues':            '#ef4444',
  'Leaking Issues':            '#6366f1',
  'Configuration Issues':      '#8b5cf6',
  'Other Issues':              '#94a3b8',
};

const ICON = {
  'Power & Electrical Issues': '⚡',
  'Brewing Issues':            '☕',
  'Heating Issues':            '🔥',
  'Leaking Issues':            '💧',
  'Configuration Issues':      '⚙',
  'Other Issues':              '📋',
};

const PILL_CLS = {
  'Power & Electrical Issues': 'cat-power',
  'Brewing Issues':            'cat-brewing',
  'Heating Issues':            'cat-heating',
  'Leaking Issues':            'cat-leaking',
  'Configuration Issues':      'cat-config',
  'Other Issues':              'cat-other',
};

// Fixed card order — always all 6 boxes, empty ones hidden
const ORDER = [
  'Heating Issues',
  'Power & Electrical Issues',
  'Leaking Issues',
  'Brewing Issues',
  'Configuration Issues',
  'Other Issues',
];

export default function IssueCategoriesView() {
  const [cats, setCats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadRecentHistory(200);
      const groups = {};
      for (const item of list) {
        const lbl = classify(item.question);
        (groups[lbl] ||= []).push(item);
      }
      setCats(groups);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(fetchData, 60_000); return () => clearInterval(id);
  }, [fetchData]);

  function classify(q) {
    const l = q.toLowerCase();
    if (l.includes('power') || l.includes('electrical') || l.includes('breaker') || l.includes('outlet'))
      return 'Power & Electrical Issues';
    if (l.includes('brew') || l.includes('grinder') || l.includes('grind'))
      return 'Brewing Issues';
    if (l.includes('heat') || l.includes('temperature') || l.includes('boiler') || l.includes('steam') || l.includes('therm'))
      return 'Heating Issues';
    if (l.includes('leak') || l.includes('drip') || l.includes('overflow') || l.includes('water') || l.includes('drain'))
      return 'Leaking Issues';
    if (l.includes('config') || l.includes('wifi') || l.includes('setting') || l.includes('setup') || l.includes('network'))
      return 'Configuration Issues';
    return 'Other Issues';
  }

  function fmtDate(ms) {
    if (!ms) return '';
    return new Date(ms).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="icv">
      <div className="icv-header">
        <h2>Issue Categories</h2>
        <p>Questions asked in the AI Assistant, grouped by auto-detected category.</p>
      </div>

      {loading ? (
        <div className="icv-loading">Loading questions from teazzers-history…</div>
      ) : ORDER.every(l => !cats[l]?.length) ? (
        <div className="icv-empty">No conversations recorded yet. Ask the AI Assistant a question to seed this list.</div>
      ) : (
        <div className="icv-grid">
          {ORDER.filter(l => (cats[l] || []).length).map(label => {
            const items  = cats[label] || [];
            const icon   = ICON[label] || '📋';
            const dot    = DOT_COLOR[label] || '#94a3b8';
            const pillCls = PILL_CLS[label] || 'cat-other';

            return (
              <div
                key={label}
                className="icv-card"
                style={{ '--dot': dot }}
              >
                <div className="icv-card-head">
                  <span className={`icv-pill ${pillCls}`}>
                    {icon} {label}
                  </span>
                  <span className="icv-badge">{items.length}</span>
                </div>
                <div className="icv-rows">
                  {items.map((item, i) => (
                    <div key={item.id || i} className="icv-row">
                      <span className="icv-dot" />
                      <div className="icv-q">{item.question}</div>
                      <div className="icv-dt">{fmtDate(item.timestamp)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
