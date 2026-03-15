import { useState, useEffect } from 'react';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Flashcards from './pages/Flashcards';

const generateId = () => Math.random().toString(36).slice(2, 11);

const createSession = () => ({
  id: generateId(),
  title: 'New Chat',
  messages: [{
    role: 'assistant',
    content: "Hi! I'm **ManageAI** — your intelligent assistant with persistent memory. Every conversation I have with you gets saved, tagged, and made searchable.\n\nYou can also upload images for analysis. What would you like to explore today?",
    id: 'welcome',
  }],
  createdAt: new Date().toISOString(),
  topic: null,
});

const STORAGE_KEY = 'manageai_sessions_v2';

const loadSessions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [createSession()];
};

export default function App() {
  const [sessions, setSessions] = useState(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState(() => loadSessions()[0]?.id);
  const [page, setPage] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredSession, setHoveredSession] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleNewChat = () => {
    const s = createSession();
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(s.id);
    setPage('chat');
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    setPage('chat');
  };

  const handleUpdateSession = (id, updates) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteSession = (id, e) => {
    e?.stopPropagation();
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const s = createSession();
        setActiveSessionId(s.id);
        return [s];
      }
      if (activeSessionId === id) setActiveSessionId(next[0].id);
      return next;
    });
  };

  // Called from Dashboard/Search to open a memory as a chat
  const handleLoadMemoryChat = (memory) => {
    const s = {
      id: generateId(),
      title: memory.question.slice(0, 45) + (memory.question.length > 45 ? '…' : ''),
      messages: [
        { role: 'assistant', content: "Hi! I'm **ManageAI** — your intelligent assistant with persistent memory. Every conversation I have with you gets saved, tagged, and made searchable.\n\nYou can also upload images for analysis. What would you like to explore today?", id: 'welcome' },
        { role: 'user', content: memory.question, id: generateId() },
        { role: 'assistant', content: memory.answer, topic: memory.topic, saved: true, id: generateId() },
      ],
      createdAt: memory.created_at,
      topic: memory.topic,
      fromMemory: true,
    };
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(s.id);
    setPage('chat');
  };

  // Group sessions by recency
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const groups = sessions.reduce((acc, s) => {
    const d = new Date(s.createdAt).toDateString();
    const ms = new Date(s.createdAt).getTime();
    const key = d === today ? 'Today' : d === yesterday ? 'Yesterday' : ms > sevenDaysAgo ? 'Previous 7 Days' : 'Older';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

  const navItems = [
    { id: 'dashboard', label: 'Memory', icon: '🧠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'flashcards', label: 'Flashcards', icon: '📇' },
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0c0c14',
      fontFamily: "'DM Sans', 'Sora', -apple-system, system-ui, sans-serif",
      color: '#e2e0f0',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d2b45; border-radius: 10px; }
        button, textarea, input { font-family: inherit; }
        ::placeholder { color: #3d3b58; }
        .session-item { transition: background 0.15s; }
        .session-item:hover { background: rgba(255,255,255,0.05) !important; }
        .session-item.active { background: rgba(124,106,247,0.13) !important; }
        .nav-btn { transition: all 0.15s; }
        .nav-btn:hover { background: rgba(255,255,255,0.05) !important; color: #c4b5fd !important; }
        .nav-btn.active { background: rgba(124,106,247,0.12) !important; color: #c4b5fd !important; }
        .delete-btn { opacity: 0; transition: opacity 0.15s; }
        .session-item:hover .delete-btn { opacity: 1; }
        .send-btn { transition: all 0.2s; }
        .send-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        pre { overflow-x: auto; }
        code { font-family: 'Fira Code', 'Consolas', monospace !important; }
      `}</style>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside style={{
          width: 256,
          background: '#0f0f1c',
          borderRight: '1px solid rgba(255,255,255,0.055)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          {/* Logo + new chat */}
          <div style={{
            padding: '16px 14px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.055)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 30, height: 30,
                background: 'linear-gradient(135deg, #7c6af7 0%, #3ecfcf 100%)',
                borderRadius: 9, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff',
                letterSpacing: '-0.5px', flexShrink: 0,
              }}>M</div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#e2e0f0', letterSpacing: '-0.4px', lineHeight: 1 }}>ManageAI</div>
                <div style={{ fontSize: 10, color: '#4a4870', marginTop: 2, letterSpacing: '0.02em' }}>Smart Memory Chat</div>
              </div>
            </div>
            <button
              onClick={handleNewChat}
              title="New chat"
              style={{
                background: 'rgba(124,106,247,0.12)',
                border: '1px solid rgba(124,106,247,0.22)',
                borderRadius: 7, width: 30, height: 30,
                color: '#a78bfa', cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ lineHeight: 1, marginTop: -1 }}>+</span>
            </button>
          </div>

          {/* Chat list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 4px' }}>
            {groupOrder.filter(g => groups[g]).map(label => (
              <div key={label}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: '#3d3b58',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '10px 8px 5px',
                }}>{label}</div>
                {groups[label].map(s => (
                  <div
                    key={s.id}
                    className={`session-item${s.id === activeSessionId ? ' active' : ''}`}
                    onClick={() => handleSelectSession(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${s.id === activeSessionId ? 'rgba(124,106,247,0.18)' : 'transparent'}`,
                      marginBottom: 1, position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: 12.5, flexShrink: 0 }}>💬</span>
                    <span style={{
                      fontSize: 12.5, flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: s.id === activeSessionId ? '#c4b5fd' : '#7a7898',
                      fontWeight: s.id === activeSessionId ? 500 : 400,
                    }}>{s.title}</span>
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#4a4870', cursor: 'pointer',
                        fontSize: 11, padding: '2px',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = '#4a4870'}
                    >✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div style={{
            padding: '10px 8px 14px',
            borderTop: '1px solid rgba(255,255,255,0.055)',
          }}>
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-btn${page === item.id ? ' active' : ''}`}
                onClick={() => setPage(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: page === item.id ? 'rgba(124,106,247,0.12)' : 'transparent',
                  color: page === item.id ? '#c4b5fd' : '#5a5878',
                  fontSize: 13, textAlign: 'left', marginBottom: 2,
                  fontWeight: page === item.id ? 500 : 400,
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: 50, flexShrink: 0,
          background: '#0c0c14',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12,
        }}>
          <button
            onClick={() => setSidebarOpen(p => !p)}
            title="Toggle sidebar"
            style={{
              background: 'none', border: 'none',
              color: '#4a4870', cursor: 'pointer',
              fontSize: 17, display: 'flex', alignItems: 'center',
              padding: '4px', borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#9b87f5'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a4870'}
          >☰</button>

          <span style={{
            fontSize: 13.5, fontWeight: 500, color: '#7a7898',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {page === 'chat'
              ? (activeSession?.title || 'New Chat')
              : navItems.find(n => n.id === page)?.icon + ' ' + navItems.find(n => n.id === page)?.label}
          </span>

          {page === 'chat' && (
            <button
              onClick={handleNewChat}
              style={{
                background: 'rgba(124,106,247,0.1)',
                border: '1px solid rgba(124,106,247,0.2)',
                borderRadius: 8, padding: '5px 13px',
                color: '#a78bfa', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.1)'; }}
            >
              <span>+</span> New Chat
            </button>
          )}
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {page === 'chat' && activeSession && (
            <Chat
              key={activeSessionId}
              session={activeSession}
              onUpdate={(updates) => handleUpdateSession(activeSessionId, updates)}
            />
          )}
          {page === 'dashboard' && <Dashboard onLoadChat={handleLoadMemoryChat} />}
          {page === 'search'    && <Search    onLoadChat={handleLoadMemoryChat} />}
          {page === 'flashcards' && <Flashcards />}
        </div>
      </div>
    </div>
  );
}