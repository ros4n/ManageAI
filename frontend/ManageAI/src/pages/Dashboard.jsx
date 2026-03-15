import { useState, useEffect } from 'react';
import { memoryAPI, topicAPI, flashcardAPI } from '../api/client';
import jsPDF from 'jspdf';

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

function StatCard({ label, value, accent, icon }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px solid #ede9fe',
      borderRadius: 14, padding: '20px 22px',
      textAlign: 'center',
      boxShadow: '0 1px 8px rgba(108,92,231,0.07)',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(108,92,231,0.13)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(108,92,231,0.07)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ fontSize: 32, fontWeight: 800, color: accent || '#7c6af7', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: '#9d9bc0', marginTop: 6, letterSpacing: '0.02em', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Dashboard({ onLoadChat }) {
  const [memories, setMemories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  useEffect(() => { loadData(); }, [filter]);

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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await memoryAPI.delete(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  const handleBulkFlashcards = async () => {
    setGenerating(true);
    try {
      await flashcardAPI.bulkGenerate();
    } catch (err) { console.error(err); }
    setGenerating(false);
  };

  const stripMarkdown = (text) => {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/___(.+?)___/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/#{1,6}\s+(.+)/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\[(.+?)\]\(.*?\)/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/---+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const formatMemoryWithAI = async (memory) => {
    try {
      const res = await fetch('http://localhost:8000/api/format-memory/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: memory.question, answer: memory.answer }),
      });
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      return { question: data.question, answer: data.answer };
    } catch {
      return { question: stripMarkdown(memory.question), answer: stripMarkdown(memory.answer) };
    }
  };

  const handleExportPDF = async () => {
    if (memories.length === 0) return;
    setExporting(true);
    setExportProgress('Formatting memories with AI...');

    const formatted = [];
    for (let i = 0; i < memories.length; i++) {
      setExportProgress(`Formatting memory ${i + 1} of ${memories.length}...`);
      const result = await formatMemoryWithAI(memories[i]);
      formatted.push({ ...memories[i], ...result });
    }

    setExportProgress('Building PDF...');

    const doc = new jsPDF();
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin      = 22;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;
    let pageNum = 1;

    const addFooter = () => {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont(undefined, 'normal');
      doc.text('ManageAI Memory Export', margin, pageHeight - 8);
      const pStr = `Page ${pageNum}`;
      doc.text(pStr, pageWidth - margin - doc.getTextWidth(pStr), pageHeight - 8);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    };

    const newPage = () => {
      addFooter();
      doc.addPage();
      pageNum++;
      y = margin;
    };

    const checkSpace = (needed) => {
      if (y + needed > pageHeight - 18) newPage();
    };

    doc.setFillColor(40, 40, 40);
    doc.rect(0, 0, pageWidth, 4, 'F');
    y = 52;

    doc.setFontSize(28);
    doc.setTextColor(20, 20, 20);
    doc.setFont(undefined, 'bold');
    doc.text('ManageAI', margin, y);
    y += 10;

    doc.setFontSize(13);
    doc.setTextColor(80, 80, 80);
    doc.setFont(undefined, 'normal');
    doc.text('Memory Export Report', margin, y);
    y += 18;

    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(1);
    doc.line(margin, y, margin + 40, y);
    y += 20;

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 7;
    doc.text(`Total memories: ${memories.length}`, margin, y);
    y += 7;
    if (filter) { doc.text(`Topic filter: ${filter}`, margin, y); y += 7; }
    addFooter();

    doc.addPage();
    pageNum++;
    y = margin;

    formatted.forEach((m, idx) => {
      checkSpace(40);
      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.setFont(undefined, 'normal');
      doc.text(`#${idx + 1}  •  ${m.topic || 'General'}  •  ${new Date(m.created_at).toLocaleDateString()}`, margin, y);
      y += 7;

      doc.setFontSize(11.5);
      doc.setTextColor(20, 20, 20);
      doc.setFont(undefined, 'bold');
      const qLines = doc.splitTextToSize(m.question, contentWidth);
      checkSpace(qLines.length * 6 + 6);
      doc.text(qLines, margin, y);
      y += qLines.length * 6 + 5;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined, 'normal');
      const aLines = doc.splitTextToSize(m.answer, contentWidth);
      const aHeight = aLines.length * 5.5;
      checkSpace(aHeight + 14);
      doc.text(aLines, margin, y);
      y += aHeight + 14;

      if (idx < formatted.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.15);
        doc.line(margin, y - 7, pageWidth - margin, y - 7);
      }
    });

    addFooter();
    doc.save('manageai-memories.pdf');
    setExporting(false);
    setExportProgress('');
  };

  const todayStr = new Date().toDateString();
  const todayCount = memories.filter(m => new Date(m.created_at).toDateString() === todayStr).length;
  const weekCount = memories.filter(m => Date.now() - new Date(m.created_at).getTime() < 7 * 86400000).length;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f5f4fe' }}>
      <style>{`
        @keyframes manageai-spin { to { transform: rotate(360deg); } }
        @keyframes manageai-pulse { 0%, 60%, 100% { transform: scale(0.55); opacity: 0.3; } 30% { transform: scale(1); opacity: 1; } }
        .memory-card { transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s; }
        .memory-card:hover { border-color: #c4b5fd !important; box-shadow: 0 4px 20px rgba(108,92,231,0.1) !important; transform: translateY(-1px); }
        .filter-pill { transition: all 0.15s; }
        .filter-pill:hover { border-color: #c4b5fd !important; color: #6c5ce7 !important; }
        .load-chat-btn:hover { background: #ede9fe !important; color: #6c5ce7 !important; }
        .delete-mem-btn:hover { background: #fef2f2 !important; border-color: #fca5a5 !important; color: #ef4444 !important; }
        .export-btn:hover:not(:disabled) { background: #f0fdf4 !important; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 30, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1640', letterSpacing: '-0.6px', marginBottom: 6 }}>Memory Vault</h1>
            <p style={{ fontSize: 14, color: '#9d9bc0', fontWeight: 400 }}>
              {memories.length > 0
                ? `${memories.length} saved memories across ${topics.length} topic${topics.length !== 1 ? 's' : ''}`
                : 'Your knowledge base grows with every conversation'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {exporting && (
              <div style={{
                fontSize: 12.5, color: '#7c6af7',
                display: 'flex', alignItems: 'center', gap: 7,
                background: '#f0eeff', border: '1px solid #c4b5fd',
                borderRadius: 8, padding: '5px 12px', fontWeight: 500,
              }}>
                <span style={{ animation: 'manageai-spin 1s linear infinite', display: 'inline-block' }}>◌</span>
                {exportProgress}
              </div>
            )}
            <div style={{ display: 'flex', gap: 9 }}>
              <button
                className="export-btn"
                onClick={handleExportPDF}
                disabled={memories.length === 0 || exporting}
                style={{
                  background: (memories.length === 0 || exporting) ? '#f5f4fe' : '#ffffff',
                  border: '1.5px solid #ede9fe',
                  borderRadius: 10, padding: '9px 17px',
                  color: (memories.length === 0 || exporting) ? '#c4bfe8' : '#059669',
                  cursor: (memories.length === 0 || exporting) ? 'default' : 'pointer',
                  fontSize: 13.5, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'all 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <span>{exporting ? '◌' : '↓'}</span>
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>

              <button
                onClick={handleBulkFlashcards}
                disabled={generating}
                style={{
                  background: generating ? '#f5f4fe' : '#ffffff',
                  border: '1.5px solid #ede9fe',
                  borderRadius: 10, padding: '9px 17px',
                  color: generating ? '#c4bfe8' : '#7c6af7',
                  cursor: generating ? 'default' : 'pointer',
                  fontSize: 13.5, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'all 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => { if (!generating) e.currentTarget.style.background = '#f0eeff'; }}
                onMouseLeave={e => { if (!generating) e.currentTarget.style.background = '#ffffff'; }}
              >
                <span>✦</span>
                {generating ? 'Generating flashcards…' : 'Auto-generate flashcards'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 30 }}>
          <StatCard label="Total memories" value={memories.length} accent="#7c6af7" />
          <StatCard label="Topics covered" value={topics.length} accent="#2563eb" />
          <StatCard label="Added today" value={todayCount} accent="#059669" />
          <StatCard label="This week" value={weekCount} accent="#d97706" />
        </div>

        {/* Topic filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="filter-pill"
            onClick={() => setFilter(null)}
            style={{
              background: !filter ? '#ede9fe' : '#ffffff',
              border: `1.5px solid ${!filter ? '#c4b5fd' : '#ede9fe'}`,
              borderRadius: 22, padding: '5px 16px',
              color: !filter ? '#6c5ce7' : '#9d9bc0',
              cursor: 'pointer', fontSize: 13, fontWeight: !filter ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >All ({memories.length})</button>

          {topics.map(t => (
            <button
              key={t.topic}
              className="filter-pill"
              onClick={() => setFilter(t.topic)}
              style={{
                background: filter === t.topic ? TOPIC_BG[t.topic] || '#f9fafb' : '#ffffff',
                border: `1.5px solid ${filter === t.topic ? (TOPIC_COLORS[t.topic] || '#6b7280') + '55' : '#ede9fe'}`,
                borderRadius: 22, padding: '5px 16px',
                color: filter === t.topic ? (TOPIC_COLORS[t.topic] || '#6b7280') : '#9d9bc0',
                cursor: 'pointer', fontSize: 13,
                fontWeight: filter === t.topic ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >{t.topic} ({t.count})</button>
          ))}
        </div>

        {/* Memory list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '70px 0', color: '#c4bfe8' }}>
            <div style={{ fontSize: 34, marginBottom: 14, animation: 'manageai-spin 1.2s linear infinite', display: 'inline-block' }}>◌</div>
            <div style={{ fontSize: 14, color: '#b0acd4', marginTop: 4 }}>Loading memories…</div>
          </div>
        ) : memories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '90px 0', color: '#c4bfe8' }}>
            <div style={{ fontSize: 52, marginBottom: 18 }}>🧠</div>
            <div style={{ fontSize: 18, color: '#7a7898', marginBottom: 10, fontWeight: 600 }}>No memories yet</div>
            <div style={{ fontSize: 14, color: '#b0acd4' }}>Start a chat to build your knowledge vault</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {memories.map(m => {
              const isExpanded = expandedId === m.id;
              return (
                <div
                  key={m.id}
                  className="memory-card"
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #ede9fe',
                    borderRadius: 14, padding: '18px 20px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 6px rgba(108,92,231,0.06)',
                  }}
                >
                  {/* Question + date row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                      background: TOPIC_COLORS[m.topic] || '#6b7280',
                      marginTop: 7,
                      boxShadow: `0 0 6px ${TOPIC_COLORS[m.topic] || '#6b7280'}55`,
                    }} />
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 14.5, color: '#1a1640', lineHeight: 1.48 }}>
                      {m.question}
                    </div>
                    <span style={{ fontSize: 12, color: '#c4bfe8', flexShrink: 0, marginTop: 2, fontWeight: 500 }}>
                      {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Answer preview / full */}
                  <div style={{
                    fontSize: 13.5, color: '#6b6892', lineHeight: 1.65,
                    marginBottom: 14, marginLeft: 21,
                    ...(isExpanded ? {} : {
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }),
                  }}>
                    {m.answer}
                  </div>

                  {/* Action row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginLeft: 21 }}>
                    <span style={{
                      fontSize: 12, padding: '3px 11px', borderRadius: 22,
                      background: TOPIC_BG[m.topic] || '#f9fafb',
                      color: TOPIC_COLORS[m.topic] || '#6b7280',
                      border: `1px solid ${TOPIC_COLORS[m.topic] || '#6b7280'}25`,
                      fontWeight: 600,
                    }}>{m.topic}</span>

                    <div style={{ flex: 1 }} />

                    <button
                      className="load-chat-btn"
                      onClick={(e) => { e.stopPropagation(); onLoadChat(m); }}
                      style={{
                        background: '#f5f4fe',
                        border: '1.5px solid #ede9fe',
                        borderRadius: 8, padding: '5px 13px',
                        color: '#7c6af7', cursor: 'pointer',
                        fontSize: 12.5, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.15s',
                      }}
                    >
                      💬 Open in Chat
                    </button>

                    <button
                      className="delete-mem-btn"
                      onClick={(e) => handleDelete(m.id, e)}
                      disabled={deletingId === m.id}
                      style={{
                        background: 'transparent',
                        border: '1.5px solid #ede9fe',
                        borderRadius: 8, padding: '5px 10px',
                        color: '#c4bfe8', cursor: 'pointer',
                        fontSize: 12.5, fontWeight: 500,
                        transition: 'all 0.15s',
                      }}
                    >{deletingId === m.id ? '…' : '✕'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}