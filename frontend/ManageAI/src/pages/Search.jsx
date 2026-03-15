import { useState, useRef } from 'react';
import { searchAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#059669', Programming: '#2563eb',
  Math: '#7c3aed',      Physics: '#dc2626',
  Database: '#d97706',  General: '#6b7280',
};

const TOPIC_BG = {
  Algorithms: '#ecfdf5',
  Programming: '#eff6ff',
  Math:        '#f5f3ff',
  Physics:     '#fef2f2',
  Database:    '#fffbeb',
  General:     '#f9fafb',
};

const SUGGESTIONS = [
  'sorting algorithms', 'recursion', 'binary search',
  'SQL joins', 'React hooks', 'linear regression',
];

export default function Search({ onLoadChat }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  const doSearch = async (q) => {
    const searchQ = q ?? query;
    if (!searchQ.trim()) return;
    if (q) setQuery(q);
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchAPI.search(searchQ);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f5f4fe' }}>
      <style>{`
        .result-card { transition: border-color 0.18s, transform 0.15s, box-shadow 0.18s; }
        .result-card:hover { border-color: #c4b5fd !important; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(108,92,231,0.12) !important; }
        .open-chat-btn { transition: all 0.15s; }
        .open-chat-btn:hover { background: #ede9fe !important; color: #6c5ce7 !important; }
        .suggestion-chip { transition: all 0.15s; }
        .suggestion-chip:hover { background: #ede9fe !important; border-color: #c4b5fd !important; color: #6c5ce7 !important; }
        .search-input:focus { border-color: #a78bfa !important; box-shadow: 0 0 0 4px rgba(124,106,247,0.1) !important; }
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '30px 28px' }}>
        {/* Header */}
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1640', letterSpacing: '-0.6px', marginBottom: 6 }}>Search Memory</h1>
          <p style={{ fontSize: 14, color: '#9d9bc0' }}>Semantic similarity search across all your saved knowledge</p>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{
            position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
            color: '#b0acd4', fontSize: 20, pointerEvents: 'none',
          }}>⌕</span>
          <input
            ref={inputRef}
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="e.g. 'how does quicksort work' or 'SQL window functions'"
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1.5px solid #ede9fe',
              borderRadius: 14, padding: '15px 130px 15px 52px',
              color: '#1a1640', fontSize: 15, outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 6px rgba(108,92,231,0.07)',
            }}
          />
          <button
            onClick={() => doSearch()}
            disabled={loading || !query.trim()}
            style={{
              position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
              background: (loading || !query.trim())
                ? '#f5f4fe'
                : 'linear-gradient(135deg, #7c6af7, #5b4ecf)',
              border: 'none', borderRadius: 10,
              padding: '9px 20px',
              color: (loading || !query.trim()) ? '#c4bfe8' : '#fff',
              cursor: (loading || !query.trim()) ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 700,
              boxShadow: (!loading && query.trim()) ? '0 2px 12px rgba(124,106,247,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >{loading ? '···' : 'Search'}</button>
        </div>

        {/* Suggestion chips */}
        {!searched && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 44 }}>
            <span style={{ fontSize: 13, color: '#c4bfe8', alignSelf: 'center', marginRight: 4, fontWeight: 500 }}>Try:</span>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => doSearch(s)}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #ede9fe',
                  borderRadius: 22, padding: '6px 15px',
                  color: '#9d9bc0', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  boxShadow: '0 1px 4px rgba(108,92,231,0.06)',
                }}
              >{s}</button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '70px 0', color: '#c4bfe8' }}>
            <div style={{ fontSize: 14, marginBottom: 14, color: '#9d9bc0', fontWeight: 500 }}>Searching your memory vault…</div>
            <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: '#7c6af7', opacity: 0.5,
                  animation: 'search-pulse 1.35s infinite ease-in-out',
                  animationDelay: `${i * 0.18}s`,
                }} />
              ))}
            </div>
          </div>
        ) : !searched ? (
          <div style={{ textAlign: 'center', padding: '70px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 18 }}>🔍</div>
            <div style={{ fontSize: 18, color: '#4a4478', fontWeight: 700, marginBottom: 10 }}>Search your knowledge base</div>
            <div style={{ fontSize: 14, color: '#9d9bc0' }}>Uses vector similarity to find semantically related answers</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 18 }}>¿</div>
            <div style={{ fontSize: 18, color: '#4a4478', fontWeight: 700, marginBottom: 10 }}>No results found</div>
            <div style={{ fontSize: 14, color: '#9d9bc0' }}>Try different keywords or chat more to build your memory</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ fontSize: 13.5, color: '#9d9bc0', marginBottom: 6, fontWeight: 500 }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
              <em style={{ color: '#7c6af7', fontStyle: 'normal', fontWeight: 700 }}>"{query}"</em>
            </div>
            {results.map(m => (
              <div
                key={m.id}
                className="result-card"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #ede9fe',
                  borderRadius: 14, padding: '18px 20px',
                  boxShadow: '0 1px 6px rgba(108,92,231,0.06)',
                }}
              >
                <div style={{ display: 'flex', gap: 9, marginBottom: 12, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 12, padding: '3px 12px', borderRadius: 22,
                    background: TOPIC_BG[m.topic] || '#f9fafb',
                    color: TOPIC_COLORS[m.topic] || '#6b7280',
                    border: `1px solid ${TOPIC_COLORS[m.topic] || '#6b7280'}25`,
                    fontWeight: 700,
                  }}>{m.topic}</span>
                  <span style={{ fontSize: 12, color: '#c4bfe8', marginLeft: 'auto', fontWeight: 500 }}>
                    {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1640', marginBottom: 9, lineHeight: 1.46 }}>
                  {m.question}
                </div>

                <div style={{
                  fontSize: 13.5, color: '#6b6892', lineHeight: 1.68,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  marginBottom: 14,
                }}>{m.answer}</div>

                <button
                  className="open-chat-btn"
                  onClick={() => onLoadChat(m)}
                  style={{
                    background: '#f5f4fe',
                    border: '1.5px solid #ede9fe',
                    borderRadius: 9, padding: '6px 14px',
                    color: '#7c6af7', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >💬 Open in Chat</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes search-pulse {
          0%, 60%, 100% { transform: scale(0.6); opacity: 0.25; }
          30% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}