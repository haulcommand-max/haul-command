'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
// Lightweight markdown renderer — no external dependency needed
function MarkdownBlock({ content, T }: { content: string; T: Record<string, string> }) {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    function renderInline(text: string): React.ReactNode {
        // Bold **text**
        const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return parts.map((p, idx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
                return <strong key={idx} style={{ color: T.gold, fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
            }
            if (p.startsWith('`') && p.endsWith('`')) {
                return <code key={idx} style={{ background: 'rgba(59,164,255,0.1)', color: T.blue, padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{p.slice(1, -1)}</code>;
            }
            return p;
        });
    }

    while (i < lines.length) {
        const line = lines[i];
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: '20px 0 8px', letterSpacing: '-0.01em' }}>{line.slice(3)}</h2>);
        } else if (line.startsWith('### ')) {
            elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: T.gold, margin: '16px 0 6px' }}>{line.slice(4)}</h3>);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
                items.push(<li key={i} style={{ color: '#9fb3c8', lineHeight: 1.6, marginBottom: 2 }}>{renderInline(lines[i].slice(2))}</li>);
                i++;
            }
            elements.push(<ul key={`ul-${i}`} style={{ margin: '6px 0 10px', paddingLeft: 20 }}>{items}</ul>);
            continue;
        } else if (line.trim() === '') {
            // skip empty
        } else {
            elements.push(<p key={i} style={{ margin: '0 0 10px', color: '#cfd8e3', lineHeight: 1.7 }}>{renderInline(line)}</p>);
        }
        i++;
    }

    return <div style={{ fontSize: 14, fontFamily: "'Inter', system-ui" }}>{elements}</div>;
}

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE COPILOT — Jurisdiction-Aware Regulation Q&A
// The #1 free tool on the site. Drives SEO from every state.
// ═══════════════════════════════════════════════════════════════

const US_STATES = [
    ['', 'All States / General'],
    ['US-AL', 'Alabama'], ['US-AK', 'Alaska'], ['US-AZ', 'Arizona'],
    ['US-AR', 'Arkansas'], ['US-CA', 'California'], ['US-CO', 'Colorado'],
    ['US-CT', 'Connecticut'], ['US-DE', 'Delaware'], ['US-FL', 'Florida'],
    ['US-GA', 'Georgia'], ['US-HI', 'Hawaii'], ['US-ID', 'Idaho'],
    ['US-IL', 'Illinois'], ['US-IN', 'Indiana'], ['US-IA', 'Iowa'],
    ['US-KS', 'Kansas'], ['US-KY', 'Kentucky'], ['US-LA', 'Louisiana'],
    ['US-ME', 'Maine'], ['US-MD', 'Maryland'], ['US-MA', 'Massachusetts'],
    ['US-MI', 'Michigan'], ['US-MN', 'Minnesota'], ['US-MS', 'Mississippi'],
    ['US-MO', 'Missouri'], ['US-MT', 'Montana'], ['US-NE', 'Nebraska'],
    ['US-NV', 'Nevada'], ['US-NH', 'New Hampshire'], ['US-NJ', 'New Jersey'],
    ['US-NM', 'New Mexico'], ['US-NY', 'New York'], ['US-NC', 'North Carolina'],
    ['US-ND', 'North Dakota'], ['US-OH', 'Ohio'], ['US-OK', 'Oklahoma'],
    ['US-OR', 'Oregon'], ['US-PA', 'Pennsylvania'], ['US-RI', 'Rhode Island'],
    ['US-SC', 'South Carolina'], ['US-SD', 'South Dakota'], ['US-TN', 'Tennessee'],
    ['US-TX', 'Texas'], ['US-UT', 'Utah'], ['US-VT', 'Vermont'],
    ['US-VA', 'Virginia'], ['US-WA', 'Washington'], ['US-WV', 'West Virginia'],
    ['US-WI', 'Wisconsin'], ['US-WY', 'Wyoming'],
    ['CA-AB', 'Alberta'], ['CA-BC', 'British Columbia'], ['CA-MB', 'Manitoba'],
    ['CA-NB', 'New Brunswick'], ['CA-NL', 'Newfoundland'], ['CA-NS', 'Nova Scotia'],
    ['CA-ON', 'Ontario'], ['CA-PE', 'Prince Edward Island'], ['CA-QC', 'Quebec'],
    ['CA-SK', 'Saskatchewan'],
] as const;

const EXAMPLE_QUESTIONS = [
    'Do I need a height pole escort in Texas for a 15\'6" load?',
    'What are the night travel restrictions in California for oversize loads?',
    'When does Florida require a police escort instead of a pilot car?',
    'What is the maximum width in Ohio before I need two escort vehicles?',
    'Are there weekend travel bans for oversize loads in Pennsylvania?',
    'What permits are required for a wide load exceeding 16 feet in Georgia?',
];

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: { label: string; url: string }[];
    cached?: boolean;
    loading?: boolean;
}

export default function ComplianceCopilotPage() {
    const [question, setQuestion] = useState('');
    const [jurisdiction, setJurisdiction] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        const q = question.trim();
        if (!q || loading) return;

        const userMsg: Message = { role: 'user', content: q };
        const placeholderMsg: Message = {
            role: 'assistant',
            content: '',
            loading: true,
        };

        setMessages(prev => [...prev, userMsg, placeholderMsg]);
        setQuestion('');
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/copilot/compliance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q,
                    jurisdiction_code: jurisdiction || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Request failed');
            }

            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    role: 'assistant',
                    content: data.answer,
                    sources: data.sources ?? [],
                    cached: data.cached,
                },
            ]);
        } catch (err: any) {
            setMessages(prev => prev.slice(0, -1));
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function useExample(q: string) {
        setQuestion(q);
        inputRef.current?.focus();
    }

    const T = {
        bg: '#060b12',
        surface: '#0d1520',
        elevated: '#111d2b',
        border: 'rgba(255,255,255,0.08)',
        borderStrong: 'rgba(255,255,255,0.14)',
        gold: '#f5b942',
        green: '#27d17f',
        blue: '#3ba4ff',
        text: '#ffffff',
        muted: '#8fa3b8',
        subtle: '#3d5166',
    };

    return (
        <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* ── Hero Header */}
            <div style={{
                background: `linear-gradient(180deg, rgba(245,185,66,0.06) 0%, transparent 100%)`,
                borderBottom: `1px solid ${T.border}`,
                padding: '48px 24px 32px',
                textAlign: 'center',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '4px 14px', borderRadius: 99,
                    background: 'rgba(245,185,66,0.08)',
                    border: '1px solid rgba(245,185,66,0.2)',
                    marginBottom: 20,
                }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                        Free Tool
                    </span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.gold, opacity: 0.5 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Powered by Claude AI</span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(28px, 5vw, 48px)',
                    fontWeight: 900,
                    color: T.text,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    margin: '0 0 16px',
                    fontFamily: "'Space Grotesk', system-ui",
                }}>
                    Compliance Copilot
                </h1>

                <p style={{
                    fontSize: 'clamp(15px, 2.5vw, 18px)',
                    color: T.muted,
                    maxWidth: 560,
                    margin: '0 auto 24px',
                    lineHeight: 1.6,
                }}>
                    Ask any question about oversize load escort regulations, height pole requirements,
                    night travel bans, permit thresholds — any state, any jurisdiction.
                </p>

                {/* Trust bar */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '8px 24px',
                    justifyContent: 'center',
                    fontSize: 12, color: T.subtle, fontWeight: 600,
                }}>
                    {['All 50 US States', '10 Canadian Provinces', 'Free — No Login Required', 'Answers in seconds'].map(t => (
                        <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: T.green }}>✓</span> {t}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, maxWidth: 800, width: '100%', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column' }}>

                {/* ── Example questions (shown when no messages) */}
                {messages.length === 0 && (
                    <div style={{ padding: '32px 0' }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: T.subtle, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>
                            Common questions
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {EXAMPLE_QUESTIONS.map(q => (
                                <button aria-label="Interactive Button" data-tool-interact
                                    key={q}
                                    onClick={() => useExample(q)}
                                    style={{
                                        textAlign: 'left', padding: '12px 16px',
                                        background: T.surface,
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 12, cursor: 'pointer',
                                        fontSize: 14, color: T.muted,
                                        transition: 'all 0.15s',
                                        fontFamily: "'Inter', system-ui",
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = `rgba(245,185,66,0.35)`;
                                        (e.currentTarget as HTMLElement).style.color = T.text;
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = T.border;
                                        (e.currentTarget as HTMLElement).style.color = T.muted;
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Message thread */}
                {messages.length > 0 && (
                    <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {messages.map((msg, i) => (
                            <div key={i}>
                                {msg.role === 'user' ? (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <div style={{
                                            maxWidth: '80%', padding: '12px 16px',
                                            background: 'rgba(245,185,66,0.1)',
                                            border: '1px solid rgba(245,185,66,0.2)',
                                            borderRadius: '16px 16px 4px 16px',
                                            fontSize: 14, color: T.text, lineHeight: 1.6,
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: T.surface,
                                        border: `1px solid ${T.border}`,
                                        borderRadius: '4px 16px 16px 16px',
                                        padding: '20px 24px',
                                        position: 'relative',
                                    }}>
                                        {/* Model badge */}
                                        <div style={{
                                            position: 'absolute', top: -10, left: 16,
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '2px 10px',
                                            background: T.surface,
                                            border: `1px solid ${T.border}`,
                                            borderRadius: 99,
                                            fontSize: 9, fontWeight: 700, color: T.subtle,
                                            textTransform: 'uppercase', letterSpacing: '0.12em',
                                        }}>
                                            <span style={{ color: T.gold }}>⚖</span>
                                            Compliance Copilot
                                            {msg.cached && <span style={{ color: T.green, marginLeft: 4 }}>· Cached</span>}
                                        </div>

                                        {msg.loading ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                                                <div style={{
                                                    display: 'flex', gap: 4,
                                                }}>
                                                    {[0, 1, 2].map(n => (
                                                        <span key={n} style={{
                                                            width: 6, height: 6, borderRadius: '50%',
                                                            background: T.gold, opacity: 0.7,
                                                            animation: `pulse-dot 1.2s ease-in-out ${n * 0.2}s infinite`,
                                                        }} />
                                                    ))}
                                                </div>
                                                <span style={{ fontSize: 13, color: T.muted }}>Analyzing regulations...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <MarkdownBlock content={msg.content} T={T} />

                                                {/* Sources */}
                                                {msg.sources && msg.sources.length > 0 && (
                                                    <div style={{
                                                        marginTop: 16,
                                                        paddingTop: 14,
                                                        borderTop: `1px solid ${T.border}`,
                                                    }}>
                                                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.subtle, marginBottom: 8 }}>
                                                            Official Sources
                                                        </p>
                                                        {msg.sources.map((s, si) => (
                                                            <a key={si} href={s.url} target="_blank" rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                                    padding: '6px 10px', borderRadius: 8,
                                                                    background: 'rgba(59,164,255,0.06)',
                                                                    border: '1px solid rgba(59,164,255,0.15)',
                                                                    fontSize: 12, color: T.blue,
                                                                    textDecoration: 'none',
                                                                    marginBottom: 4,
                                                                }}>
                                                                <span>↗</span>
                                                                <span>{s.label}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}

                {/* ── Error */}
                {error && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(248,113,113,0.08)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        fontSize: 13, color: '#fca5a5', marginBottom: 16,
                    }}>
                        {error}
                    </div>
                )}

                {/* ── Input bar */}
                <div style={{
                    position: 'sticky', bottom: 0,
                    background: T.bg,
                    paddingTop: 12,
                    paddingBottom: 24,
                    borderTop: messages.length > 0 ? `1px solid ${T.border}` : 'none',
                }}>
                    {/* Jurisdiction picker */}
                    <div style={{ marginBottom: 10 }}>
                        <select data-tool-interact
                            value={jurisdiction}
                            onChange={e => setJurisdiction(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                borderRadius: 10,
                                color: jurisdiction ? T.text : T.muted,
                                fontSize: 13,
                                outline: 'none',
                                cursor: 'pointer',
                                fontFamily: "'Inter', system-ui",
                            }}
                        >
                            {US_STATES.map(([code, label]) => (
                                <option key={code} value={code}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Question textarea */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                ref={inputRef}
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="Ask a compliance question… (e.g. 'When do I need two escort vehicles in Texas?')"
                                rows={3}
                                maxLength={1000}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    paddingRight: 60,
                                    background: T.elevated,
                                    border: `1px solid ${T.borderStrong}`,
                                    borderRadius: 14,
                                    color: T.text,
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: "'Inter', system-ui",
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(245,185,66,0.4)')}
                                onBlur={e => (e.target.style.borderColor = T.borderStrong)}
                                disabled={loading}
                            />
                            <button aria-label="Interactive Button" data-tool-interact
                                type="submit"
                                disabled={loading || !question.trim()}
                                style={{
                                    position: 'absolute', right: 10, bottom: 10,
                                    width: 40, height: 40,
                                    borderRadius: 10,
                                    background: loading || !question.trim()
                                        ? 'rgba(245,185,66,0.15)'
                                        : `linear-gradient(135deg, ${T.gold}, #d97706)`,
                                    border: 'none',
                                    color: loading || !question.trim() ? T.subtle : '#0a0f16',
                                    fontSize: 18,
                                    cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {loading ? '⏳' : '↑'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: 11, color: T.subtle, margin: 0 }}>
                                Press Enter to send · Shift+Enter for new line
                            </p>
                            <p style={{ fontSize: 11, color: T.subtle, margin: 0 }}>
                                {question.length}/1000
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Footer CTA */}
            <div style={{
                borderTop: `1px solid ${T.border}`,
                padding: '32px 24px',
                textAlign: 'center',
                background: T.surface,
            }}>
                <p style={{ fontSize: 13, color: T.muted, margin: '0 0 16px' }}>
                    Need compliance tracking, permit generation, and state-by-state audit logs?
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link aria-label="Navigation Link" href="/tools/state-requirements" style={{
                        padding: '10px 20px', borderRadius: 10,
                        background: 'rgba(245,185,66,0.1)',
                        border: '1px solid rgba(245,185,66,0.25)',
                        color: T.gold, fontSize: 13, fontWeight: 700,
                        textDecoration: 'none',
                    }}>
                        State Requirements Table
                    </Link>
                    <Link aria-label="Navigation Link" href="/onboarding" style={{
                        padding: '10px 20px', borderRadius: 10,
                        background: `linear-gradient(135deg, ${T.gold}, #d97706)`,
                        color: '#0a0f16', fontSize: 13, fontWeight: 900,
                        textDecoration: 'none',
                    }}>
                        Get Your Operator Profile
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes pulse-dot {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
