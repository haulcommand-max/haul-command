"use client";

import { useState, useRef, useEffect } from "react";

/**
 * /chat — AI Gateway (brand-upgraded)
 * Mobile-first chat UI matching HC design language.
 */
export default function AIChatPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user' as const, content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input: userMsg.content }),
            });
            const data = await res.json();
            if (data.error) throw new Error(JSON.stringify(data.error));
            setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', minHeight: '100dvh',
            background: '#050508', color: '#e5e7eb',
            fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)",
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(5,5,8,0.92)', backdropFilter: 'blur(16px)',
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <span style={{ fontSize: 22 }}>ðŸ’¬</span>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb' }}>AI Gateway</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Powered by GPT-4o "¢ Secure server-side proxy</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'block' }} />
                    <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Online</span>
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, opacity: 0.4 }}>
                        <span style={{ fontSize: 48 }}>ðŸ’¬</span>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>Ask Haul Command</div>
                        <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', maxWidth: 320 }}>
                            Platform support, dispatch questions, permit regulations — ask anything.
                        </div>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                            maxWidth: '80%', padding: '12px 16px', borderRadius: 14,
                            background: msg.role === 'user'
                                ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                                : 'rgba(255,255,255,0.06)',
                            color: msg.role === 'user' ? '#030712' : '#e5e7eb',
                            border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                            fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div style={{ display: 'flex', gap: 6, padding: '12px 16px' }}>
                        {[0, 1, 2].map(i => (
                            <span key={i} style={{
                                width: 8, height: 8, borderRadius: '50%', background: '#F59E0B',
                                animation: `chatpulse 1s ease-in-out ${i * 0.15}s infinite`,
                            }} />
                        ))}
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} style={{
                padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(5,5,8,0.92)', display: 'flex', gap: 10,
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Haul Command..."
                    style={{
                        flex: 1, padding: '12px 16px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, color: '#f9fafb', fontSize: 14,
                        outline: 'none', fontFamily: 'inherit',
                    }}
                />
                <button aria-label="Interactive Button" type="submit" disabled={!input.trim() || loading} style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    border: 'none', borderRadius: 12, color: '#030712',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    opacity: (!input.trim() || loading) ? 0.4 : 1,
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>
                    Send âš¡
                </button>
            </form>

            <style>{`
                @keyframes chatpulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}