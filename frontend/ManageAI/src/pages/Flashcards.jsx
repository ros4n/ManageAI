import { useState, useEffect } from 'react';
import { flashcardAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#34d399', Programming: '#60a5fa',
  Math: '#c084fc',      Physics: '#f87171',
  Database: '#fbbf24',  General: '#9ca3af',
};

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);

  useEffect(() => { loadFlashcards(); }, []);

  const loadFlashcards = async () => {
    setLoading(true);
    try {
      const res = await flashcardAPI.getAll();
      setFlashcards(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await flashcardAPI.bulkGenerate();
      setFlashcards(res.data);
      setFlipped({});
    } catch (err) { console.error(err); }
    setGenerating(false);
  };

  const toggleFlip = (id) => setFlipped(prev => ({ ...prev, [id]: !prev[id] }));

  // Study mode
  const studyCard = flashcards[studyIndex];
  const studyFlipped = flipped['study'];

  if (studyMode && flashcards.length > 0) {
    return (
      <div style={{
        height: '100%', background: '#0c0c14',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <style>{`
          @keyframes card-appear { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        `}</style>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 560 }}>
          <button
            onClick={() => { setStudyMode(false); setFlipped({}); }}
            style={{
              background: 'none', border: 'none', color: '#4a4870',
              cursor: 'pointer', fontSize: 22, padding: '4px', lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a4870'}
          >←</button>
          <span style={{ fontSize: 13, color: '#4a4870', flex: 1 }}>
            Card <strong style={{ color: '#9b87f5' }}>{studyIndex + 1}</strong> of {flashcards.length}
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            {flashcards.map((_, i) => (
              <div key={i} style={{
                width: 24, height: 3, borderRadius: 2,
                background: i === studyIndex ? '#7c6af7' : i < studyIndex ? '#34d399' : '#1e1c38',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Card */}
        <div
          onClick={() => setFlipped(prev => ({ ...prev, study: !prev.study }))}
          style={{
            width: '100%', maxWidth: 560,
            background: studyFlipped ? '#1a1830' : '#13122a',
            border: `2px solid ${studyFlipped ? '#7c6af7' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 18, padding: '40px 36px',
            minHeight: 240, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            boxShadow: studyFlipped ? '0 0 40px rgba(124,106,247,0.15)' : '0 4px 24px rgba(0,0,0,0.4)',
            animation: 'card-appear 0.25s ease',
            transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
          }}
        >
          {!studyFlipped ? (
            <>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', fontWeight: 600, color: '#3a3860', textTransform: 'uppercase', marginBottom: 20 }}>Question</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#d2d0e8', lineHeight: 1.5 }}>{studyCard?.front}</div>
              <div style={{ fontSize: 12, color: '#2e2c48', marginTop: 28 }}>Tap to reveal answer</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', fontWeight: 600, color: '#7c6af7', textTransform: 'uppercase', marginBottom: 20 }}>Answer</div>
              <div style={{ fontSize: 15, color: '#c4b5fd', lineHeight: 1.7 }}>{studyCard?.back}</div>
              <div style={{ fontSize: 12, color: '#3a3860', marginTop: 24 }}>Tap to flip back</div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button
            onClick={() => { setStudyIndex(i => Math.max(0, i - 1)); setFlipped({}); }}
            disabled={studyIndex === 0}
            style={{
              background: studyIndex === 0 ? '#0f0f1c' : '#14132a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '10px 24px',
              color: studyIndex === 0 ? '#2e2c48' : '#9b87f5',
              cursor: studyIndex === 0 ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >← Prev</button>
          <button
            onClick={() => { setStudyIndex(i => Math.min(flashcards.length - 1, i + 1)); setFlipped({}); }}
            disabled={studyIndex === flashcards.length - 1}
            style={{
              background: studyIndex === flashcards.length - 1 ? '#0f0f1c' : 'linear-gradient(135deg, #7c6af7, #5b4ecf)',
              border: '1px solid rgba(124,106,247,0.2)',
              borderRadius: 10, padding: '10px 24px',
              color: studyIndex === flashcards.length - 1 ? '#2e2c48' : '#fff',
              cursor: studyIndex === flashcards.length - 1 ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 500,
              boxShadow: studyIndex < flashcards.length - 1 ? '0 2px 12px rgba(124,106,247,0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >Next →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#0c0c14' }}>
      <style>{`
        .fc-card { transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s; }
        .fc-card:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(0,0,0,0.4) !important; }
        .fc-card.flipped { border-color: rgba(124,106,247,0.35) !important; }
      `}</style>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e0f0', letterSpacing: '-0.5px', marginBottom: 5 }}>Flashcards</h1>
            <p style={{ fontSize: 13, color: '#4a4870' }}>
              {flashcards.length > 0 ? `${flashcards.length} cards ready to study` : 'AI-generated from your conversations'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            {flashcards.length > 0 && (
              <button
                onClick={() => { setStudyMode(true); setStudyIndex(0); setFlipped({}); }}
                style={{
                  background: 'rgba(52,211,153,0.12)',
                  border: '1px solid rgba(52,211,153,0.22)',
                  borderRadius: 9, padding: '8px 16px',
                  color: '#34d399', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,211,153,0.12)'}
              >▶ Study Mode</button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: generating ? '#1a1830' : 'rgba(124,106,247,0.12)',
                border: '1px solid rgba(124,106,247,0.22)',
                borderRadius: 9, padding: '8px 16px',
                color: generating ? '#3a3860' : '#a78bfa',
                cursor: generating ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span>✦</span>
              {generating ? 'Generating…' : flashcards.length ? 'Regenerate' : 'Generate from Memories'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a3860', fontSize: 13 }}>
            Loading flashcards…
          </div>
        ) : flashcards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#3a3860' }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>📇</div>
            <div style={{ fontSize: 16, color: '#6a6888', fontWeight: 500, marginBottom: 8 }}>No flashcards yet</div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>Chat with ManageAI first, then generate cards from your memory</div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: 'linear-gradient(135deg, #7c6af7, #5b4ecf)',
                border: 'none', borderRadius: 10,
                padding: '10px 22px', color: '#fff',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                boxShadow: '0 2px 14px rgba(124,106,247,0.35)',
              }}
            >{generating ? 'Generating…' : '✦ Generate Flashcards'}</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
            {flashcards.map(fc => {
              const isFlipped = !!flipped[fc.id];
              return (
                <div
                  key={fc.id}
                  className={`fc-card${isFlipped ? ' flipped' : ''}`}
                  onClick={() => toggleFlip(fc.id)}
                  style={{
                    background: isFlipped ? '#1a1830' : '#13122a',
                    border: `1px solid ${isFlipped ? 'rgba(124,106,247,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14, padding: '22px 20px',
                    cursor: 'pointer', minHeight: 140,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: isFlipped ? '0 0 24px rgba(124,106,247,0.12)' : '0 2px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {!isFlipped ? (
                    <>
                      <div style={{ fontSize: 9.5, letterSpacing: '0.12em', fontWeight: 600, color: '#2e2c48', textTransform: 'uppercase', marginBottom: 12 }}>Question</div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#d2d0e8', flex: 1, lineHeight: 1.5 }}>{fc.front}</div>
                      <div style={{ fontSize: 10.5, color: '#2e2c48', marginTop: 14, textAlign: 'right' }}>Tap to reveal →</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 9.5, letterSpacing: '0.12em', fontWeight: 600, color: '#7c6af7', textTransform: 'uppercase', marginBottom: 12 }}>Answer</div>
                      <div style={{ fontSize: 12.5, color: '#c4b5fd', lineHeight: 1.7, flex: 1 }}>{fc.back}</div>
                      <div style={{ fontSize: 10.5, color: '#3a3860', marginTop: 14, textAlign: 'right' }}>Tap to flip ↩</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}