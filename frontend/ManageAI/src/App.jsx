import { useState } from 'react';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Flashcards from './pages/Flashcards';

const PAGES = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'dashboard', label: 'Memory', icon: '🧠' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'flashcards', label: 'Flashcards', icon: '📇' },
];

export default function App() {
  const [page, setPage] = useState('chat');

  const renderPage = () => {
    if (page === 'chat') return <Chat />;
    if (page === 'dashboard') return <Dashboard />;
    if (page === 'search') return <Search />;
    if (page === 'flashcards') return <Flashcards />;
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gridTemplateRows: '56px 1fr',
      height: '100vh',
      background: '#0a0a0f',
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      {/* Top bar */}
      <div style={{
        gridColumn: '1/-1', background: '#111118',
        borderBottom: '1px solid #2a2a3a',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c6af7' }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#a78bfa' }}>ThinkVault</span>
        </div>
        <span style={{ fontSize: 12, color: '#4a4860' }}>AI Knowledge Memory</span>
      </div>

      {/* Sidebar */}
      <div style={{
        background: '#111118', borderRight: '1px solid #2a2a3a',
        padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4
      }}>
        {PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, border: 'none', textAlign: 'left', width: '100%',
              background: page === p.id ? '#1e1b33' : 'transparent',
              color: page === p.id ? '#a78bfa' : '#6b6880',
              fontWeight: page === p.id ? 500 : 400
            }}
          >
            <span style={{ fontSize: 15 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ overflowY: 'auto', background: '#0a0a0f' }}>
        {renderPage()}
      </div>
    </div>
  );
}