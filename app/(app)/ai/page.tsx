'use client';

import { useState, useRef, useEffect } from 'react';

const AGENTS = [
    { id: 'support_bot', name: '24/7 Support', icon: '💬', desc: 'Platform help', color: '#10B981' },
    { id: 'dispatch_brain', name: 'Dispatch Brain', icon: '🧠', desc: 'Parse load details', color: '#F59E0B' },
    { id: 'regulation_rag', name: 'Regulations', icon: '📜', desc: 'State/province rules', color: '#6366F1' },
    { id: 'route_survey', name: 'Route Survey', icon: '🛣️', desc: 'Generate surveys', color: '#EC4899' },
    { id: 'load_enhancer', name: 'Load Enhancer', icon: '📦', desc: 'Upgrade descriptions', color: '#8B5CF6' },
    { id: 'contract_gen', name: 'Contracts', icon: '📝', desc: 'Generate agreements', color: '#14B8A6' },
    { id: 'invoice_gen', name: 'Invoices', icon: '🧾', desc: 'Create invoices', color: '#F97316' },
    { id: 'onboarding_copilot', name: 'Profile Coach', icon: '🎯', desc: 'Optimize your profile', color: '#06B6D4' },
    { id: 'review_analyzer', name: 'Review Intel', icon: '⭐', desc: 'Analyze reviews', color: '#EAB308' },
    { id: 'ad_copy_gen', name: 'Ad Studio', icon: '🎨', desc: 'Generate ad copy', color: '#D946EF' },
    { id: 'content_factory', name: 'SEO Factory', icon: '🏭', desc: 'Generate page content', color: '#0EA5E9' },
    { id: 'anomaly_detector', name: 'Anomaly Scanner', icon: '📈', desc: 'Metrics analysis', color: '#EF4444' },
];

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    agent?: string;
    timestamp: number;
    usage?: { total_tokens: number };
}

export default function AICommandCenter() {
    const [activeAgent, setActiveAgent] = useState(AGENTS[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth >= 768);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg: Message = { role: 'user', content: input.trim(), timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`/api/ai/${activeAgent.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content }),
            });
            const data = await res.json();
            const assistantMsg: Message = {
                role: 'assistant',
                content: data.content || data.error || 'No response',
                agent: activeAgent.id,
                timestamp: Date.now(),
                usage: data.usage,
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `Error: ${err instanceof Error ? err.message : 'Network error'}`,
                timestamp: Date.now(),
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const switchAgent = (agent: typeof AGENTS[0]) => {
        setActiveAgent(agent);
        setMessages([]);
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#030712', color: '#E5E7EB', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)" }}>
            {/* Sidebar */}
            <div style={{
                width: sidebarOpen ? 280 : 0, overflow: 'hidden',
                background: '#0B1120', borderRight: '1px solid rgba(245,158,11,0.1)',
                transition: 'width 0.2s', display: 'flex', flexDirection: 'column',
            }}>
                <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: '#F59E0B', marginBottom: 4 }}>HAUL COMMAND</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB' }}>AI Command Center</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>12 agents • GPT-4o</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    {AGENTS.map(agent => (
                        <button
                            key={agent.id}
                            onClick={() => switchAgent(agent)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', marginBottom: 2,
                                background: activeAgent.id === agent.id ? 'rgba(245,158,11,0.12)' : 'transparent',
                                border: activeAgent.id === agent.id ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
                                borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                                color: activeAgent.id === agent.id ? '#F9FAFB' : '#9CA3AF',
                            }}
                        >
                            <span style={{ fontSize: 20 }}>{agent.icon}</span>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.name}</div>
                                <div style={{ fontSize: 11, color: '#6B7280' }}>{agent.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chat */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{
                    padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(11,17,32,0.8)', backdropFilter: 'blur(8px)',
                }}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 18 }}>☰</button>
                    <span style={{ fontSize: 24 }}>{activeAgent.icon}</span>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>{activeAgent.name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{activeAgent.desc} • Powered by GPT-4o</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        <span style={{ fontSize: 12, color: '#10B981' }}>Online</span>
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {messages.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, opacity: 0.5 }}>
                            <span style={{ fontSize: 48 }}>{activeAgent.icon}</span>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>Talk to {activeAgent.name}</div>
                            <div style={{ fontSize: 13, color: '#6B7280', maxWidth: 400, textAlign: 'center' }}>
                                {activeAgent.id === 'dispatch_brain' && 'Paste a load description and I\'ll extract dimensions, route, escort requirements, and estimated rate.'}
                                {activeAgent.id === 'regulation_rag' && 'Ask any question about state-specific escort and permit regulations. I\'ll cite the rules.'}
                                {activeAgent.id === 'support_bot' && 'Ask me anything about HAUL COMMAND — features, billing, profile setup, or troubleshooting.'}
                                {activeAgent.id === 'route_survey' && 'Give me origin, destination, and load dimensions — I\'ll generate a professional route survey.'}
                                {activeAgent.id === 'contract_gen' && 'Provide job details and I\'ll draft a professional escort service agreement.'}
                                {activeAgent.id === 'invoice_gen' && 'Give me the completed job information and I\'ll generate a branded invoice.'}
                                {activeAgent.id === 'load_enhancer' && 'Paste a rough load description and I\'ll transform it into a professional, parseable posting.'}
                                {activeAgent.id === 'onboarding_copilot' && 'Share your profile details and I\'ll suggest optimizations to get more bookings.'}
                                {activeAgent.id === 'review_analyzer' && 'Paste reviews and I\'ll analyze sentiment, trends, and actionable insights.'}
                                {activeAgent.id === 'ad_copy_gen' && 'Tell me the corridor and audience — I\'ll generate 5 ad variants.'}
                                {activeAgent.id === 'content_factory' && 'Tell me the page type and location — I\'ll write unique SEO content.'}
                                {activeAgent.id === 'anomaly_detector' && 'Paste daily metrics data and I\'ll flag anomalies and recommend actions.'}
                            </div>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                                maxWidth: '75%', padding: '12px 16px', borderRadius: 14,
                                background: msg.role === 'user' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : msg.role === 'system' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                                color: msg.role === 'user' ? '#030712' : msg.role === 'system' ? '#EF4444' : '#E5E7EB',
                                fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                            }}>
                                {msg.content}
                                {msg.usage && (
                                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 6, textAlign: 'right' }}>
                                        {msg.usage.total_tokens} tokens
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ display: 'flex', gap: 6, padding: '12px 16px' }}>
                            {[0, 1, 2].map(i => (
                                <span key={i} style={{
                                    width: 8, height: 8, borderRadius: '50%', background: '#F59E0B',
                                    animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                                }} />
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,17,32,0.8)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Message ${activeAgent.name}...`}
                            rows={1}
                            style={{
                                flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                                color: '#F9FAFB', fontSize: 14, resize: 'none', outline: 'none',
                                lineHeight: 1.5, maxHeight: 120, overflow: 'auto',
                                fontFamily: 'inherit',
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            style={{
                                padding: '12px 20px', background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                border: 'none', borderRadius: 12, color: '#030712', fontWeight: 700,
                                cursor: 'pointer', fontSize: 14, opacity: (!input.trim() || loading) ? 0.4 : 1,
                                transition: 'all 0.15s', whiteSpace: 'nowrap',
                            }}
                        >
                            Send ⚡
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}
