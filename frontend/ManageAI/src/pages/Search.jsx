import { useState, useRef } from 'react';
import { searchAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#34d399', Programming: '#60a5fa',
  Math: '#c084fc',      Physics: '#f87171',
  Database: '#fbbf24',  General: '#9ca3af',
};

const TOPIC_BG = {
  Algorithms: 'rgba(52,211,153,0.08)',
  Programming: 'rgba(96,165,250,0.08)',
  Math:        'rgba(192,132,252,0.08)',
  Physics:     'rgba(248,113,113,0.08)',
  Database:    'rgba(251,191,36,0.08)',
  General:     'rgba(156,163,175,0.08)',
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
    <div style={{ height: '100%', overflowY: 'auto', background: '#0c0c14' }}>
      <style>{`
        .result-card { transition: border-color 0.18s, transform 0.15s, box-shadow 0.18s; }
        .result-card:hover { border-color: rgba(124,106,247,0.3) !important; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .open-chat-btn { transition: all 0.15s; }
        .open-chat-btn:hover { background: rgba(124,106,247,0.2) !important; color: #c4b5fd !important; }
        .suggestion-chip { transition: all 0.15s; }
        .suggestion-chip:hover { background: rgba(124,106,247,0.15) !important; border-color: rgba(124,106,247,0.35) !important; color: #c4b5fd !important; }
        .search-input:focus { border-color: rgba(124,106,247,0.4) !important; box-shadow: 0 0 0 3px rgba(124,106,247,0.08) !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e0f0', letterSpacing: '-0.5px', marginBottom: 5 }}>Search Memory</h1>
          <p style={{ fontSize: 13, color: '#4a4870' }}>Semantic similarity search across all your saved knowledge</p>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: '#3d3b58', fontSize: 18, pointerEvents: 'none',
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
              background: '#14132a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px 120px 14px 48px',
              color: '#e2e0f0', fontSize: 14.5, outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
          <button
            onClick={() => doSearch()}
            disabled={loading || !query.trim()}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: (loading || !query.trim()) ? '#1a1830' : 'linear-gradient(135deg, #7c6af7, #5b4ecf)',
              border: 'none', borderRadius: 9,
              padding: '8px 18px',
              color: (loading || !query.trim()) ? '#3a3860' : '#fff',
              cursor: (loading || !query.trim()) ? 'default' : 'pointer',
              fontSize: 13.5, fontWeight: 600,
              boxShadow: (!loading && query.trim()) ? '0 2px 12px rgba(124,106,247,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >{loading ? '···' : 'Search'}</button>
        </div>

        {/* Suggestion chips */}
        {!searched && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
            <span style={{ fontSize: 12, color: '#3a3860', alignSelf: 'center', marginRight: 4 }}>Try:</span>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => doSearch(s)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20, padding: '5px 13px',
                  color: '#5a5878', cursor: 'pointer',
                  fontSize: 12.5,
                }}
              >{s}</button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a3860' }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>Searching your memory vault…</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#7c6af7', opacity: 0.4,
                  animation: 'manageai-pulse 1.35s infinite ease-in-out',
                  animationDelay: `${i * 0.18}s`,
                }} />
              ))}
            </div>
          </div>
        ) : !searched ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a3860' }}>
            <div style={{ fontSize: 42, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 15, color: '#6a6888', fontWeight: 500, marginBottom: 8 }}>Search your knowledge base</div>
            <div style={{ fontSize: 13 }}>Uses vector similarity to find semantically related answers</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a3860' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>¿</div>
            <div style={{ fontSize: 15, color: '#6a6888', fontWeight: 500, marginBottom: 8 }}>No results found</div>
            <div style={{ fontSize: 13 }}>Try different keywords or chat more to build your memory</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12.5, color: '#3a3860', marginBottom: 4 }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for <em style={{ color: '#7c6af7' }}>"{query}"</em>
            </div>
            {results.map(m => (
              <div
                key={m.id}
                className="result-card"
                style={{
                  background: '#13122a',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 10px', borderRadius: 20,
                    background: TOPIC_BG[m.topic] || 'rgba(255,255,255,0.04)',
                    color: TOPIC_COLORS[m.topic] || '#9ca3af',
                    border: `1px solid ${TOPIC_COLORS[m.topic] || '#9ca3af'}33`,
                    fontWeight: 500,
                  }}>{m.topic}</span>
                  <span style={{ fontSize: 11, color: '#2e2c48', marginLeft: 'auto' }}>
                    {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div style={{ fontWeight: 500, fontSize: 14, color: '#d2d0e8', marginBottom: 8, lineHeight: 1.45 }}>
                  {m.question}
                </div>

                <div style={{
                  fontSize: 12.5, color: '#4a4870', lineHeight: 1.65,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  marginBottom: 12,
                }}>{m.answer}</div>

                <button
                  className="open-chat-btn"
                  onClick={() => onLoadChat(m)}
                  style={{
                    background: 'rgba(124,106,247,0.1)',
                    border: '1px solid rgba(124,106,247,0.18)',
                    borderRadius: 7, padding: '5px 12px',
                    color: '#9b87f5', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >💬 Open in Chat</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes manageai-pulse {
          0%, 60%, 100% { transform: scale(0.6); opacity: 0.25; }
          30% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}