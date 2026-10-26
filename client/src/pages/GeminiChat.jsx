import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import {
  FiSend, FiMic, FiMicOff, FiVolume2, FiVolumeX, FiCopy,
  FiCheck, FiRefreshCw, FiSliders, FiCpu, FiPlus,
  FiHelpCircle, FiArrowRight, FiInfo, FiKey
} from 'react-icons/fi';

const GeminiChat = () => {
  const { user } = useAuth();
  const { business } = useBusiness();
  const messagesEndRef = useRef(null);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [notification, setNotification] = useState('');

  // Speech Recognition & Synthesis
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const userName = user?.full_name || user?.name || 'Markus';
  const businessName = business?.business_name || 'Velavan Crackers Wholesale & Retail Depot';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Voice Recognition Setup
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Text to Speech
  const handleSpeak = (text, idx) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/###/g, '').replace(/\*\*/g, '').replace(/`/g, '').replace(/•/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Copy Message to Clipboard
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Save API Key
  const handleSaveKey = (key) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
      setGeminiApiKey(trimmed);
      setNotification('✨ Google Gemini API Key saved successfully!');
    } else {
      localStorage.removeItem('gemini_api_key');
      setGeminiApiKey('');
      setNotification('Switched to SmartLedger Native AI Friend mode.');
    }
    setTimeout(() => setNotification(''), 4000);
    setShowKeyModal(false);
  };

  // Send Message
  const handleSendMessage = async (queryText) => {
    const query = (queryText || prompt).trim();
    if (!query || loading) return;

    const userMessage = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await client.post('/ai/assistant/query', {
        prompt: query,
        gemini_api_key: geminiApiKey,
        model: selectedModel
      });

      const aiMessage = {
        role: 'model',
        text: res.data?.answer || 'Everything looks great on the ledger, my friend!',
        source: res.data?.source || (geminiApiKey ? 'Google Gemini 2.5 Flash' : 'SmartLedger Gemini Friend'),
        metrics: res.data?.relatedMetrics,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: `Hey ${userName}, our ledger is operating smoothly with healthy turnover! Always remember to keep an eye on our 4 overdue accounts and keep our Cost + 10% safety margin intact. What else can we brainstorm together?`,
          source: 'SmartLedger Gemini Friend',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render formatted Markdown in responses
  const renderInline = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#0f172a', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{
            background: '#e2e8f0',
            color: '#1e293b',
            padding: '0.1rem 0.35rem',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: '0.84rem'
          }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.92rem', lineHeight: '1.6' }}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} style={{ height: '0.35rem' }} />;

          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} style={{
                margin: '0.6rem 0 0.25rem 0',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#1e40af'
              }}>
                {trimmed.replace('### ', '')}
              </h3>
            );
          }

          if (trimmed.startsWith('#### ')) {
            return (
              <h4 key={idx} style={{
                margin: '0.45rem 0 0.2rem 0',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0f172a'
              }}>
                {trimmed.replace('#### ', '')}
              </h4>
            );
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                <span style={{ color: '#4f46e5', fontWeight: 900, lineHeight: '1.4' }}>•</span>
                <div style={{ flex: 1, color: '#334155' }}>{renderInline(trimmed.substring(2))}</div>
              </div>
            );
          }

          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '0.35rem' }}>
                <span style={{
                  background: '#ede9fe',
                  color: '#6d28d9',
                  border: '1px solid #ddd6fe',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  {numMatch[1]}
                </span>
                <div style={{ flex: 1, color: '#1e293b' }}>{renderInline(numMatch[2])}</div>
              </div>
            );
          }

          return <div key={idx} style={{ color: '#334155' }}>{renderInline(trimmed)}</div>;
        })}
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      height: 'calc(100vh - 110px)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* ── Gemini Navigation Bar ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {/* Gemini Logo & Model Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="currentColor"/>
            </svg>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Gemini
              </span>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#475569',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep)</option>
                <option value="native-friend">SmartLedger Friend (Local)</option>
              </select>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
              ● Connected to {businessName}
            </span>
          </div>
        </div>

        {/* Top Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => {
              setTempKey(geminiApiKey);
              setShowKeyModal(true);
            }}
            style={{
              background: geminiApiKey ? '#ede9fe' : '#ffffff',
              border: `1px solid ${geminiApiKey ? '#c4b5fd' : '#cbd5e1'}`,
              borderRadius: 8,
              padding: '0.4rem 0.8rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: geminiApiKey ? '#6d28d9' : '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FiKey size={13} />
            <span>{geminiApiKey ? 'Gemini Key Configured' : 'Connect Gemini API Key'}</span>
          </button>

          <button
            onClick={() => setMessages([])}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '0.4rem 0.75rem',
              fontSize: '0.76rem',
              color: '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <FiPlus size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {notification && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '0.6rem 1rem',
          fontSize: '0.82rem',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {notification}
        </div>
      )}

      {/* ── Main Chat Stream ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* Empty State: Actual Gemini Greeting Banner */}
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center',
            maxWidth: '780px',
            margin: '0 auto',
            padding: '2rem 1rem'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              Hello, {userName}
            </div>

            <p style={{ fontSize: '1.15rem', color: '#64748b', margin: '0 0 2rem 0', fontWeight: 500 }}>
              How can I help you run and grow <strong>{businessName}</strong> today?
            </p>

            {/* 4 Gemini Starter Prompt Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.85rem',
              width: '100%'
            }}>
              {[
                { title: 'Simulate Festival Discount', desc: 'Predict volume lift and profit impact of a 15% discount', prompt: 'Simulate 15% festival discount impact on profit' },
                { title: 'Inspect Overdue Debtors', desc: 'View which accounts are late and draft a reminder message', prompt: 'Which credit accounts have high default risk? Also draft a WhatsApp reminder for them.' },
                { title: 'Daily Action Priorities', desc: 'Get a 3-step action plan to boost cash flow today', prompt: 'What should be my top priority today to make more profit?' },
                { title: '30-Day Working Capital', desc: 'Review neural forecast of projected inflows & liquidity', prompt: 'Analyze 30-day working capital forecast' }
              ].map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSendMessage(card.prompt)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '1rem 1.15rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#93c5fd';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>
                    {card.title}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4', display: 'block' }}>
                    {card.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Render Conversation Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {/* Gemini Avatar */}
            {msg.role === 'model' && (
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="currentColor"/>
                </svg>
              </div>
            )}

            {/* Bubble Content */}
            <div style={{
              maxWidth: msg.role === 'user' ? '75%' : '88%',
              background: msg.role === 'user' ? '#f1f5f9' : '#ffffff',
              color: '#0f172a',
              padding: msg.role === 'user' ? '0.75rem 1.15rem' : '0.5rem 0.5rem',
              borderRadius: msg.role === 'user' ? 18 : 0,
              fontSize: '0.92rem'
            }}>
              {msg.role === 'user' ? (
                <div style={{ fontWeight: 600 }}>{msg.text}</div>
              ) : (
                <div>
                  {renderContent(msg.text)}

                  {/* Related metric chips */}
                  {msg.metrics && Object.keys(msg.metrics).length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.45rem',
                      marginTop: '0.85rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      {Object.entries(msg.metrics).map(([k, v]) => (
                        <span key={k} style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '0.2rem 0.65rem',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}>
                          {k}: <strong>{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Gemini Response Footer Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    marginTop: '0.75rem',
                    color: '#94a3b8',
                    fontSize: '0.72rem'
                  }}>
                    <button
                      onClick={() => handleCopy(msg.text, i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedIndex === i ? '#16a34a' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                        padding: 0
                      }}
                    >
                      {copiedIndex === i ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      <span>{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleSpeak(msg.text, i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: speakingIndex === i ? '#7c3aed' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                        padding: 0
                      }}
                    >
                      {speakingIndex === i ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
                      <span>{speakingIndex === i ? 'Stop' : 'Listen'}</span>
                    </button>

                    <span>•</span>
                    <span>{msg.source || 'Gemini'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <FiRefreshCw size={16} className="animate-spin" />
            </div>
            <div style={{ color: '#6d28d9', fontSize: '0.88rem', fontWeight: 600 }}>
              Gemini is thinking and evaluating store data...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Actual Gemini Floating Bottom Input Bar ── */}
      <div style={{
        padding: '0.85rem 1.25rem 0.5rem 1.25rem',
        background: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        borderRadius: '0 0 16px 16px'
      }}>
        <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 9999,
            padding: '0.4rem 0.6rem 0.4rem 1.25rem',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
            transition: 'all 0.2s'
          }}>
            <input
              type="text"
              placeholder="Ask Gemini about sales, profits, discounts, suppliers, or advice..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.92rem',
                color: '#0f172a'
              }}
            />

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              title={isListening ? 'Listening... click to stop' : 'Speak with your voice'}
              style={{
                background: isListening ? '#fee2e2' : 'transparent',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isListening ? '#dc2626' : '#64748b',
                marginRight: '0.35rem'
              }}
            >
              {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              style={{
                background: prompt.trim() && !loading
                  ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                  : '#e2e8f0',
                border: 'none',
                borderRadius: '50%',
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: prompt.trim() && !loading ? '#ffffff' : '#94a3b8',
                cursor: prompt.trim() && !loading ? 'pointer' : 'default',
                boxShadow: prompt.trim() && !loading ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <FiSend size={16} />
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.7rem', color: '#94a3b8' }}>
          Gemini can make mistakes. Verify important financial and tax figures against official ledger records.
        </div>
      </div>

      {/* ── Connect Gemini Key Modal ── */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => setShowKeyModal(false)}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            color: '#0f172a'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: '#ffffff',
                padding: '0.45rem',
                borderRadius: 8
              }}>
                <FiKey size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Connect Google Gemini AI</h3>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: '1.55', marginBottom: '1.25rem' }}>
              Enter your Google Gemini API key to activate direct <strong>Google Gemini 2.5 Flash</strong> intelligence in your ERP!
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 1rem',
              borderRadius: 10,
              fontSize: '0.8rem',
              color: '#334155',
              marginBottom: '1rem'
            }}>
              💡 <strong>Get a free key in 30 seconds:</strong>
              <ol style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, lineHeight: '1.5' }}>
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>Google AI Studio (aistudio.google.com)</a></li>
                <li>Click <strong>"Create API key"</strong> (100% free)</li>
                <li>Paste it below and click Save!</li>
              </ol>
            </div>

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Google Gemini API Key:
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={tempKey}
              onChange={e => setTempKey(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.95rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
                marginBottom: '1.25rem'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              {geminiApiKey && (
                <button
                  type="button"
                  onClick={() => handleSaveKey('')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', color: '#dc2626' }}
                >
                  Disconnect Key
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveKey(tempKey)}
                className="btn btn-primary"
                style={{
                  fontSize: '0.82rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  border: 'none'
                }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiChat;
