import { useState, useEffect } from 'react';
import { flashcardAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#059669', Programming: '#2563eb',
  Math: '#7c3aed',      Physics: '#dc2626',
  Database: '#d97706',  General: '#6b7280',
};

const TOPIC_BG = {
  Algorithms: '#ecfdf5', Programming: '#eff6ff',
  Math: '#f5f3ff',       Physics: '#fef2f2',
  Database: '#fffbeb',   General: '#f9fafb',
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
        height: '100%', background: '#f5f4fe',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 28,
      }}>
        <style>{`
          @keyframes card-appear { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        `}</style>
        {/* Progress bar + back */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14, width: '100%', maxWidth: 580 }}>
          <button
            onClick={() => { setStudyMode(false); setFlipped({}); }}
            style={{
              background: '#ffffff', border: '1.5px solid #ede9fe',
              borderRadius: 9, color: '#7c6af7',
              cursor: 'pointer', fontSize: 18, padding: '6px 10px', lineHeight: 1,
              transition: 'all 0.15s', fontWeight: 700,
              boxShadow: '0 1px 4px rgba(108,92,231,0.1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0eeff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
          >←</button>
          <span style={{ fontSize: 14, color: '#9d9bc0', flex: 1, fontWeight: 500 }}>
            Card <strong style={{ color: '#7c6af7' }}>{studyIndex + 1}</strong> of {flashcards.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {flashcards.map((_, i) => (
              <div key={i} style={{
                width: 26, height: 4, borderRadius: 3,
                background: i === studyIndex ? '#7c6af7' : i < studyIndex ? '#10b981' : '#e8e4fb',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Card */}
        <div
          onClick={() => setFlipped(prev => ({ ...prev, study: !prev.study }))}
          style={{
            width: '100%', maxWidth: 580,
            background: studyFlipped ? '#f0eeff' : '#ffffff',
            border: `2px solid ${studyFlipped ? '#c4b5fd' : '#ede9fe'}`,
            borderRadius: 20, padding: '48px 42px',
            minHeight: 260, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            boxShadow: studyFlipped
              ? '0 8px 40px rgba(124,106,247,0.18)'
              : '0 4px 24px rgba(108,92,231,0.1)',
            animation: 'card-appear 0.25s ease',
            transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
          }}
        >
          {!studyFlipped ? (
            <>
              <div style={{
                fontSize: 10.5, letterSpacing: '0.14em', fontWeight: 700,
                color: '#c4bfe8', textTransform: 'uppercase', marginBottom: 22,
                background: '#f5f4fe', borderRadius: 20, padding: '4px 14px',
              }}>Question</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#1a1640', lineHeight: 1.5 }}>{studyCard?.front}</div>
              <div style={{ fontSize: 13, color: '#c4bfe8', marginTop: 30, fontWeight: 500 }}>Tap to reveal answer →</div>
            </>
          ) : (
            <>
              <div style={{
                fontSize: 10.5, letterSpacing: '0.14em', fontWeight: 700,
                color: '#ffffff', textTransform: 'uppercase', marginBottom: 22,
                background: '#7c6af7', borderRadius: 20, padding: '4px 14px',
                boxShadow: '0 2px 8px rgba(124,106,247,0.3)',
              }}>Answer</div>
              <div style={{ fontSize: 16, color: '#2d2a50', lineHeight: 1.75, fontWeight: 500 }}>{studyCard?.back}</div>
              <div style={{ fontSize: 13, color: '#b0acd4', marginTop: 26, fontWeight: 400 }}>Tap to flip back ↩</div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
          <button
            onClick={() => { setStudyIndex(i => Math.max(0, i - 1)); setFlipped({}); }}
            disabled={studyIndex === 0}
            style={{
              background: studyIndex === 0 ? '#f5f4fe' : '#ffffff',
              border: '1.5px solid #ede9fe',
              borderRadius: 11, padding: '11px 26px',
              color: studyIndex === 0 ? '#c4bfe8' : '#7c6af7',
              cursor: studyIndex === 0 ? 'default' : 'pointer',
              fontSize: 14.5, fontWeight: 600,
              transition: 'all 0.15s',
              boxShadow: studyIndex > 0 ? '0 1px 8px rgba(108,92,231,0.1)' : 'none',
            }}
            onMouseEnter={e => { if (studyIndex > 0) e.currentTarget.style.background = '#f0eeff'; }}
            onMouseLeave={e => { if (studyIndex > 0) e.currentTarget.style.background = '#ffffff'; }}
          >← Prev</button>
          <button
            onClick={() => { setStudyIndex(i => Math.min(flashcards.length - 1, i + 1)); setFlipped({}); }}
            disabled={studyIndex === flashcards.length - 1}
            style={{
              background: studyIndex === flashcards.length - 1
                ? '#f5f4fe'
                : 'linear-gradient(135deg, #7c6af7, #5b4ecf)',
              border: '1.5px solid transparent',
              borderRadius: 11, padding: '11px 26px',
              color: studyIndex === flashcards.length - 1 ? '#c4bfe8' : '#fff',
              cursor: studyIndex === flashcards.length - 1 ? 'default' : 'pointer',
              fontSize: 14.5, fontWeight: 700,
              boxShadow: studyIndex < flashcards.length - 1 ? '0 3px 16px rgba(124,106,247,0.4)' : 'none',
              transition: 'all 0.15s',
            }}
          >Next →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f5f4fe' }}>
      <style>{`
        .fc-card { transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s; cursor: pointer; }
        .fc-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(108,92,231,0.14) !important; border-color: #c4b5fd !important; }
        .fc-card.flipped { border-color: #a78bfa !important; background: #f0eeff !important; }
      `}</style>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 30, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1640', letterSpacing: '-0.6px', marginBottom: 6 }}>Flashcards</h1>
            <p style={{ fontSize: 14, color: '#9d9bc0' }}>
              {flashcards.length > 0 ? `${flashcards.length} cards ready to study` : 'AI-generated from your conversations'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {flashcards.length > 0 && (
              <button
                onClick={() => { setStudyMode(true); setStudyIndex(0); setFlipped({}); }}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: 10, padding: '9px 18px',
                  color: '#059669', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'all 0.15s',
                  boxShadow: '0 1px 6px rgba(5,150,105,0.1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(5,150,105,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(5,150,105,0.1)'; }}
              >▶ Study Mode</button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: generating ? '#f5f4fe' : '#ffffff',
                border: '1.5px solid #ede9fe',
                borderRadius: 10, padding: '9px 18px',
                color: generating ? '#c4bfe8' : '#7c6af7',
                cursor: generating ? 'default' : 'pointer',
                fontSize: 13.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.15s',
                boxShadow: '0 1px 6px rgba(108,92,231,0.08)',
              }}
              onMouseEnter={e => { if (!generating) e.currentTarget.style.background = '#f0eeff'; }}
              onMouseLeave={e => { if (!generating) e.currentTarget.style.background = '#ffffff'; }}
            >
              <span>✦</span>
              {generating ? 'Generating…' : flashcards.length ? 'Regenerate' : 'Generate from Memories'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '70px 0', color: '#c4bfe8', fontSize: 14 }}>
            Loading flashcards…
          </div>
        ) : flashcards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '90px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 18 }}>📇</div>
            <div style={{ fontSize: 18, color: '#4a4478', fontWeight: 700, marginBottom: 10 }}>No flashcards yet</div>
            <div style={{ fontSize: 14, color: '#9d9bc0', marginBottom: 28 }}>Chat with ManageAI first, then generate cards from your memory</div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: 'linear-gradient(135deg, #7c6af7, #5b4ecf)',
                border: 'none', borderRadius: 12,
                padding: '12px 26px', color: '#fff',
                cursor: 'pointer', fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 18px rgba(124,106,247,0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >{generating ? 'Generating…' : '✦ Generate Flashcards'}</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {flashcards.map(fc => {
              const isFlipped = !!flipped[fc.id];
              return (
                <div
                  key={fc.id}
                  className={`fc-card${isFlipped ? ' flipped' : ''}`}
                  onClick={() => toggleFlip(fc.id)}
                  style={{
                    background: isFlipped ? '#f0eeff' : '#ffffff',
                    border: `1.5px solid ${isFlipped ? '#a78bfa' : '#ede9fe'}`,
                    borderRadius: 16, padding: '24px 22px',
                    minHeight: 155,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: isFlipped
                      ? '0 4px 20px rgba(124,106,247,0.15)'
                      : '0 1px 8px rgba(108,92,231,0.07)',
                  }}
                >
                  {!isFlipped ? (
                    <>
                      <div style={{
                        fontSize: 10.5, letterSpacing: '0.12em', fontWeight: 700,
                        color: '#c4bfe8', textTransform: 'uppercase', marginBottom: 14,
                      }}>Question</div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1a1640', flex: 1, lineHeight: 1.52 }}>{fc.front}</div>
                      <div style={{ fontSize: 12, color: '#c4bfe8', marginTop: 16, textAlign: 'right', fontWeight: 500 }}>Tap to reveal →</div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        fontSize: 10.5, letterSpacing: '0.12em', fontWeight: 700,
                        color: '#7c6af7', textTransform: 'uppercase', marginBottom: 14,
                      }}>Answer</div>
                      <div style={{ fontSize: 13.5, color: '#2d2a50', lineHeight: 1.73, flex: 1, fontWeight: 500 }}>{fc.back}</div>
                      <div style={{ fontSize: 12, color: '#b0acd4', marginTop: 16, textAlign: 'right' }}>Tap to flip ↩</div>
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