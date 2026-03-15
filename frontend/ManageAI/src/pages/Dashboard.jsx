import { useState, useEffect } from 'react';
import { memoryAPI, topicAPI, flashcardAPI } from '../api/client';
import jsPDF from 'jspdf';

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

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: '#14132a',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '18px 20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: accent || '#a78bfa', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#4a4870', marginTop: 6, letterSpacing: '0.02em' }}>{label}</div>
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
      .replace(/```[\s\S]*?```/g, '')             // remove code blocks entirely
      .replace(/`([^`]+)`/g, '$1')                 // inline code → plain text
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')         // ***bold italic***
      .replace(/\*\*(.+?)\*\*/g, '$1')             // **bold**
      .replace(/\*(.+?)\*/g, '$1')                 // *italic*
      .replace(/___(.+?)___/g, '$1')               // ___bold italic___
      .replace(/__(.+?)__/g, '$1')                 // __bold__
      .replace(/_(.+?)_/g, '$1')                   // _italic_
      .replace(/#{1,6}\s+(.+)/g, '$1')             // # headings → plain text
      .replace(/^\s*[-*+]\s+/gm, '• ')             // - list → bullet
      .replace(/^\s*\d+\.\s+/gm, '')               // 1. numbered list
      .replace(/\[(.+?)\]\(.*?\)/g, '$1')          // [link](url) → link text
      .replace(/^>\s+/gm, '')                      // > blockquotes
      .replace(/---+/g, '')                        // horizontal rules
      .replace(/\n{3,}/g, '\n\n')                  // max 2 newlines
      .trim();
  };

  const formatMemoryWithAI = async (memory) => {
    try {
      const prompt = `You are formatting a Q&A memory for a PDF report.
Given this question and answer, rewrite them as clean, well-structured plain text.
- No markdown symbols like **, *, #, >, \`, or ---
- No bullet dashes, use plain sentences or numbered points like "1. 2. 3."
- Keep all technical accuracy
- Question: rewrite as a clear, concise question (1-2 lines max)
- Answer: rewrite as organized paragraphs, max 150 words, no symbols

QUESTION: ${memory.question}
ANSWER: ${memory.answer}

Respond ONLY with this JSON format, no extra text:
{"question": "cleaned question here", "answer": "cleaned answer here"}`;

      const res = await fetch('http://localhost:8000/api/format-memory/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: memory.question, answer: memory.answer }),
      });
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      return { question: data.question, answer: data.answer };
    } catch {
      // fallback to stripMarkdown if API fails
      return { question: stripMarkdown(memory.question), answer: stripMarkdown(memory.answer) };
    }
  };

  const handleExportPDF = async () => {
    if (memories.length === 0) return;
    setExporting(true);
    setExportProgress('Formatting memories with AI...');

    // Format all memories via AI
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

    // COVER PAGE
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
    y += 14;

    const exportDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'normal');
    doc.text('Date:', margin, y);
    doc.setFont(undefined, 'bold');
    doc.text(exportDate, margin + 22, y);
    y += 7;

    doc.setFont(undefined, 'normal');
    doc.text('Total Memories:', margin, y);
    doc.setFont(undefined, 'bold');
    doc.text(`${memories.length}`, margin + 40, y);
    y += 7;

    const topicCounts = memories.reduce((acc, m) => {
      acc[m.topic] = (acc[m.topic] || 0) + 1;
      return acc;
    }, {});
    doc.setFont(undefined, 'normal');
    doc.text('Topics:', margin, y);
    doc.setFont(undefined, 'bold');
    const topicText = Object.entries(topicCounts).map(([t, c]) => `${t} (${c})`).join('  •  ');
    const topicLines = doc.splitTextToSize(topicText, contentWidth - 20);
    doc.text(topicLines, margin + 18, y);
    y += topicLines.length * 6 + 12;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    addFooter();

    // CONTENT PAGES
    doc.addPage();
    pageNum++;
    y = margin;

    const grouped = formatted.reduce((acc, m) => {
      if (!acc[m.topic]) acc[m.topic] = [];
      acc[m.topic].push(m);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([topic, items]) => {
      checkSpace(16);

      doc.setFillColor(40, 40, 40);
      doc.rect(margin, y - 5, contentWidth, 11, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text(`${topic.toUpperCase()}   —   ${items.length} ${items.length === 1 ? 'entry' : 'entries'}`, margin + 4, y + 1.5);
      y += 13;

      items.forEach((m, idx) => {
        checkSpace(25);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        const dateStr = new Date(m.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });
        doc.text(`${idx + 1}.`, margin, y);
        doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), y);
        y += 6;

        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'bold');
        doc.text('QUESTION', margin, y);
        y += 5;

        checkSpace(8);
        doc.setFontSize(10.5);
        doc.setTextColor(10, 10, 10);
        doc.setFont(undefined, 'bold');
        const qLines = doc.splitTextToSize(m.question, contentWidth);
        qLines.forEach(line => {
          checkSpace(6);
          doc.text(line, margin, y);
          y += 5.5;
        });
        y += 3;

        checkSpace(8);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'bold');
        doc.text('ANSWER', margin, y);
        y += 5;

        doc.setFontSize(9.5);
        doc.setTextColor(25, 25, 25);
        doc.setFont(undefined, 'normal');
        const aLines = doc.splitTextToSize(m.answer, contentWidth);
        aLines.forEach(line => {
          checkSpace(6);
          doc.text(line, margin, y);
          y += 5.2;
        });

        y += 4;
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      });

      y += 4;
    });

    addFooter();
    doc.save(`manageai-memories-${new Date().toISOString().slice(0, 10)}.pdf`);
    setExporting(false);
    setExportProgress('');
  };

  const today = new Date().toDateString();
  const todayCount = memories.filter(m => new Date(m.created_at).toDateString() === today).length;
  const weekCount = memories.filter(m => Date.now() - new Date(m.created_at) < 7 * 86400000).length;

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      background: '#0c0c14',
    }}>
      <style>{`
        .memory-card { transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s; }
        .memory-card:hover { border-color: rgba(124,106,247,0.3) !important; box-shadow: 0 4px 24px rgba(0,0,0,0.3); transform: translateY(-1px); }
        .load-chat-btn { transition: all 0.15s; }
        .load-chat-btn:hover { background: rgba(124,106,247,0.2) !important; color: #c4b5fd !important; }
        .filter-pill { transition: all 0.15s; }
        .filter-pill:hover { border-color: rgba(124,106,247,0.35) !important; color: #c4b5fd !important; }
        .delete-mem-btn { transition: all 0.15s; }
        .delete-mem-btn:hover { background: rgba(248,113,113,0.12) !important; color: #f87171 !important; }
        .export-btn:hover { background: rgba(52,211,153,0.2) !important; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e0f0', letterSpacing: '-0.5px', marginBottom: 5 }}>Memory Vault</h1>
            <p style={{ fontSize: 13, color: '#4a4870' }}>Every conversation saved, tagged, and searchable</p>
          </div>

          {/* Button group */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {exporting && (
              <div style={{
                fontSize: 11.5, color: '#34d399',
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(52,211,153,0.07)',
                border: '1px solid rgba(52,211,153,0.15)',
                borderRadius: 7, padding: '5px 12px',
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
                background: (memories.length === 0 || exporting) ? '#1a1830' : 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.22)',
                borderRadius: 9, padding: '8px 16px',
                color: (memories.length === 0 || exporting) ? '#3a3860' : '#34d399',
                cursor: (memories.length === 0 || exporting) ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <span>{exporting ? '◌' : '↓'}</span>
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>

            <button
              onClick={handleBulkFlashcards}
              disabled={generating}
              style={{
                background: generating ? '#1a1830' : 'rgba(124,106,247,0.12)',
                border: '1px solid rgba(124,106,247,0.22)',
                borderRadius: 9, padding: '8px 16px',
                color: generating ? '#4a4870' : '#a78bfa',
                cursor: generating ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <span>✦</span>
              {generating ? 'Generating flashcards…' : 'Auto-generate flashcards'}
            </button>
          </div>
        </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
          <StatCard label="Total memories" value={memories.length} accent="#a78bfa" />
          <StatCard label="Topics covered" value={topics.length} accent="#60a5fa" />
          <StatCard label="Added today" value={todayCount} accent="#34d399" />
          <StatCard label="This week" value={weekCount} accent="#fbbf24" />
        </div>

        {/* Topic filter pills */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="filter-pill"
            onClick={() => setFilter(null)}
            style={{
              background: !filter ? 'rgba(124,106,247,0.15)' : 'transparent',
              border: `1px solid ${!filter ? 'rgba(124,106,247,0.35)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 20, padding: '4px 14px',
              color: !filter ? '#c4b5fd' : '#4a4870',
              cursor: 'pointer', fontSize: 12.5, fontWeight: !filter ? 500 : 400,
            }}
          >All ({memories.length})</button>

          {topics.map(t => (
            <button
              key={t.topic}
              className="filter-pill"
              onClick={() => setFilter(t.topic)}
              style={{
                background: filter === t.topic ? `${TOPIC_BG[t.topic] || 'rgba(255,255,255,0.05)'}` : 'transparent',
                border: `1px solid ${filter === t.topic ? (TOPIC_COLORS[t.topic] || '#9ca3af') + '55' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 20, padding: '4px 14px',
                color: filter === t.topic ? (TOPIC_COLORS[t.topic] || '#9ca3af') : '#4a4870',
                cursor: 'pointer', fontSize: 12.5,
                fontWeight: filter === t.topic ? 500 : 400,
              }}
            >{t.topic} ({t.count})</button>
          ))}
        </div>

        {/* Memory list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a3860' }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: 'manageai-spin 1.2s linear infinite' }}>◌</div>
            <div style={{ fontSize: 13 }}>Loading memories…</div>
          </div>
        ) : memories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#3a3860' }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🧠</div>
            <div style={{ fontSize: 16, color: '#7a78a0', marginBottom: 8, fontWeight: 500 }}>No memories yet</div>
            <div style={{ fontSize: 13 }}>Start a chat to build your knowledge vault</div>
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
                    background: '#13122a',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: '16px 18px',
                    cursor: 'pointer',
                  }}
                >
                  {/* Question + topic row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: TOPIC_COLORS[m.topic] || '#9ca3af',
                      marginTop: 6,
                    }} />
                    <div style={{ flex: 1, fontWeight: 500, fontSize: 14, color: '#d2d0e8', lineHeight: 1.45 }}>
                      {m.question}
                    </div>
                    <span style={{ fontSize: 11, color: '#3a3860', flexShrink: 0, marginTop: 2 }}>
                      {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Answer preview / full */}
                  <div style={{
                    fontSize: 12.5, color: '#5a5878', lineHeight: 1.6,
                    marginBottom: 12, marginLeft: 18,
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 18 }}>
                    <span style={{
                      fontSize: 11, padding: '2px 10px', borderRadius: 20,
                      background: TOPIC_BG[m.topic] || 'rgba(255,255,255,0.04)',
                      color: TOPIC_COLORS[m.topic] || '#9ca3af',
                      border: `1px solid ${TOPIC_COLORS[m.topic] || '#9ca3af'}33`,
                      fontWeight: 500,
                    }}>{m.topic}</span>

                    <div style={{ flex: 1 }} />

                    <button
                      className="load-chat-btn"
                      onClick={(e) => { e.stopPropagation(); onLoadChat(m); }}
                      style={{
                        background: 'rgba(124,106,247,0.1)',
                        border: '1px solid rgba(124,106,247,0.18)',
                        borderRadius: 7, padding: '4px 11px',
                        color: '#9b87f5', cursor: 'pointer',
                        fontSize: 11.5, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 5,
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
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 7, padding: '4px 9px',
                        color: '#3a3860', cursor: 'pointer',
                        fontSize: 11.5,
                      }}
                    >{deletingId === m.id ? '…' : '✕'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes manageai-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}