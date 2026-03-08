'use client';

import { useState, useEffect } from 'react';

interface TrainingProgram {
    id: string;
    title: string;
    provider: string;
    type: string;
    duration_hours: number;
    price: number;
    category: string;
    description: string;
    modules: string[];
    credential_on_completion: string;
    reputation_points: number;
    badge: string;
}

export default function TrainingPage() {
    const [programs, setPrograms] = useState<TrainingProgram[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/training')
            .then(r => r.json())
            .then(d => {
                if (d.training_programs) setPrograms(d.training_programs);
            })
            .catch(console.error);
    }, []);

    const categories = [
        { key: 'all', label: 'All Programs' },
        { key: 'certification', label: '🏅 Certifications' },
        { key: 'specialization', label: '🏆 Specializations' },
        { key: 'compliance', label: '📜 Compliance' },
        { key: 'broker', label: '📋 Broker Training' },
    ];

    const filteredPrograms = activeCategory === 'all' ? programs : programs.filter(p => p.category === activeCategory);

    const badgeEmojis: Record<string, string> = {
        certified_pilot: '🏅',
        height_pole_certified: '📏',
        superload_specialist: '🏆',
        dispatch_pro: '📋',
        regs_master: '📜',
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f',
            color: '#e0e0e6', fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>
            {/* Hero */}
            <div style={{
                background: 'linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #0d1117 100%)',
                padding: '60px 24px', textAlign: 'center',
                borderBottom: '1px solid #21262d',
            }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
                <h1 style={{
                    fontSize: 36, fontWeight: 800, margin: '0 0 12px',
                    background: 'linear-gradient(90deg, #ff6b00, #ff9500, #ffd700)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>HAUL COMMAND Academy</h1>
                <p style={{ color: '#8b949e', fontSize: 16, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                    Earn credentials, boost your reputation, and unlock premium jobs.
                    Every course completed directly improves your marketplace ranking.
                </p>
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24,
                }}>
                    {[
                        { value: '5', label: 'Programs' },
                        { value: '+15-30', label: 'Rep Points' },
                        { value: '4-16h', label: 'Durations' },
                        { value: '$99-349', label: 'Investment' },
                    ].map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9500' }}>{stat.value}</div>
                            <div style={{ fontSize: 12, color: '#8b949e' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Filter */}
            <div style={{
                maxWidth: 1000, margin: '24px auto', padding: '0 24px',
                display: 'flex', gap: 8, overflowX: 'auto',
            }}>
                {categories.map(cat => (
                    <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
                        padding: '8px 16px', fontSize: 13, fontWeight: 500,
                        background: activeCategory === cat.key ? '#ff9500' : '#161b22',
                        color: activeCategory === cat.key ? '#0a0a0f' : '#8b949e',
                        border: '1px solid', borderColor: activeCategory === cat.key ? '#ff9500' : '#21262d',
                        borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                    }}>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Programs Grid */}
            <div style={{
                maxWidth: 1000, margin: '0 auto', padding: '0 24px 60px',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20,
            }}>
                {filteredPrograms.map(prog => {
                    const isExpanded = expandedProgram === prog.id;
                    return (
                        <div key={prog.id} style={{
                            background: '#161b22', border: '1px solid #21262d', borderRadius: 16,
                            overflow: 'hidden', transition: 'border-color 0.3s, transform 0.2s',
                            cursor: 'pointer',
                        }}
                            onClick={() => setExpandedProgram(isExpanded ? null : prog.id)}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff9500'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {/* Top badge bar */}
                            <div style={{
                                background: 'linear-gradient(90deg, #ff6b0022, #ff950022)',
                                padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <span style={{ fontSize: 24 }}>{badgeEmojis[prog.badge] || '📚'}</span>
                                <span style={{
                                    background: prog.type === 'instructor_led' ? '#ffd70033' : '#00ff8833',
                                    color: prog.type === 'instructor_led' ? '#ffd700' : '#00ff88',
                                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                }}>{prog.type === 'instructor_led' ? 'INSTRUCTOR-LED' : 'SELF-PACED'}</span>
                            </div>

                            <div style={{ padding: '16px 20px' }}>
                                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{prog.title}</h3>
                                <p style={{ color: '#8b949e', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
                                    {prog.description.slice(0, 120)}{prog.description.length > 120 ? '...' : ''}
                                </p>

                                {/* Meta */}
                                <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
                                    <span style={{ color: '#8b949e' }}>⏱ {prog.duration_hours}h</span>
                                    <span style={{ color: '#00ff88' }}>+{prog.reputation_points} rep</span>
                                    <span style={{ color: '#ffd700' }}>{prog.credential_on_completion}</span>
                                </div>

                                {/* Expanded: modules */}
                                {isExpanded && (
                                    <div style={{
                                        background: '#0d1117', borderRadius: 8, padding: 12, marginBottom: 16,
                                        animation: 'fadeIn 0.3s',
                                    }}>
                                        <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8, fontWeight: 600 }}>MODULES</div>
                                        {prog.modules.map((mod, i) => (
                                            <div key={i} style={{
                                                padding: '6px 0', fontSize: 13, borderBottom: i < prog.modules.length - 1 ? '1px solid #161b22' : 'none',
                                            }}>
                                                <span style={{ color: '#ff9500', marginRight: 8 }}>{i + 1}.</span> {mod}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Price & CTA */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: 28, fontWeight: 800, color: '#00ff88' }}>${prog.price}</span>
                                        <span style={{ fontSize: 12, color: '#8b949e', marginLeft: 4 }}>one-time</span>
                                    </div>
                                    <button style={{
                                        background: 'linear-gradient(90deg, #ff6b00, #ff9500)',
                                        color: '#fff', border: 'none', borderRadius: 8,
                                        padding: '10px 20px', fontSize: 14, fontWeight: 700,
                                        cursor: 'pointer', transition: 'transform 0.2s',
                                    }}
                                        onClick={(e) => { e.stopPropagation(); alert(`Enrolling in ${prog.title}...`); }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >Enroll Now</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Credential Verification Section */}
            <div style={{
                background: '#161b22', borderTop: '1px solid #21262d',
                padding: '48px 24px',
            }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: 24, fontWeight: 700, margin: '0 0 8px', textAlign: 'center',
                        background: 'linear-gradient(90deg, #00ccff, #00ff88)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Credential Verification Services</h2>
                    <p style={{ color: '#8b949e', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>
                        Get verified to unlock dispatch-ready status and premium load matching
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {[
                            { title: 'Insurance Verify', price: '$29', time: '24h', icon: '🛡️', type: 'automated' },
                            { title: 'CDL Verification', price: '$19', time: '48h', icon: '🪪', type: 'automated' },
                            { title: 'Background Check', price: '$49', time: '72h', icon: '🔍', type: 'manual' },
                            { title: 'Equipment Inspect', price: 'FREE', time: '1h', icon: '📸', type: 'ai_assisted' },
                        ].map((svc, i) => (
                            <div key={i} style={{
                                background: '#0d1117', border: '1px solid #21262d', borderRadius: 12, padding: 20,
                                textAlign: 'center', transition: 'border-color 0.2s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#00ccff')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = '#21262d')}
                            >
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{svc.icon}</div>
                                <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>{svc.title}</h4>
                                <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 12 }}>{svc.time} turnaround • {svc.type}</div>
                                <div style={{
                                    fontSize: 22, fontWeight: 700,
                                    color: svc.price === 'FREE' ? '#00ff88' : '#ff9500',
                                    marginBottom: 12,
                                }}>{svc.price}</div>
                                <button style={{
                                    background: '#21262d', border: '1px solid #30363d', borderRadius: 6,
                                    padding: '6px 14px', color: '#e0e0e6', fontSize: 13, cursor: 'pointer',
                                    width: '100%',
                                }}>Submit</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
