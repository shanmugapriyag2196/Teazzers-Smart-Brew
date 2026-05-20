import { useState, useEffect, useCallback } from 'react';
import { loadRecentHistory, CATEGORIES } from '../components/ChatBot';
import './IssueCategoriesView.css';

// Category → pill class mapping
const CAT_CLASS = {
  'Power & Electrical Issues': 'cat-power',
  'Brewing Issues':            'cat-brewing',
  'Heating Issues':            'cat-heating',
  'Leaking Issues':            'cat-leaking',
  'Configuration Issues':      'cat-config',
  'Other Issues':              'cat-other',
};

export default function IssueCategoriesView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadRecentHistory(200);
      setHistory(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(fetchData, 60_000); return () => clearInterval(id);
  }, [fetchData]);

  function shortCategory(question) {
    const lower = question.toLowerCase();
    if (lower.includes('power') || lower.includes('electrical') || lower.includes('breaker') || lower.includes('outlet'))
      return 'Power & Electrical Issues';
    if (lower.includes('brew') || lower.includes('grinder') || lower.includes('grind'))
      return 'Brewing Issues';
    if (lower.includes('heat') || lower.includes('temperature') || lower.includes('boiler') || lower.includes('steam') || lower.includes('therm'))
      return 'Heating Issues';
    if (lower.includes('leak') || lower.includes('drip') || lower.includes('overflow') || lower.includes('water') || lower.includes('drain'))
      return 'Leaking Issues';
    if (lower.includes('config') || lower.includes('wifi') || lower.includes('setting') || lower.includes('setup') || lower.includes('network'))
      return 'Configuration Issues';
    return 'Other Issues';
  }

  function fmtDate(ms) {
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className="issue-view">
      <div className="page-header">
        <h2>Issue Categories</h2>
        <p>Detailed view of all reported issues across the Teazzers Smart Brew fleet.</p>
      </div>

      <p className="section-title" style={{ marginTop: 24 }}>
        Recent Questions and Responses from History
      </p>

      {loading ? (
        <div className="ic-loading">Loading questions from teazzers-history…</div>
      ) : history.length === 0 ? (
        <div className="ic-empty">No conversations recorded yet. Ask the AI Assistant a question to seed this list.</div>
      ) : (
        <div className="table-wrap">
          <div className="table-caption">
            pinecone ▸ teazzers ▸ teazzers-history
            <span className="ic-count-badge">{history.length} records</span>
          </div>
          <table className="ic-table">
            <thead>
              <tr>
                <th width="55">#</th>
                <th>Category</th>
                <th>Question</th>
                <th width="140">Answered On</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => {
                const cat   = shortCategory(item.question);
                const catCls = CAT_CLASS[cat] || 'cat-other';
                return (
                  <tr key={item.id || i}>
                    <td style={{ color: '#94a3b8', textAlign: 'center' }}>{i + 1}</td>
                    <td>
                      <span className={`ic-cat-pill ${catCls}`}>{cat}</span>
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.question}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{fmtDate(item.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
