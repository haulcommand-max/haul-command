'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   AISearchBar — Claude-powered natural language search for directory
   Interprets queries like "pilot car in Houston" and returns structured filters
   Also includes floating AI assistant drawer for Q&A
   ═══════════════════════════════════════════════════════════════════ */

interface AISearchBarProps {
  onFiltersApplied: (filters: { search?: string; state?: string; serviceType?: string }) => void;
}

export function AISearchBar({ onFiltersApplied }: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [thinking, setThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleAISearch = async () => {
    if (!query.trim() || thinking) return;
    setThinking(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `You are a directory search assistant for Haul Command, a pilot car escort operator platform. Parse this search query and extract structured filters. Return ONLY valid JSON with these fields: { "search": "free text search terms", "state": "two-letter state code or empty", "serviceType": "pilot_car|height_pole|route_survey|wide_load|oversize or empty", "summary": "one-line human explanation of what you found" }. Query: "${query.trim()}"`,
          }],
          jsonMode: true,
        }),
      });

      const data = await res.json();
      const content = data.response || data.content || '';

      try {
        const parsed = JSON.parse(content);
        onFiltersApplied({
          search: parsed.search || '',
          state: parsed.state || '',
          serviceType: parsed.serviceType || '',
        });
        setAiResponse(parsed.summary || 'Filters applied');
      } catch {
        onFiltersApplied({ search: query });
        setAiResponse('Searching for: ' + query);
      }
    } catch {
      onFiltersApplied({ search: query });
      setAiResponse('Search applied (AI unavailable)');
    }
    setThinking(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.13)',
        borderRadius: 14, padding: '0 16px', height: 50,
      }}>
        <Sparkles size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Try: &quot;pilot car near Houston&quot; or &quot;height pole on I-10&quot;..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAISearch()}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 14, color: '#f0f4f8', caretColor: '#a78bfa',
          }}
        />
        <div style={{
          fontSize: 8, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase',
          letterSpacing: '0.1em', background: 'rgba(167,139,250,0.1)',
          padding: '2px 6px', borderRadius: 4, flexShrink: 0,
        }}>
          AI
        </div>
        <button aria-label="Interactive Button"
          onClick={handleAISearch}
          disabled={thinking}
          style={{
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            color: '#a78bfa', fontSize: 12, fontWeight: 700, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {thinking ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          {thinking ? 'Thinking...' : 'Search'}
        </button>
      </div>
      {aiResponse && (
        <div style={{
          marginTop: 8, padding: '8px 14px', borderRadius: 10,
          background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
          fontSize: 12, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Bot size={13} style={{ flexShrink: 0 }} />
          {aiResponse}
          <button aria-label="Interactive Button" onClick={() => setAiResponse(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', marginLeft: 'auto', padding: 0 }}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AIAssistantDrawer — Floating chat for compliance/rate questions
   ═══════════════════════════════════════════════════════════════════ */

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistantDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can help with escort requirements, rate questions, corridor intel, and more. What do you need?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `You are the Haul Command AI assistant. You help with oversize load escort requirements, pilot car regulations, rate benchmarks, corridor conditions, and general heavy haul questions. Be helpful, concise, and accurate. If unsure, say so. User question: ${userMsg.content}` },
          ],
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.content || 'I could not process that request.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button aria-label="Interactive Button"
        onClick={() => setOpen(!open)}
        className="ag-press"
        style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
          width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
          transition: 'transform 0.2s',
        }}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Drawer */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 140, right: 20, zIndex: 9998,
          width: 360, maxWidth: 'calc(100vw - 40px)', height: 480, maxHeight: 'calc(100vh - 200px)',
          background: '#0f1a26', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), transparent)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)',
            }}>
              <Sparkles size={16} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Haul Command AI</div>
              <div style={{ fontSize: 10, color: '#8fa3b8' }}>Powered by Claude</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '10px 14px', borderRadius: 14,
                background: msg.role === 'user' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.07)'}`,
                fontSize: 13, color: '#f0f4f8', lineHeight: 1.5,
              }}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: '#a78bfa' }} />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about rates, requirements..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#f0f4f8',
                  outline: 'none', caretColor: '#a78bfa',
                }}
              />
              <button aria-label="Interactive Button" onClick={send} disabled={loading} style={{
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#fff',
              }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AISearchBar;
