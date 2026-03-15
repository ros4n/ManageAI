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
      background: '#f5f4fe',
      fontFamily: "'Outfit', 'DM Sans', -apple-system, system-ui, sans-serif",
      color: '#1a1640',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4cffa; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #b8b0f5; }
        button, textarea, input { font-family: inherit; }
        ::placeholder { color: #b0acd4; }

        .session-item { transition: background 0.15s, border-color 0.15s; border-radius: 10px; }
        .session-item:hover { background: #f0eeff !important; }
        .session-item.active { background: #ede9fe !important; border-color: #c4b5fd !important; }

        .nav-btn { transition: all 0.15s; border-radius: 10px; }
        .nav-btn:hover { background: #f0eeff !important; color: #6c5ce7 !important; }
        .nav-btn.active { background: #ede9fe !important; color: #6c5ce7 !important; }

        .delete-btn { opacity: 0; transition: opacity 0.15s; }
        .session-item:hover .delete-btn { opacity: 1; }

        .send-btn { transition: all 0.2s; }
        .send-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }

        pre { overflow-x: auto; }
        code { font-family: 'Fira Code', 'Consolas', monospace !important; }

        .new-chat-btn { transition: all 0.15s; }
        .new-chat-btn:hover { background: #ede9fe !important; }

        .header-new-chat:hover { background: #ede9fe !important; }
      `}</style>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside style={{
          width: 264,
          background: '#ffffff',
          borderRight: '1px solid #ede9fe',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: '2px 0 16px rgba(108,92,231,0.06)',
        }}>
          {/* Logo + new chat */}
          <div style={{
            padding: '18px 16px 14px',
            borderBottom: '1px solid #f0eeff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, #7c6af7 0%, #3ecfcf 100%)',
                borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff',
                letterSpacing: '-0.5px', flexShrink: 0,
                boxShadow: '0 2px 10px rgba(124,106,247,0.35)',
              }}>M</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1640', letterSpacing: '-0.4px', lineHeight: 1 }}>ManageAI</div>
                <div style={{ fontSize: 11, color: '#a09cc8', marginTop: 2 }}>Smart Memory Chat</div>
              </div>
            </div>
            <button
              className="new-chat-btn"
              onClick={handleNewChat}
              title="New chat"
              style={{
                background: '#f5f4fe',
                border: '1px solid #ede9fe',
                borderRadius: 9, width: 32, height: 32,
                color: '#7c6af7', cursor: 'pointer', fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ lineHeight: 1, marginTop: -1 }}>+</span>
            </button>
          </div>

          {/* Chat list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 4px' }}>
            {groupOrder.filter(g => groups[g]).map(label => (
              <div key={label}>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, color: '#c4bfe8',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  padding: '12px 8px 5px',
                }}>{label}</div>
                {groups[label].map(s => (
                  <div
                    key={s.id}
                    className={`session-item${s.id === activeSessionId ? ' active' : ''}`}
                    onClick={() => handleSelectSession(s.id)}
                    onMouseEnter={() => setHoveredSession(s.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px',
                      border: `1px solid ${s.id === activeSessionId ? '#c4b5fd' : 'transparent'}`,
                      marginBottom: 2, cursor: 'pointer', position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0 }}>💬</span>
                    <span style={{
                      fontSize: 13, flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: s.id === activeSessionId ? '#6c5ce7' : '#7a7898',
                      fontWeight: s.id === activeSessionId ? 600 : 400,
                    }}>{s.title}</span>
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#c4bfe8', cursor: 'pointer',
                        fontSize: 11, padding: '2px 4px',
                        flexShrink: 0, borderRadius: 4,
                        lineHeight: 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = '#c4bfe8'}
                    >✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div style={{
            padding: '12px 10px 16px',
            borderTop: '1px solid #f0eeff',
          }}>
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-btn${page === item.id ? ' active' : ''}`}
                onClick={() => setPage(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 12px',
                  border: 'none', cursor: 'pointer',
                  background: page === item.id ? '#ede9fe' : 'transparent',
                  color: page === item.id ? '#6c5ce7' : '#7a7898',
                  fontSize: 14, textAlign: 'left', marginBottom: 3,
                  fontWeight: page === item.id ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
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
          height: 54, flexShrink: 0,
          background: '#ffffff',
          borderBottom: '1px solid #ede9fe',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 14,
          boxShadow: '0 1px 8px rgba(108,92,231,0.05)',
        }}>
          <button
            onClick={() => setSidebarOpen(p => !p)}
            title="Toggle sidebar"
            style={{
              background: 'none', border: 'none',
              color: '#b0acd4', cursor: 'pointer',
              fontSize: 18, display: 'flex', alignItems: 'center',
              padding: '5px 6px', borderRadius: 7,
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#7c6af7'; e.currentTarget.style.background = '#f0eeff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#b0acd4'; e.currentTarget.style.background = 'none'; }}
          >☰</button>

          <span style={{
            fontSize: 15, fontWeight: 600, color: '#4a4478',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {page === 'chat'
              ? (activeSession?.title || 'New Chat')
              : navItems.find(n => n.id === page)?.icon + ' ' + navItems.find(n => n.id === page)?.label}
          </span>

          {page === 'chat' && (
            <button
              className="header-new-chat"
              onClick={handleNewChat}
              style={{
                background: '#f5f4fe',
                border: '1px solid #ede9fe',
                borderRadius: 9, padding: '6px 16px',
                color: '#7c6af7', cursor: 'pointer',
                fontSize: 13.5, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
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