import { useState } from 'react';
import { searchAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#34d399', Programming: '#60a5fa',
  Math: '#c084fc', Physics: '#f87171',
  Database: '#fbbf24', General: '#9ca3af',
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchAPI.search(query);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, color: '#e8e6f0', maxWidth: 800 }}>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6b6880', fontSize: 16 }}>⌕</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="Search with natural language... e.g. 'shortest path algorithm'"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#1c1c27', border: '1px solid #2a2a3a',
            borderRadius: 12, padding: '14px 20px 14px 44px',
            color: '#e8e6f0', fontFamily: 'inherit', fontSize: 15,
            outline: 'none'
          }}
        />
        <button
          onClick={doSearch}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: '#7c6af7', border: 'none', borderRadius: 8,
            padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 13
          }}
        >
          Search
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ color: '#6b6880', textAlign: 'center', padding: 40 }}>Searching memories...</div>
      ) : !searched ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b6880' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, color: '#e8e6f0', marginBottom: 6 }}>Search your knowledge base</div>
          <div style={{ fontSize: 13 }}>Uses semantic similarity to find related answers</div>
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b6880', fontSize: 14 }}>
          No memories found for "{query}"
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#6b6880', marginBottom: 4 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
          {results.map(m => (
            <div key={m.id} style={{
              background: '#1c1c27', border: '1px solid #2a2a3a',
              borderRadius: 10, padding: 16
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: '#0f0d1a', color: TOPIC_COLORS[m.topic] || '#9ca3af',
                  border: '1px solid #2a2a3a'
                }}>
                  {m.topic}
                </span>
                <span style={{ fontSize: 11, color: '#4a4860', marginLeft: 'auto' }}>
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{m.question}</div>
              <div style={{ fontSize: 12, color: '#6b6880', lineHeight: 1.6,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {m.answer}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
