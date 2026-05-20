import { useState, useEffect, useRef, useCallback } from 'react';
import './ChatBot.css';

// ── Pinecone configuration ──────────────────────────────────────────────
const HISTORY_NS = 'default';

const HISTORY_HOST =
  import.meta.env.VITE_PINECONE_HISTORY_HOST ||
  'teazzers-history-vbgqbnq.svc.aped-4627-b74a.pinecone.io';

const HISTORY_INDEX_URL  = `https://${HISTORY_HOST}`;
const HISTORY_QUERY_URL  = `${HISTORY_INDEX_URL}/query`;
const HISTORY_UPSERT_URL = `${HISTORY_INDEX_URL}/vectors/upsert`;
const HISTORY_DELETE_URL = `${HISTORY_INDEX_URL}/vectors/delete`;

// ── Pinecone issues-count config ─────────────────────────────────────────
const ISSUES_NS   = 'default';
const ISSUES_HOST =
  import.meta.env.VITE_ISSUES_COUNT_HOST ||
  'issues-count-vbgqbnq.svc.aped-4627-b74a.pinecone.io';
const ISSUES_INDEX_URL  = `https://${ISSUES_HOST}`;
const ISSUES_QUERY_URL  = `${ISSUES_INDEX_URL}/query`;
const ISSUES_UPSERT_URL = `${ISSUES_INDEX_URL}/vectors/upsert`;

const EMBED_MODEL   = 'text-embedding-3-small';
const EMBED_DIM     = 1536;
const EMBED_URL     = 'https://api.openai.com/v1/embeddings';
const HISTORY_LIMIT = 20;

// 6 canonical issue categories (must match teazzers-data RAG documents)
const CATEGORIES = [
  'Power & Electrical Issues',
  'Brewing Issues',
  'Heating Issues',
  'Leaking Issues',
  'Configuration Issues',
  'Other Issues',
];

// ── Assistant (RAG) — same endpoint as before ───────────────────────────
const ASSISTANT_NAME = 'teazzers-data';
const ASSISTANT_URL  = `https://prod-1-data.ke.pinecone.io/assistant/chat/${ASSISTANT_NAME}`;

// ── Helpers ─────────────────────────────────────────────────────────────
function headers() {
  return {
    'Api-Key':                 import.meta.env.VITE_PINECONE_API_KEY,
    'Content-Type':            'application/json',
    'X-Pinecone-Api-Version':  '2025-10',
  };
}

function oaHeaders() {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function getEmbedding(text) {
  const r = await fetch(EMBED_URL, {
    method: 'POST',
    headers: oaHeaders(),
    body: JSON.stringify({ input: text, model: EMBED_MODEL, dimensions: EMBED_DIM }),
  });
  if (!r.ok) throw new Error(`Embedding error ${r.status}`);
  const d = await r.json();
  return (d.data?.[0]?.embedding) || [];
}

// ── teazzers-history helpers ────────────────────────────────────────────
async function saveToHistory(question, answer) {
  try {
    const embedding = await getEmbedding(question);
    if (!embedding.length) { console.warn('[history] saveToHistory: empty embedding — upsert skipped'); return; }

    const vecId  = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tsMs   = Date.now();
    const dateStr = new Date(tsMs).toISOString();
    const payload = {
      namespace: HISTORY_NS,
      vectors: [
        {
          id:         vecId,
          values:     embedding,
          metadata: {
            id:            vecId,
            embeddedBody:  JSON.stringify(embedding),   // store raw vector so query can do in-process cosine
            question,
            answer,
            timestamp:     tsMs,
            timestamp_type: 'unix_ms',
            dateStr,
          },
        },
      ],
    };
    console.log('[history] saveToHistory upserting →', HISTORY_UPSERT_URL, '| id=', vecId, '| dim=', embedding.length);

    const r = await fetch(HISTORY_UPSERT_URL, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error(`[history] upsert FAILED ${r.status}:`, t.slice(0, 500));
    } else {
      console.log('[history] upsert OK   id=', vecId);
    }
  } catch (e) {
    console.error('[history] saveToHistory error:', e);
  }
}

async function loadRecentHistory(limit = HISTORY_LIMIT) {
  try {
    // Pull with a large topK so cosine similarity never silently prunes results.
    const queryVec = await getEmbedding('support history recent');
    if (!queryVec.length) { console.warn('[history] query embedding: empty vector — query SKIPPED'); return []; }

    const r = await fetch(HISTORY_QUERY_URL, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector:         queryVec,
        topK:           10000,          // index is small; one-shot full pull
        namespace:      HISTORY_NS,
        includeMetadata: true,
        includeValues:   false,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error(`[history] query HTTP ${r.status}:`, t.slice(0, 500));
      return [];
    }

    const data    = await r.json();
    const matches = (data.matches || []).filter(m => m && m.metadata);

    console.log('[history] query OK — raw matches=', (data.matches || []).length,
                'after metadata filter=', matches.length,
                'topK=10000');

    if (!matches.length) {
      console.warn('[history] query returned 0 records with metadata.');
      return [];
    }

    // Sort newest-first by timestamp, then take the latest `limit`
    matches.sort((a, b) => (b.metadata.timestamp || 0) - (a.metadata.timestamp || 0));

    return matches.slice(0, limit).map((m, i) => {
      const md = m.metadata || {};
      return {
        id:        md.id || `hist_${i}`,
        question:  md.question || '—',
        answer:    md.answer   || md.answer_text || '',
        timestamp: md.timestamp || 0,
      };
    });
  } catch (e) {
    console.error('[history] loadRecentHistory error:', e);
    return [];
  }
}

/**
 * Delete a single history record from teazzers-history by its Pinecone vecId.
 * Silent-no-op if the id is absent or the delete API returns an error.
 */
async function deleteHistoryItem(vecId) {
  if (!vecId) return;
  try {
    const r = await fetch(HISTORY_DELETE_URL, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        namespace: HISTORY_NS,
        ids:       [vecId],
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.warn(`[history] delete FAILED ${r.status} id=`, vecId, t.slice(0, 300));
    } else {
      console.log('[history] delete OK   id=', vecId);
    }
  } catch (e) {
    console.warn('[history] delete error:', e);
  }
}

// ── issues-count helpers ──────────────────────────────────────────────────

/**
 * Ask GPT to map a user question to one of the 6 canonical categories.
 * Returns a plain string, e.g. "Heating Issues".
 */
async function classifyIssue(question) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: oaHeaders(),
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: `You are a support-ticket classifier for a Teazzers SmartBrew coffee machine.
Reply with ONLY the category label that best matches the user's question.
Choose exactly one of these 6 labels — nothing else, no extra text:

1. Power & Electrical Issues
2. Brewing Issues
3. Heating Issues
4. Leaking Issues
5. Configuration Issues
6. Other Issues`,
      }, {
        role: 'user',
        content: question,
      }],
      max_tokens: 12,
      temperature: 0,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    console.warn(`[issues] classify HTTP ${r.status}:`, t.slice(0, 300));
    return 'Other Issues';
  }
  const d    = await r.json();
  const raw  = d?.choices?.[0]?.message?.content?.trim() || 'Other Issues';
  // Sanitise: force-clean to one of the 6 known labels
  return CATEGORIES.includes(raw)
    ? raw
    : CATEGORIES.find(c => raw.toLowerCase().includes(c.split(' ')[0].toLowerCase()))
      || 'Other Issues';
}

/**
 * Upsert a single record for `label` into the issues-count index.
 * The record stores the cumulative `count` so time-series is one record per
 * category per request, sorted newest-first by `timestamp`.
 */
async function saveIssueCount(label) {
  try {
    const embedding = await getEmbedding(label);
    if (!embedding.length) { console.warn('[issues] saveIssueCount: empty embedding — upsert skipped'); return; }

    const vecId  = `ic_${label.replace(/\s+/g, '_')}_${Date.now()}`;
    const tsMs   = Date.now();
    const dateStr = new Date(tsMs).toISOString();

    const payload = {
      namespace: ISSUES_NS,
      vectors: [
        {
          id:         vecId,
          values:     embedding,
          metadata: {
            id:            vecId,
            label,
            count:         1,
            timestamp:     tsMs,
            timestamp_type: 'unix_ms',
            dateStr,
          },
        },
      ],
    };

    const r = await fetch(ISSUES_UPSERT_URL, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error(`[issues] upsert FAILED ${r.status}:`, t.slice(0, 500));
    } else {
      console.log('[issues] upsert OK   id=', vecId, 'label=', label);
    }
  } catch (e) {
    console.error('[issues] saveIssueCount error:', e);
  }
}

/**
 * Pull all issue-count records from the issues-count index and return the
 * latest cumulative count for each of the 6 canonical categories.
 *
 * Strategy: topK=10000 one-shot full pull, then locally group+reduce.
 * We keep only the record with the largest `count` per `label` (it grows
 * monotonically as more questions arrive for that category).
 */
async function loadIssueCounts() {
  try {
    const queryVec = await getEmbedding('support ticket issue classification');
    if (!queryVec.length) { console.warn('[issues] loadIssueCounts: empty query embedding — returning zeros'); return CATEGORIES.map(l => ({ label: l, count: 0, id: '', timestamp: 0 })); }

    const r = await fetch(ISSUES_QUERY_URL, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector:         queryVec,
        topK:           10000,
        namespace:      ISSUES_NS,
        includeMetadata: true,
        includeValues:   false,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error(`[issues] loadIssueCounts HTTP ${r.status}:`, t.slice(0, 500));
      return CATEGORIES.map(l => ({ label: l, count: 0, id: '', timestamp: 0 }));
    }

    const data    = await r.json();
    const matches = (data.matches || []).filter(m => m && m.metadata);

    console.log('[issues] loadIssueCounts OK — matches=', matches.length);

    // Collect the **latest** record (highest count) per label
    const latest = {};
    for (const m of matches) {
      const md   = m.metadata || {};
      const lbl  = md.label  || CATEGORIES[0];
      const cnt  = Number(md.count) || 1;
      const ts   = md.timestamp || 0;
      if (!(lbl in latest) || ts > latest[lbl].timestamp) {
        latest[lbl] = { label: lbl, count: cnt, id: m.id, timestamp: ts };
      }
    }

    // Return exactly CATEGORIES, filling missing rows with count=0
    return CATEGORIES.map(label => latest[label] || { label, count: 0, id: '', timestamp: 0 });
  } catch (e) {
    console.error('[issues] loadIssueCounts error:', e);
    return CATEGORIES.map(l => ({ label: l, count: 0, id: '', timestamp: 0 }));
  }
}

// ── exports for IssuesCountView + IssueCategoriesView ───────────────────
export { classifyIssue, saveIssueCount, loadIssueCounts, loadRecentHistory, CATEGORIES, ISSUES_HOST, ISSUES_UPSERT_URL, ISSUES_QUERY_URL };

// ── Helper: safe error string ───────────────────────────────────────────
function safeErr(e) {
  if (!e) return 'Unknown error';
  return typeof e === 'object' ? (e.message || JSON.stringify(e)) : String(e);
}

// ── ChatBot component ───────────────────────────────────────────────────
export default function ChatBot({ selectedIssue }) {
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState(null);
  const [expanded,      setExpanded]      = useState({});
  const [recentHistory, setRecentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const messagesEndRef   = useRef(null);
  const messagesRef      = useRef([]);

  // keep ref in sync with state after every render
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const API_KEY = import.meta.env.VITE_PINECONE_API_KEY;

  // Auto-scroll on every message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: "Hello! I'm your Teazzers Smart Brew assistant. Ask me anything about troubleshooting, maintenance, or configuration." }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Category shortcut from dashboard card click
  useEffect(() => {
    if (selectedIssue) {
      const issueMessages = {
        'power-electrical': "I see you're interested in Power & Electrical Issues. What specific problem are you experiencing?",
        'brewing':           "I see you're interested in Brewing Issues. Tell me more about your brewing concerns.",
        'heating':           "I see you're interested in Heating Issues. Please describe the heating problem you're facing.",
        'leaking':           "I see you're interested in Leaking Issues. Where do you notice the leak?",
        'configuration':     "I see you're interested in Configuration Issues. What settings are you trying to configure?",
        'servicing-maintenance': "I see you're interested in Servicing & Maintenance. What maintenance task do you need help with?",
      };
      const botMessage = { role: 'assistant', content: issueMessages[selectedIssue] || "How can I help you with your Teazzers Smart Brew?" };
      setMessages(prev => [...prev, botMessage]);
    }
  }, [selectedIssue]);

  // Load live history every time AI Assistant tab is mounted / focused
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      try {
        const list = await loadRecentHistory();
        if (!cancelled) setRecentHistory(list);
      } catch (e) {
        console.warn('Failed to load history:', safeErr(e));
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Helper: format a timestamp relative to now ───────────────────────
  function timeAgo(ms) {
    if (!ms) return '';
    const secs  = Math.floor((Date.now() - ms) / 1000);
    if (secs < 60)   return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
    if (secs < 86400)return `${Math.floor(secs / 3600)} hr ago`;
    return `${Math.floor(secs / 86400)} day ago`;
  }

  // ── Restore a history item into the conversation ─────────────────────
  // Shows BOTH question + answer instantly from the Pinecone record —
  // no network round-trip, no "Thinking…" spinner.
  const onHistoryItemClick = useCallback((item) => {
    setActiveHistoryId(item.id);
    const fullAnswer = item.answer || 'No answer found.';
    setMessages([
      { role: 'user',      content: item.question },
      { role: 'assistant', content: fullAnswer },
    ]);
    messagesRef.current = [
      { role: 'user',      content: item.question },
      { role: 'assistant', content: fullAnswer },
    ];    // keep ref in sync synchronously
    setInput('');
  }, [API_KEY]);

  // ── Delete a history record from teazzers-history ────────────────────
  const onHistoryDelete = useCallback(async (e, vecId) => {
    e.stopPropagation();             // don't also trigger onHistoryItemClick
    await deleteHistoryItem(vecId);
    // Remove from sidebar immediately; re-fetch to stay consistent
    setRecentHistory(prev => prev.filter(item => item.id !== vecId));
    loadRecentHistory().then(setRecentHistory).catch(() => {});
  }, []);

  // ── Send new question ────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input.trim() };
    setInput('');
    setIsLoading(true);
    setError(null);
    setMessages(prev => [...prev, userMessage]);
    messagesRef.current = [...messagesRef.current, userMessage]; // keep ref in sync synchronously
    setExpanded(prev => ({ ...prev, [prev.length]: false }));

    if (!API_KEY) {
      const errMsg = 'PINECONE_API_KEY is not configured in Vercel environment variables.';
      setError(errMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: `Configuration error: ${errMsg}` }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Api-Key': API_KEY,
          'Content-Type': 'application/json',
          'X-Pinecone-Api-Version': '2025-10',
        },
      body: JSON.stringify({
        messages: messagesRef.current.map(m => ({ role: m.role, content: m.content })),
        model: 'gpt-4o',
        stream: false,
      }),
      });

      if (!response.ok) {
        let detail = `${response.status} ${response.statusText}`;
        try { const er = await response.json(); er.error && (detail = er.error); } catch { /* ignore */ }
        throw new Error(detail);
      }

      const data   = await response.json();
      const answer = data?.message?.content || 'Sorry, I could not process that.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);

      // Save to teazzers-history in background — don't block UI
      saveToHistory(userMessage.content, answer).catch(e => console.warn('[history] save failed', e));
      // Classify issue type and increment counter in issues-count index
      classifyIssue(userMessage.content)
        .then(label => saveIssueCount(label))
        .catch(e => console.warn('[issues] classify/save failed', e));
      // Refresh history sidebar
      loadRecentHistory().then(setRecentHistory).catch(() => {});
    } catch (err) {
      console.error('ChatBot Error:', err);
      const msg = safeErr(err);
      setError(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: `Connection error: ${msg}. Please contact support at support.teazzers.com.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (index) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Teazzers Assistant</h3>
        <div className="chatbot-status">{isLoading ? 'Thinking...' : 'Online'}</div>
      </div>

      <div className="chatbot-body">
        {/* Left — Recent History from teazzers-history */}
        <div className="chat-history-sidebar">
          <div className="chat-history-header">Recent History</div>
          {loadingHistory ? (
            <div className="chat-history-loading">Loading…</div>
          ) : recentHistory.length === 0 ? (
            <div className="chat-history-empty">No conversations yet</div>
          ) : (
            <div className="chat-history-list">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  className={`chat-history-item${activeHistoryId === item.id ? ' active' : ''}`}
                >
                  <button
                    className="chat-history-item-main"
                    onClick={() => onHistoryItemClick(item)}
                  >
                    <div className="hist-query">{item.question}</div>
                    <div className="hist-time">{timeAgo(item.timestamp)}</div>
                  </button>
                  <button
                    className="chat-history-delete-btn"
                    title="Delete this conversation"
                    onClick={(e) => onHistoryDelete(e, item.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Live conversation */}
        <div className="chat-messages-panel">
          <div className="chatbot-messages" ref={messagesEndRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className={`message-content ${msg.role}`}>{msg.content}</div>
                {msg.role === 'assistant' && msg.content.length > 300 && !expanded[index] && (
                  <button className="more-btn" onClick={() => toggleExpand(index)}>More</button>
                )}
                {msg.role === 'assistant' && expanded[index] && (
                  <button className="more-btn" onClick={() => toggleExpand(index)}>Show less</button>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content assistant">Thinking<span className="typing-dots">…</span></div>
              </div>
            )}
          </div>

          <form className="chatbot-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about troubleshooting, maintenance, or configuration…"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
