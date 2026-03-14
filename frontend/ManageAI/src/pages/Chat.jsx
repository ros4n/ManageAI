import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#34d399',
  Programming: '#60a5fa',
  Math: '#c084fc',
  Physics: '#f87171',
  Database: '#fbbf24',
  General: '#9ca3af',
};

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m ThinkVault — your AI tutor with memory. Every answer I give gets saved and made searchable. Ask me anything!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastTopic, setLastTopic] = useState(null);
  const [contextUsed, setContextUsed] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    console.log('button clicked')
    
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');

    const userMsg = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const res = await chatAPI.sendMessage(userMessage, history);
      const { answer, topic, context_used } = res.data;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: answer, topic, saved: true },
      ]);
      setLastTopic(topic);
      setContextUsed(context_used);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error connecting to server. Is the backend running?', topic: null },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? '#1f2a1f' : '#1e1b33',
              border: `1px solid ${msg.role === 'user' ? '#2a3a2a' : '#3a2a5a'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              color: msg.role === 'user' ? '#34d399' : '#a78bfa'
            }}>
              {msg.role === 'user' ? 'You' : 'TV'}
            </div>
            <div style={{ maxWidth: '70%' }}>
              <div style={{
                background: msg.role === 'user' ? '#1e1b33' : '#1c1c27',
                border: `1px solid ${msg.role === 'user' ? '#3a2a5a' : '#2a2a3a'}`,
                borderRadius: 12, padding: '12px 16px',
                color: '#e8e6f0', fontSize: 14, lineHeight: 1.6,
              }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.topic && (
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: '#1e1b33', color: TOPIC_COLORS[msg.topic] || '#9ca3af',
                    border: '1px solid #3a2a5a'
                  }}>
                    {msg.topic}
                  </span>
                  {msg.saved && (
                    <span style={{ fontSize: 11, color: '#34d399' }}>✓ saved to memory</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e1b33', border: '1px solid #3a2a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#a78bfa', flexShrink: 0 }}>TV</div>
            <div style={{ background: '#1c1c27', border: '1px solid #2a2a3a', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#6b6880',
                    animation: 'pulse 1.4s infinite',
                    animationDelay: `${i * 0.2}s`
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Context indicator */}
      {contextUsed && lastTopic && (
        <div style={{ margin: '0 20px 8px', background: '#0f0d1a', border: '1px solid #2a2040', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#8a7fb0' }}>
          ⬡ Past {lastTopic} knowledge was used to improve this answer
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2a3a', background: '#111118' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask anything... (e.g. 'Explain binary search')"
            rows={1}
            style={{
              flex: 1, background: '#16161f', border: '1px solid #2a2a3a',
              borderRadius: 10, padding: '10px 14px', color: '#e8e6f0',
              fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              background: loading ? '#3a3850' : '#7c6af7', border: 'none',
              borderRadius: 10, padding: '10px 18px', color: '#fff',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
              cursor: loading ? 'default' : 'pointer'
            }}
          >
            {loading ? '...' : 'Ask →'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#4a4860', marginTop: 6 }}>
          Enter to send · Every answer auto-saved to memory
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,60%,100%{opacity:0.3} 30%{opacity:1} }
      `}</style>
    </div>
  );
}
