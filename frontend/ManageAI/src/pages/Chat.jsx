import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatAPI } from '../api/client';

const TOPIC_COLORS = {
  Algorithms: '#059669',
  Programming: '#2563eb',
  Math: '#7c3aed',
  Physics: '#dc2626',
  Database: '#d97706',
  General: '#6b7280',
};

const TOPIC_BG = {
  Algorithms: '#ecfdf5',
  Programming: '#eff6ff',
  Math: '#f5f3ff',
  Physics: '#fef2f2',
  Database: '#fffbeb',
  General: '#f9fafb',
};

const generateId = () => Math.random().toString(36).slice(2, 11);

// ── Markdown components ─────────────────────────────────────
const mdComponents = {
  code({ inline, className, children }) {
    if (inline) {
      return (
        <code style={{
          background: '#f0eeff', padding: '2px 7px',
          borderRadius: 5, fontSize: '0.88em',
          color: '#6c5ce7', fontFamily: "'Fira Code', 'Consolas', monospace",
          border: '1px solid #ded9fb',
        }}>{children}</code>
      );
    }
    return (
      <pre style={{
        background: '#1e1b3a',
        border: '1px solid #2d2a50',
        borderRadius: 12, padding: '16px 18px',
        overflowX: 'auto', margin: '12px 0',
        boxShadow: '0 2px 12px rgba(108,92,231,0.12)',
      }}>
        <code style={{
          color: '#c4b5fd', fontSize: 13.5,
          fontFamily: "'Fira Code', 'Consolas', monospace", lineHeight: 1.7,
        }}>{children}</code>
      </pre>
    );
  },
  p: ({ children }) => <p style={{ margin: '0 0 10px', lineHeight: 1.76 }}>{children}</p>,
  ul: ({ children }) => <ul style={{ paddingLeft: 22, margin: '6px 0 10px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: 22, margin: '6px 0 10px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 5, lineHeight: 1.68 }}>{children}</li>,
  h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1640', margin: '16px 0 8px', lineHeight: 1.3 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1640', margin: '14px 0 7px', lineHeight: 1.3 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: 15.5, fontWeight: 600, color: '#6c5ce7', margin: '12px 0 6px' }}>{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '3px solid #c4b5fd', paddingLeft: 16, margin: '12px 0',
      color: '#7a7898', fontStyle: 'italic', background: '#f8f6ff',
      borderRadius: '0 8px 8px 0', padding: '10px 10px 10px 16px',
    }}>{children}</blockquote>
  ),
  strong: ({ children }) => <strong style={{ color: '#1a1640', fontWeight: 700 }}>{children}</strong>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#7c6af7', textDecoration: 'underline', textUnderlineOffset: 2 }}>{children}</a>,
};

// ── Message bubble ──────────────────────────────────────────
function MessageBubble({ msg, index }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const stripForSpeech = (text) => {
    return text
      .replace(/```[\s\S]*?```/g, 'code block.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/\[(.+?)\]\(.*?\)/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
  };

  const handleSpeak = () => {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = stripForSpeech(msg.content);
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US'
    );
    if (preferred) utterance.voice = preferred;
    utterance.rate   = 0.95;
    utterance.pitch  = 1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend   = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const isUser = msg.role === 'user';

  return (
    <div style={{
      padding: isUser ? '8px 0' : '12px 0',
      background: isUser ? 'transparent' : '#faf9ff',
      borderBottom: '1px solid #f0eeff',
    }}>
      <div style={{
        maxWidth: 760, margin: '0 auto',
        padding: '14px 28px',
        display: 'flex',
        gap: 14,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: isUser
            ? 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)'
            : 'linear-gradient(135deg, #7c6af7 0%, #3ecfcf 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800,
          color: isUser ? '#6c5ce7' : '#fff',
          marginTop: 2, letterSpacing: '-0.3px',
          boxShadow: isUser ? '0 1px 6px rgba(108,92,231,0.15)' : '0 2px 16px rgba(124,106,247,0.3)',
          flexShrink: 0,
        }}>
          {isUser ? 'U' : 'M'}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
            color: isUser ? '#6c5ce7' : '#7c6af7',
            marginBottom: 8,
          }}>
            {isUser ? 'You' : 'ManageAI'}
          </div>

          {/* Image (user-attached) */}
          {msg.image && (
            <div style={{ marginBottom: 12 }}>
              <img
                src={msg.image}
                alt="Attached"
                style={{
                  maxWidth: 340, maxHeight: 240, borderRadius: 12,
                  border: '2px solid #ede9fe',
                  display: 'block', objectFit: 'contain',
                  boxShadow: '0 2px 12px rgba(108,92,231,0.1)',
                }}
              />
            </div>
          )}

          {/* Text */}
          <div style={{ fontSize: 15, color: '#2d2a50', lineHeight: 1.74 }}>
            {isUser
              ? <p style={{ margin: 0, lineHeight: 1.68, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              : <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
            }
          </div>

          {/* Footer badges */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 12, flexWrap: 'wrap',
          }}>
            {msg.topic && (
              <span style={{
                fontSize: 11.5, padding: '3px 11px', borderRadius: 20,
                background: TOPIC_BG[msg.topic] || '#f9fafb',
                color: TOPIC_COLORS[msg.topic] || '#6b7280',
                border: `1px solid ${TOPIC_COLORS[msg.topic] || '#6b7280'}30`,
                fontWeight: 600,
              }}>{msg.topic}</span>
            )}
            {msg.saved && (
              <span style={{
                fontSize: 11.5, color: '#059669',
                display: 'flex', alignItems: 'center', gap: 4,
                fontWeight: 500,
              }}>
                <span style={{ fontSize: 11 }}>✓</span> saved to memory
              </span>
            )}
            {!isUser && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* TTS button */}
                <button
                  onClick={handleSpeak}
                  title={speaking ? 'Stop speaking' : 'Read aloud'}
                  style={{
                    background: speaking ? '#f0eeff' : 'none',
                    border: speaking ? '1px solid #c4b5fd' : 'none',
                    borderRadius: 6,
                    color: speaking ? '#7c6af7' : '#b0acd4',
                    cursor: 'pointer', fontSize: 13.5,
                    padding: speaking ? '3px 8px' : '2px 4px',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                  onMouseEnter={e => { if (!speaking) { e.currentTarget.style.color = '#7c6af7'; e.currentTarget.style.background = '#f0eeff'; }}}
                  onMouseLeave={e => { if (!speaking) { e.currentTarget.style.color = '#b0acd4'; e.currentTarget.style.background = 'none'; }}}
                >
                  {speaking
                    ? <><span style={{ fontSize: 11, animation: 'tts-pulse 1s infinite' }}>◼</span> <span style={{ fontSize: 11 }}>Stop</span></>
                    : <span>🔊</span>
                  }
                </button>

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? '#ecfdf5' : 'none',
                    border: 'none',
                    color: copied ? '#059669' : '#b0acd4',
                    cursor: 'pointer',
                    fontSize: 12, padding: '2px 4px',
                    borderRadius: 5,
                    transition: 'color 0.2s, background 0.2s',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                  onMouseEnter={e => { if (!copied) { e.currentTarget.style.color = '#7c6af7'; e.currentTarget.style.background = '#f0eeff'; }}}
                  onMouseLeave={e => { if (!copied) { e.currentTarget.style.color = '#b0acd4'; e.currentTarget.style.background = 'none'; }}}
                >
                  {copied ? '✓ Copied' : '⧉ Copy'}
                </button>
              </div>
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
    <div style={{ padding: '12px 0', background: '#faf9ff', borderBottom: '1px solid #f0eeff' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 28px', display: 'flex', gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: 'linear-gradient(135deg, #7c6af7 0%, #3ecfcf 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2,
          boxShadow: '0 2px 16px rgba(124,106,247,0.3)',
        }}>M</div>
        <div style={{ paddingTop: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: '#7c6af7', marginBottom: 12 }}>ManageAI</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
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
  const [listening, setListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const messages = session?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

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

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'en-US';
    recognition.maxAlternatives = 1;
    let finalTranscript = '';
    recognition.onstart = () => {
      setListening(true);
      setVoiceTranscript('');
      finalTranscript = '';
    };
    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t + ' ';
        else interim = t;
      }
      setVoiceTranscript((finalTranscript + interim).trim());
    };
    recognition.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed') {
        alert('Microphone access denied. Allow it in browser settings.');
      } else if (e.error === 'network') {
        alert('Network error. Make sure you have internet access — Chrome sends audio to Google servers for processing.');
      }
      setVoiceTranscript('');
    };
    recognition.onend = () => { setListening(false); };
    try { recognition.start(); }
    catch (err) { setListening(false); console.warn(err); }
  };

  const handleVoiceSend = () => {
    if (!voiceTranscript.trim()) return;
    setInput(voiceTranscript);
    setVoiceTranscript('');
    setTimeout(() => { sendMessageWithText(voiceTranscript); }, 50);
  };

  const handleVoiceDiscard = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setVoiceTranscript('');
  };

  const sendMessageWithText = async (text) => {
    if (!text.trim() || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: text.trim(), id: generateId() };
    const newMessages = [...messages, userMsg];
    const titleUpdate = messages.length <= 1
      ? { title: text.slice(0, 50) + (text.length > 50 ? '…' : '') }
      : {};
    onUpdate({ messages: newMessages, ...titleUpdate });
    setLoading(true);
    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
      const res = await chatAPI.sendMessage(text.trim(), history, null);
      const { answer, topic, context_used } = res.data;
      const assistantMsg = { role: 'assistant', content: answer, topic, saved: true, id: generateId() };
      onUpdate({ messages: [...newMessages, assistantMsg], topic });
      setLastTopic(topic);
      setContextUsed(!!context_used);
    } catch {
      onUpdate({ messages: [...newMessages, { role: 'assistant', content: '⚠️ Error connecting to the server.', id: generateId() }] });
    }
    setLoading(false);
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
        role: 'assistant', content: answer, topic, saved: true, id: generateId(),
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
      height: '100%', background: '#f5f4fe', position: 'relative',
    }}>
      <style>{`
        @keyframes tts-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes mic-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.3)} 50%{box-shadow:0 0 0 7px rgba(220,38,38,0)} }
        @keyframes manageai-pulse {
          0%, 60%, 100% { transform: scale(0.55); opacity: 0.3; }
          30% { transform: scale(1); opacity: 1; }
        }
        .input-box:focus-within {
          border-color: #a78bfa !important;
          box-shadow: 0 0 0 4px rgba(124,106,247,0.1) !important;
        }
        .attach-btn:hover { color: #7c6af7 !important; }
      `}</style>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8, background: '#f5f4fe' }}>
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id || i} msg={msg} index={i} />
        ))}
        {loading && <LoadingDots />}

        {/* Live voice preview bubble */}
        {(listening || voiceTranscript) && (
          <div style={{ padding: '8px 0', borderBottom: '1px solid #f0eeff' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 28px', display: 'flex', gap: 14, flexDirection: 'row-reverse' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                background: 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#6c5ce7', marginTop: 2,
              }}>U</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6c5ce7', marginBottom: 8, textAlign: 'right' }}>You</div>

                <div style={{
                  background: '#fff5f5',
                  border: '1.5px solid #fca5a5',
                  borderRadius: 12, padding: '14px 18px',
                  fontSize: 15, color: '#2d2a50', lineHeight: 1.65,
                  minHeight: 48, position: 'relative',
                  boxShadow: '0 1px 8px rgba(220,38,38,0.08)',
                }}>
                  {voiceTranscript || (
                    <span style={{ color: '#fca5a5', fontStyle: 'italic' }}>Listening…</span>
                  )}
                  {listening && (
                    <span style={{ display: 'inline-flex', gap: 4, marginLeft: 10, verticalAlign: 'middle' }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#f87171', display: 'inline-block',
                          animation: 'manageai-pulse 1.35s infinite',
                          animationDelay: i * 0.18 + 's',
                        }} />
                      ))}
                    </span>
                  )}
                </div>

                {voiceTranscript && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleVoiceDiscard}
                      style={{
                        background: '#fff5f5',
                        border: '1px solid #fca5a5',
                        borderRadius: 9, padding: '6px 14px',
                        color: '#ef4444', cursor: 'pointer',
                        fontSize: 13, fontWeight: 500,
                      }}
                    >✕ Discard</button>
                    <button
                      onClick={handleVoiceSend}
                      disabled={listening}
                      style={{
                        background: listening ? '#f5f4fe' : 'linear-gradient(135deg, #7c6af7, #5b4ecf)',
                        border: 'none', borderRadius: 9,
                        padding: '6px 18px',
                        color: listening ? '#b0acd4' : '#fff',
                        cursor: listening ? 'default' : 'pointer',
                        fontSize: 13, fontWeight: 700,
                        boxShadow: !listening ? '0 2px 10px rgba(124,106,247,0.35)' : 'none',
                      }}
                    >{listening ? 'Still listening…' : '↑ Send'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Context banner */}
      {contextUsed && lastTopic && (
        <div style={{ padding: '0 28px 8px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{
              background: '#f0eeff',
              border: '1px solid #c4b5fd',
              borderRadius: 10, padding: '9px 16px',
              fontSize: 13, color: '#6c5ce7',
              display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 500,
            }}>
              <span style={{ fontSize: 15 }}>⬡</span>
              Past <strong>{lastTopic}</strong> knowledge was retrieved to enhance this answer
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '8px 28px 22px', background: '#ffffff', flexShrink: 0, borderTop: '1px solid #ede9fe' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* Image preview strip */}
          {imagePreview && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    height: 72, width: 'auto', maxWidth: 120,
                    borderRadius: 10, objectFit: 'cover',
                    border: '2px solid #c4b5fd',
                    boxShadow: '0 2px 8px rgba(124,106,247,0.15)',
                  }}
                />
                <button
                  onClick={removeImage}
                  style={{
                    position: 'absolute', top: -8, right: -8,
                    background: '#ffffff', border: '1.5px solid #ede9fe',
                    borderRadius: '50%', width: 22, height: 22,
                    color: '#7a7898', cursor: 'pointer', fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }}
                >✕</button>
              </div>
              <span style={{ fontSize: 13, color: '#9d9bc0' }}>
                {imageFile?.name || 'Image attached'}
              </span>
            </div>
          )}

          {/* Input box */}
          <div
            className="input-box"
            style={{
              background: '#faf9ff',
              border: '1.5px solid #ede9fe',
              borderRadius: 16, padding: '14px 16px 12px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 6px rgba(108,92,231,0.06)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, attach an image, or use the mic…"
              rows={1}
              style={{
                width: '100%', background: 'transparent',
                border: 'none', outline: 'none',
                color: '#1a1640', fontSize: 15, lineHeight: 1.65,
                resize: 'none', overflow: 'hidden', maxHeight: 200,
              }}
            />

            {/* Toolbar row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 10, paddingTop: 10,
              borderTop: '1px solid #f0eeff',
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
                  background: imagePreview ? '#f0eeff' : 'none',
                  border: imagePreview ? '1px solid #c4b5fd' : 'none',
                  borderRadius: 7,
                  color: imagePreview ? '#7c6af7' : '#b0acd4',
                  cursor: 'pointer', fontSize: 17,
                  padding: '2px 6px', lineHeight: 1,
                  transition: 'color 0.18s, background 0.18s',
                }}
              >📎</button>

              {/* Mic button */}
              <button
                onClick={handleVoiceInput}
                title={listening ? 'Stop recording' : 'Voice input'}
                style={{
                  background: listening ? '#fff5f5' : 'none',
                  border: listening ? '1.5px solid #fca5a5' : 'none',
                  borderRadius: 8,
                  color: listening ? '#ef4444' : '#b0acd4',
                  cursor: 'pointer', fontSize: 16,
                  padding: listening ? '4px 10px' : '2px 6px',
                  lineHeight: 1,
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                  animation: listening ? 'mic-pulse 1.2s infinite' : 'none',
                }}
                onMouseEnter={e => { if (!listening) { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fff5f5'; }}}
                onMouseLeave={e => { if (!listening) { e.currentTarget.style.color = '#b0acd4'; e.currentTarget.style.background = 'none'; }}}
              >
                {listening
                  ? <><span>🔴</span><span style={{ fontSize: 11, fontWeight: 700 }}>Listening...</span></>
                  : <span>🎤</span>
                }
              </button>

              <div style={{ flex: 1 }} />

              <span style={{ fontSize: 12, color: '#c4bfe8' }}>
                Shift+Enter for new line
              </span>

              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!canSend}
                style={{
                  background: canSend
                    ? 'linear-gradient(135deg, #7c6af7 0%, #5b4ecf 100%)'
                    : '#f0eeff',
                  border: 'none', borderRadius: 10,
                  padding: '8px 20px',
                  color: canSend ? '#fff' : '#c4b5fd',
                  cursor: canSend ? 'pointer' : 'default',
                  fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: canSend ? '0 2px 14px rgba(124,106,247,0.4)' : 'none',
                }}
              >
                {loading ? (
                  <span style={{ letterSpacing: '0.1em' }}>···</span>
                ) : (
                  <>Send <span style={{ fontSize: 14 }}>↑</span></>
                )}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#c4bfe8', textAlign: 'center', marginTop: 10 }}>
            ManageAI can make mistakes — every answer is auto-saved to memory
          </div>
        </div>
      </div>
    </div>
  );
}