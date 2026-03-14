import { useState, useEffect } from 'react';
import { flashcardAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#34d399', Programming: '#60a5fa',
  Math: '#c084fc', Physics: '#f87171',
  Database: '#fbbf24', General: '#9ca3af',
};

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    setLoading(true);
    try {
      const res = await flashcardAPI.getAll();
      setFlashcards(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await flashcardAPI.bulkGenerate();
      setFlashcards(res.data);
      setFlipped({});
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  const toggleFlip = (id) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return (
    <div style={{ padding: 24, color: '#6b6880', textAlign: 'center' }}>Loading flashcards...</div>
  );

  return (
    <div style={{ padding: 24, color: '#e8e6f0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            background: '#1e1b33', border: '1px solid #3a2a5a',
            borderRadius: 8, padding: '8px 16px', color: '#a78bfa',
            cursor: 'pointer', fontSize: 13
          }}
        >
          {generating ? 'Generating...' : '✦ Regenerate from memories'}
        </button>
      </div>

      {flashcards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b6880' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📇</div>
          <div style={{ fontSize: 15, color: '#e8e6f0', marginBottom: 6 }}>No flashcards yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Chat first, then click Regenerate</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
          {flashcards.map(fc => (
            <div
              key={fc.id}
              onClick={() => toggleFlip(fc.id)}
              style={{
                background: '#1c1c27',
                border: `1px solid ${flipped[fc.id] ? '#7c6af7' : '#2a2a3a'}`,
                borderRadius: 12, padding: 20, cursor: 'pointer',
                minHeight: 120, display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.2s'
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: flipped[fc.id] ? '#a78bfa' : '#e8e6f0', flex: 1 }}>
                {fc.front}
              </div>
              {flipped[fc.id] && (
                <div style={{
                  fontSize: 12, color: '#9ca3af', lineHeight: 1.6,
                  marginTop: 10, borderTop: '1px solid #2a2a3a', paddingTop: 10
                }}>
                  {fc.back}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#4a4860', marginTop: 10, textAlign: 'right' }}>
                {flipped[fc.id] ? 'tap to hide' : 'tap to reveal →'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
