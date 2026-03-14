import { useState, useEffect } from 'react';
import { memoryAPI, topicAPI, flashcardAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#34d399', Programming: '#60a5fa',
  Math: '#c084fc', Physics: '#f87171',
  Database: '#fbbf24', General: '#9ca3af',
};

export default function Dashboard() {
  const [memories, setMemories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [memRes, topicRes] = await Promise.all([
        memoryAPI.getAll(filter),
        topicAPI.getTopics(),
      ]);
      setMemories(memRes.data);
      setTopics(topicRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await memoryAPI.delete(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleBulkFlashcards = async () => {
    setGenerating(true);
    try {
      await flashcardAPI.bulkGenerate();
      alert('Flashcards generated! Go to the Flashcards page.');
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  return (
    <div style={{ padding: 24, color: '#e8e6f0', maxWidth: 900 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total memories', value: memories.length },
          { label: 'Topics', value: topics.length },
          { label: 'Today', value: memories.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).length },
          { label: 'This week', value: memories.filter(m => (Date.now() - new Date(m.created_at)) < 7*86400000).length },
        ].map(s => (
          <div key={s.label} style={{ background: '#1c1c27', border: '1px solid #2a2a3a', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#a78bfa' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b6880', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Topics filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setFilter(null)}
          style={{
            background: !filter ? '#1e1b33' : 'transparent',
            border: `1px solid ${!filter ? '#7c6af7' : '#2a2a3a'}`,
            borderRadius: 20, padding: '4px 12px', color: !filter ? '#a78bfa' : '#6b6880',
            cursor: 'pointer', fontSize: 12
          }}
        >
          All
        </button>
        {topics.map(t => (
          <button
            key={t.topic}
            onClick={() => setFilter(t.topic)}
            style={{
              background: filter === t.topic ? '#1e1b33' : 'transparent',
              border: `1px solid ${filter === t.topic ? '#7c6af7' : '#2a2a3a'}`,
              borderRadius: 20, padding: '4px 12px',
              color: filter === t.topic ? (TOPIC_COLORS[t.topic] || '#9ca3af') : '#6b6880',
              cursor: 'pointer', fontSize: 12
            }}
          >
            {t.topic} ({t.count})
          </button>
        ))}
        <button
          onClick={handleBulkFlashcards}
          disabled={generating}
          style={{
            marginLeft: 'auto', background: '#1e1b33', border: '1px solid #3a2a5a',
            borderRadius: 8, padding: '6px 14px', color: '#a78bfa',
            cursor: 'pointer', fontSize: 12
          }}
        >
          {generating ? 'Generating...' : '✦ Auto-generate flashcards'}
        </button>
      </div>

      {/* Memory list */}
      {loading ? (
        <div style={{ color: '#6b6880', textAlign: 'center', padding: 40 }}>Loading memories...</div>
      ) : memories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b6880' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
          <div style={{ fontSize: 15, color: '#e8e6f0', marginBottom: 6 }}>No memories yet</div>
          <div style={{ fontSize: 13 }}>Start chatting to build your knowledge base</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {memories.map(m => (
            <div
              key={m.id}
              style={{
                background: '#1c1c27', border: '1px solid #2a2a3a',
                borderRadius: 10, padding: '14px 16px',
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{m.question}</div>
              <div style={{ fontSize: 12, color: '#6b6880', lineHeight: 1.5, marginBottom: 10,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {m.answer}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                <button
                  onClick={() => handleDelete(m.id)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: '#6b6880', cursor: 'pointer', fontSize: 12,
                    padding: '2px 6px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
