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

const EMBED_MODEL   = 'text-embedding-3-small';
const EMBED_URL     = 'https://api.openai.com/v1/embeddings';
const HISTORY_LIMIT = 20;

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

function historyHeaders() {
  return {
    'Api-Key': import.meta.env.VITE_PINECONE_API_KEY,
    'Content-Type': 'application/json',
  };
}

function oaHeaders() {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function getEmbedding(text) {
  const url  = EMBED_URL;
  const body = JSON.stringify({ input: text, model: EMBED_MODEL });
  const r = await fetch(url, { method: 'POST', headers: oaHeaders(), body });
  if (!r.ok) { const t = await r.text(); throw new Error(`Embedding ${r.status}: ${t.slice(0,100)}`); }
  const d = await r.json();
  return (d?.data?.[0]?.embedding) || [];
}

async function saveToHistory(question, answer) {
  try {
    const embedding = await getEmbedding(question);
    if (!embedding.length) { alert('[history] saveToHistory: empty embedding — check VITE_OPENAI_API_KEY in Vercel\n\nThis means OpenAI returned no vector data. Check:\n1. VITE_OPENAI_API_KEY is set in Vercel Production env vars\n2. The key has embeddings:read scope\n3. The model text-embedding-3-small produces 1536-dim vectors — see .env.example for Pinecone index dimension fix'); return; }
    const id        = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const payload    = {
      vectors: {
        [id]: {
          id,
          values: embedding,
          metadata: {
            id,
            question,
            answer,
            timestamp: Date.now(),
            timestamp_type: 'unix_ms',
          },
        },
      },
    };
    const r = await fetch(HISTORY_UPSERT_URL, {
      method: 'POST',
      headers: historyHeaders(),
      body: JSON.stringify(payload),
    });
    if (r.ok) { alert('[history] upsert OK\n\nRecord saved to teazzers-history with id:\n' + id + '\n\nRefresh the Pinecone console — the record count should now be > 0'); }
    else { const t = await r.text(); alert('[history] upsert FAILED: ' + r.status + '\n\n' + t.slice(0, 500)); }
  } catch(e) { alert('[history] saveToHistory error:\n\n' + e.message); }
}

async function loadRecentHistory(limit = HISTORY_LIMIT) {
  try {
    const embedding = await getEmbedding('recent support history');
    if (!embedding.length) { console.warn('[history] loadRecentHistory: empty embedding'); return []; }
    const r = await fetch(HISTORY_QUERY_URL, {
      method: 'POST',
      headers: historyHeaders(),
      body: JSON.stringify({
        vector:         embedding,
        topK:           limit,
        namespace:      HISTORY_NS,
        includeMetadata: true,
      }),
    });
    if (!r.ok) { console.warn('[history] query failed', r.status); return []; }
    const data   = await r.json();
    const vectors = data.matches || [];
    return vectors.map((m, i) => {
      const m2  = m.metadata || {};
      return {
        id:        m2.id    || m.id    || `hist_${i}`,
        question:  m2.question || '—',
        answer:    m2.answer   || '',
        timestamp: m2.timestamp || 0,
      };
    });
  } catch (e) { console.warn('[history] loadRecentHistory error:', e); return []; }
}

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
  const messagesEndRef  = useRef(null);

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
  const onHistoryItemClick = useCallback((item) => {
    setActiveHistoryId(item.id);
    setMessages([{ role: 'user', content: item.question }]);
    setInput(item.question);
    // Re-fetch answer from teazzers-data
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(ASSISTANT_URL, {
          method: 'POST',
          headers: {
            'Api-Key': API_KEY,
            'Content-Type': 'application/json',
            'X-Pinecone-Api-Version': '2025-10',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: item.question }],
            model: 'gpt-4o',
            stream: false,
          }),
        });
        if (!response.ok) {
          let detail = `${response.status} ${response.statusText}`;
          try { (await response.json()).error && (detail = (await response.json()).error); } catch { /* ignore */ }
          throw new Error(detail);
        }
        const data = await response.json();
        const answer = data?.message?.content || 'No answer found.';
        setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        // Re-save with fresh timestamp
        saveToHistory(item.question, answer);
      } catch (err) {
        setError(safeErr(err));
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${safeErr(err)}. Support: support.teazzers.com` }]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [API_KEY]);

  const messagesRef   = useRef([]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── Send new question ────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input.trim() };
    setInput('');
    setIsLoading(true);
    setError(null);
    setMessages(prev => [...prev, userMessage]);
    messagesRef.current = [...messagesRef.current, userMessage];   // ← keep ref in sync now, not after next render
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
                <button
                  key={item.id}
                  className={`chat-history-item${activeHistoryId === item.id ? ' active' : ''}`}
                  onClick={() => onHistoryItemClick(item)}
                >
                  <div className="hist-query">{item.question}</div>
                  <div className="hist-time">{timeAgo(item.timestamp)}</div>
                </button>
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
