import { useState, useRef, useEffect, useCallback } from 'react';
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

const generateId = () => Math.random().toString(36).slice(2, 11);

// ── Markdown components ─────────────────────────────────────
const mdComponents = {
  code({ inline, className, children }) {
    if (inline) {
      return (
        <code style={{
          background: '#1a1830', padding: '2px 7px',
          borderRadius: 5, fontSize: '0.87em',
          color: '#c4b5fd', fontFamily: "'Fira Code', 'Consolas', monospace",
          border: '1px solid rgba(124,106,247,0.18)',
        }}>{children}</code>
      );
    }
    return (
      <pre style={{
        background: '#13121f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, padding: '14px 16px',
        overflowX: 'auto', margin: '10px 0',
      }}>
        <code style={{
          color: '#c4b5fd', fontSize: 13,
          fontFamily: "'Fira Code', 'Consolas', monospace", lineHeight: 1.65,
        }}>{children}</code>
      </pre>
    );
  },
  p: ({ children }) => <p style={{ margin: '0 0 10px', lineHeight: 1.72 }}>{children}</p>,
  ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '6px 0 10px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '6px 0 10px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 4, lineHeight: 1.65 }}>{children}</li>,
  h1: ({ children }) => <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e2e0f0', margin: '14px 0 8px', lineHeight: 1.3 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e0f0', margin: '12px 0 6px', lineHeight: 1.3 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: 14.5, fontWeight: 600, color: '#c4b5fd', margin: '10px 0 5px' }}>{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '3px solid #7c6af7', paddingLeft: 14, margin: '10px 0',
      color: '#8a88a8', fontStyle: 'italic',
    }}>{children}</blockquote>
  ),
  strong: ({ children }) => <strong style={{ color: '#e2e0f0', fontWeight: 600 }}>{children}</strong>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#7c6af7', textDecoration: 'underline' }}>{children}</a>,
};

// ── Message bubble ──────────────────────────────────────────
function MessageBubble({ msg, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const isUser = msg.role === 'user';

  return (
    <div style={{
      padding: isUser ? '6px 0' : '10px 0',
      background: isUser ? 'transparent' : 'rgba(255,255,255,0.018)',
      borderBottom: '1px solid rgba(255,255,255,0.028)',
    }}>
      <div style={{
        maxWidth: 740, margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        gap: 14,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}>
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: isUser
            ? 'linear-gradient(135deg, #1e3a2f 0%, #1a2040 100%)'
            : 'linear-gradient(135deg, #7c6af7 0%, #3ecfcf 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          marginTop: 2, letterSpacing: '-0.3px',
          boxShadow: isUser ? 'none' : '0 0 16px rgba(124,106,247,0.25)',
        }}>
          {isUser ? 'U' : 'M'}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em',
            color: isUser ? '#5a8c6a' : '#9b87f5',
            marginBottom: 7,
          }}>
            {isUser ? 'You' : 'ManageAI'}
          </div>

          {/* Image (user-attached) */}
          {msg.image && (
            <div style={{ marginBottom: 10 }}>
              <img
                src={msg.image}
                alt="Attached"
                style={{
                  maxWidth: 320, maxHeight: 220, borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'block', objectFit: 'contain',
                }}
              />
            </div>
          )}

          {/* Text */}
          <div style={{ fontSize: 14.5, color: '#d2d0e8', lineHeight: 1.7 }}>
            {isUser
              ? <p style={{ margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              : <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
            }
          </div>

          {/* Footer badges */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 10, flexWrap: 'wrap',
          }}>
            {msg.topic && (
              <span style={{
                fontSize: 11, padding: '2px 10px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                color: TOPIC_COLORS[msg.topic] || '#9ca3af',
                border: '1px solid rgba(255,255,255,0.07)',
                fontWeight: 500,
              }}>{msg.topic}</span>
            )}
            {msg.saved && (
              <span style={{
                fontSize: 11, color: '#34d399',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <span style={{ fontSize: 10 }}>✓</span> saved to memory
              </span>
            )}
            {!isUser && (
              <button
                onClick={handleCopy}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  color: copied ? '#34d399' : '#3a385a', cursor: 'pointer',
                  fontSize: 11, padding: '2px 0',
                  transition: 'color 0.2s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { if (!copied) e.currentTarget.style.color = '#7c6af7'; }}
                onMouseLeave={e => { if (!copied) e.currentTarget.style.color = '#3a385a'; }}
              >
                {copied ? '✓ Copied' : '⧉ Copy'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading dots ────────────────────────────────────────────
function LoadingDots() {
  return (
    <div style={{ padding: '10px 0', background: 'rgba(255,255,255,0.018)', borderBottom: '1px solid rgba(255,255,255,0.028)' }}>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '12px 24px', display: 'flex', gap: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #7c6af7 0%, #3ecfcf 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2,
          boxShadow: '0 0 16px rgba(124,106,247,0.25)',
        }}>M</div>
        <div style={{ paddingTop: 6 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em', color: '#9b87f5', marginBottom: 10 }}>ManageAI</div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c6af7, #3ecfcf)',
                animation: 'manageai-pulse 1.35s infinite ease-in-out',
                animationDelay: `${i * 0.18}s`,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Chat component ─────────────────────────────────────
export default function Chat({ session, onUpdate }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextUsed, setContextUsed] = useState(false);
  const [lastTopic, setLastTopic] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const messages = session?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10 MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !imageFile) || loading) return;

    const userContent = input.trim();
    const imgData = imagePreview;

    setInput('');
    removeImage();

    const userMsg = {
      role: 'user',
      content: userContent || '(image attached)',
      image: imgData || undefined,
      id: generateId(),
    };

    const newMessages = [...messages, userMsg];
    const titleUpdate = messages.length <= 1 && userContent
      ? { title: userContent.slice(0, 50) + (userContent.length > 50 ? '…' : '') }
      : {};

    onUpdate({ messages: newMessages, ...titleUpdate });
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const res = await chatAPI.sendMessage(userContent || 'Describe this image.', history, imgData);
      const { answer, topic, context_used } = res.data;

      const assistantMsg = {
        role: 'assistant',
        content: answer,
        topic,
        saved: true,
        id: generateId(),
      };

      onUpdate({ messages: [...newMessages, assistantMsg], topic });
      setLastTopic(topic);
      setContextUsed(!!context_used);
    } catch (err) {
      const errMsg = {
        role: 'assistant',
        content: '⚠️ Error connecting to the server. Please make sure the backend is running.',
        id: generateId(),
      };
      onUpdate({ messages: [...newMessages, errMsg] });
    }

    setLoading(false);
  }, [input, imageFile, imagePreview, loading, messages, onUpdate]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = (input.trim() || imageFile) && !loading;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: '#0c0c14', position: 'relative',
    }}>
      <style>{`
        @keyframes manageai-pulse {
          0%, 60%, 100% { transform: scale(0.55); opacity: 0.25; }
          30% { transform: scale(1); opacity: 1; }
        }
        .input-box:focus-within {
          border-color: rgba(124,106,247,0.45) !important;
          box-shadow: 0 0 0 3px rgba(124,106,247,0.08);
        }
        .attach-btn:hover { color: #7c6af7 !important; }
      `}</style>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id || i} msg={msg} index={i} />
        ))}
        {loading && <LoadingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Context banner */}
      {contextUsed && lastTopic && (
        <div style={{ padding: '0 24px 6px' }}>
          <div style={{ maxWidth: 740, margin: '0 auto' }}>
            <div style={{
              background: 'rgba(124,106,247,0.07)',
              border: '1px solid rgba(124,106,247,0.16)',
              borderRadius: 8, padding: '8px 14px',
              fontSize: 12, color: '#7a6e9e',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: '#7c6af7', fontSize: 14 }}>⬡</span>
              Past <strong style={{ color: '#9b87f5' }}>{lastTopic}</strong> knowledge was retrieved to enhance this answer
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '8px 24px 20px', background: '#0c0c14', flexShrink: 0 }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>

          {/* Image preview strip */}
          {imagePreview && (
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    height: 68, width: 'auto', maxWidth: 110,
                    borderRadius: 8, objectFit: 'cover',
                    border: '1px solid rgba(124,106,247,0.25)',
                  }}
                />
                <button
                  onClick={removeImage}
                  style={{
                    position: 'absolute', top: -7, right: -7,
                    background: '#1a1830', border: '1px solid #3a3860',
                    borderRadius: '50%', width: 20, height: 20,
                    color: '#9ca3af', cursor: 'pointer', fontSize: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >✕</button>
              </div>
              <span style={{ fontSize: 12, color: '#4a4870' }}>
                {imageFile?.name || 'Image attached'}
              </span>
            </div>
          )}

          {/* Input box */}
          <div
            className="input-box"
            style={{
              background: '#14132a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '12px 14px 10px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, or attach an image for visual analysis…"
              rows={1}
              style={{
                width: '100%', background: 'transparent',
                border: 'none', outline: 'none',
                color: '#e2e0f0', fontSize: 14.5, lineHeight: 1.62,
                resize: 'none', overflow: 'hidden', maxHeight: 200,
              }}
            />

            {/* Toolbar row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 8, paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button
                className="attach-btn"
                onClick={() => fileRef.current?.click()}
                title="Attach image (PNG, JPEG, GIF, WEBP)"
                style={{
                  background: 'none', border: 'none',
                  color: imagePreview ? '#7c6af7' : '#3d3b5a',
                  cursor: 'pointer', fontSize: 17,
                  padding: '2px 4px', lineHeight: 1,
                  transition: 'color 0.18s',
                }}
              >📎</button>

              <div style={{ flex: 1 }} />

              <span style={{ fontSize: 11, color: '#2e2c48' }}>
                Shift+Enter for new line
              </span>

              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!canSend}
                style={{
                  background: canSend
                    ? 'linear-gradient(135deg, #7c6af7 0%, #5b4ecf 100%)'
                    : '#1a1830',
                  border: 'none', borderRadius: 9,
                  padding: '7px 18px',
                  color: canSend ? '#fff' : '#3d3b5a',
                  cursor: canSend ? 'pointer' : 'default',
                  fontSize: 13.5, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: canSend ? '0 2px 12px rgba(124,106,247,0.35)' : 'none',
                }}
              >
                {loading ? (
                  <span style={{ letterSpacing: '0.1em', opacity: 0.7 }}>···</span>
                ) : (
                  <>Send <span style={{ fontSize: 13 }}>↑</span></>
                )}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#1e1c38', textAlign: 'center', marginTop: 8 }}>
            ManageAI can make mistakes — every answer is auto-saved to memory
          </div>
        </div>
      </div>
    </div>
  );
}