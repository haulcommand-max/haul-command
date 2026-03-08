'use client';

import { useState, useEffect } from 'react';

interface FreshnessData {
    score: number;
    state: string;
    badges: string[];
    alerts: number;
}

interface RecoverySignal {
    type: string;
    severity: string;
    message: string;
    action_label: string;
    action_url: string;
    estimated_value: number;
}

export default function OperatorDashboardPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'freshness' | 'recovery' | 'loads' | 'training'>('overview');
    const [freshness, setFreshness] = useState<FreshnessData | null>(null);
    const [recoverySignals, setRecoverySignals] = useState<RecoverySignal[]>([]);

    // Mock data for display
    const stats = {
        profileViews30d: 47,
        searchImpressions30d: 312,
        leadsUnlocked: 3,
        reputationScore: 78,
        trustScore: 82,
        rankPosition: 14,
        boostTier: null as string | null,
        freshness: { score: 72, state: 'warm' },
        profileCompletion: 68,
    };

    const decayColors: Record<string, string> = {
        fresh: '#00ff88',
        warm: '#ffcc00',
        cooling: '#ff8800',
        stale: '#ff4444',
        dormant: '#666',
    };

    const tierColors: Record<string, string> = {
        elite: '#ffd700',
        strong: '#00ccff',
        standard: '#88ff88',
        developing: '#ffaa44',
        inactive: '#555',
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f',
            color: '#e0e0e6', fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                borderBottom: '1px solid #21262d',
                padding: '20px 24px',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <h1 style={{
                        fontSize: 24, fontWeight: 700, margin: 0,
                        background: 'linear-gradient(90deg, #ff6b00, #ff9500)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>HAUL COMMAND Dashboard</h1>
                    <p style={{ color: '#8b949e', margin: '4px 0 0', fontSize: 14 }}>Command Center • Operator View</p>
                </div>
            </header>

            {/* Quick Stats Banner */}
            <div style={{
                maxWidth: 1200, margin: '24px auto 0', padding: '0 24px',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16,
            }}>
                {[
                    { label: 'Profile Views', value: stats.profileViews30d, suffix: '/30d', color: '#00ccff' },
                    { label: 'Search Impressions', value: stats.searchImpressions30d, suffix: '/30d', color: '#ff9500' },
                    { label: 'Reputation', value: stats.reputationScore, suffix: '/100', color: '#00ff88' },
                    { label: 'Trust Score', value: stats.trustScore, suffix: '/100', color: '#ffd700' },
                    { label: 'Rank', value: `#${stats.rankPosition}`, suffix: '', color: '#ff6b00' },
                    { label: 'Freshness', value: stats.freshness.score, suffix: `(${stats.freshness.state})`, color: decayColors[stats.freshness.state] || '#888' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: '#161b22', border: '1px solid #21262d',
                        borderRadius: 12, padding: '16px 20px',
                        transition: 'border-color 0.2s',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = stat.color)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#21262d')}
                    >
                        <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, marginTop: 4 }}>
                            {stat.value}
                            {stat.suffix && <span style={{ fontSize: 12, color: '#8b949e', fontWeight: 400, marginLeft: 4 }}>{stat.suffix}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div style={{
                maxWidth: 1200, margin: '24px auto 0', padding: '0 24px',
                display: 'flex', gap: 4, borderBottom: '1px solid #21262d',
            }}>
                {(['overview', 'freshness', 'recovery', 'loads', 'training'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '10px 20px', fontSize: 14, fontWeight: 500,
                        background: activeTab === tab ? '#21262d' : 'transparent',
                        color: activeTab === tab ? '#ff9500' : '#8b949e',
                        border: 'none', borderBottom: activeTab === tab ? '2px solid #ff9500' : '2px solid transparent',
                        borderRadius: '8px 8px 0 0', cursor: 'pointer',
                        textTransform: 'capitalize', transition: 'all 0.2s',
                    }}>
                        {tab === 'recovery' ? '💰 Recovery' : tab === 'freshness' ? '⚡ Freshness' : tab === 'loads' ? '🚛 Loads' : tab === 'training' ? '🎓 Training' : '📊 Overview'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        {/* Profile Completion */}
                        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24 }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#e0e0e6' }}>Profile Completion</h3>
                            <div style={{ position: 'relative', height: 12, background: '#21262d', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${stats.profileCompletion}%`,
                                    background: stats.profileCompletion >= 80 ? 'linear-gradient(90deg, #00ff88, #00cc66)' : 'linear-gradient(90deg, #ff9500, #ff6b00)',
                                    borderRadius: 6, transition: 'width 0.5s',
                                }} />
                            </div>
                            <p style={{ color: '#8b949e', fontSize: 13, marginTop: 8 }}>{stats.profileCompletion}% complete — {100 - stats.profileCompletion}% to unlock full visibility</p>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24 }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#e0e0e6' }}>Quick Actions</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { label: 'Update Availability', icon: '📍', color: '#00ff88' },
                                    { label: 'Upload Documents', icon: '📄', color: '#00ccff' },
                                    { label: 'View Report Card', icon: '📊', color: '#ff9500' },
                                    { label: 'Purchase Boost', icon: '🚀', color: '#ffd700' },
                                ].map((action, i) => (
                                    <button key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        background: '#0d1117', border: '1px solid #21262d',
                                        borderRadius: 8, padding: '10px 16px',
                                        color: '#e0e0e6', fontSize: 14, cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                    }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = action.color)}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#21262d')}
                                    >
                                        <span>{action.icon}</span>
                                        <span>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24, gridColumn: '1 / -1' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#e0e0e6' }}>Recent Activity</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { time: '2h ago', text: 'Profile viewed by broker in Atlanta, GA', type: 'view' },
                                    { time: '5h ago', text: 'Appeared in 8 search results for "pilot car Florida"', type: 'search' },
                                    { time: '1d ago', text: 'Freshness score updated: 72 (warm)', type: 'freshness' },
                                    { time: '2d ago', text: 'New review received: ⭐⭐⭐⭐⭐ "Great escort service"', type: 'review' },
                                    { time: '3d ago', text: 'Rank improved from #18 to #14', type: 'rank' },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 12px', background: '#0d1117',
                                        borderRadius: 8, border: '1px solid #161b22',
                                    }}>
                                        <span style={{ fontSize: 13, flex: 1 }}>{item.text}</span>
                                        <span style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap', marginLeft: 16 }}>{item.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* FRESHNESS TAB */}
                {activeTab === 'freshness' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24 }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Freshness Score</h3>
                            <div style={{
                                width: 120, height: 120, borderRadius: '50%', margin: '0 auto',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `conic-gradient(${decayColors[stats.freshness.state]} ${stats.freshness.score * 3.6}deg, #21262d ${stats.freshness.score * 3.6}deg)`,
                            }}>
                                <div style={{
                                    width: 96, height: 96, borderRadius: '50%', background: '#161b22',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <span style={{ fontSize: 28, fontWeight: 700, color: decayColors[stats.freshness.state] }}>{stats.freshness.score}</span>
                                    <span style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase' }}>{stats.freshness.state}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24 }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Factor Breakdown</h3>
                            {[
                                { name: 'Availability', score: 85, weight: '35%' },
                                { name: 'Activity', score: 60, weight: '20%' },
                                { name: 'Responsiveness', score: 70, weight: '20%' },
                                { name: 'Documents', score: 100, weight: '15%' },
                                { name: 'Presence', score: 45, weight: '10%' },
                            ].map((f, i) => (
                                <div key={i} style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                        <span>{f.name} <span style={{ color: '#8b949e' }}>({f.weight})</span></span>
                                        <span style={{ color: f.score >= 80 ? '#00ff88' : f.score >= 50 ? '#ffcc00' : '#ff4444' }}>{f.score}</span>
                                    </div>
                                    <div style={{ height: 6, background: '#21262d', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${f.score}%`, borderRadius: 3,
                                            background: f.score >= 80 ? '#00ff88' : f.score >= 50 ? '#ffcc00' : '#ff4444',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RECOVERY TAB */}
                {activeTab === 'recovery' && (
                    <div>
                        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18 }}>Revenue Recovery Opportunities</h3>
                                    <p style={{ color: '#8b949e', fontSize: 13, margin: '4px 0 0' }}>Actions that could improve your visibility and revenue</p>
                                </div>
                                <div style={{
                                    background: '#0d1117', border: '1px solid #21262d', borderRadius: 8,
                                    padding: '8px 16px', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 11, color: '#8b949e' }}>ESTIMATED VALUE</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#00ff88' }}>$58<span style={{ fontSize: 14 }}>.97</span></div>
                                </div>
                            </div>
                        </div>

                        {[
                            { type: 'incomplete_profile', sev: 'medium', msg: 'Profile only 68% complete — missing out on visibility', action: 'Complete Your Profile', value: 9.99, color: '#ffcc00' },
                            { type: 'freshness_cooling', sev: 'medium', msg: 'Your freshness is cooling — a single update could boost your rank', action: 'Update Availability', value: 9.99, color: '#ffcc00' },
                            { type: 'missed_leads', sev: 'medium', msg: '3 lead unlock opportunities missed this month', action: 'Get Lead Credits', value: 25, color: '#ffcc00' },
                            { type: 'rank_boost', sev: 'low', msg: 'Purchase a boost to jump from #14 to top 5', action: 'View Boosts', value: 14.99, color: '#00ccff' },
                        ].map((sig, i) => (
                            <div key={i} style={{
                                background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20, marginBottom: 12,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderLeft: `3px solid ${sig.color}`,
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{sig.msg}</div>
                                    <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                                            background: sig.sev === 'high' ? '#ff444422' : sig.sev === 'medium' ? '#ffcc0022' : '#00ccff22',
                                            color: sig.sev === 'high' ? '#ff4444' : sig.sev === 'medium' ? '#ffcc00' : '#00ccff',
                                            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                                        }}>{sig.sev}</span>
                                        <span style={{ marginLeft: 8 }}>Potential value: ${sig.value}</span>
                                    </div>
                                </div>
                                <button style={{
                                    background: 'linear-gradient(90deg, #ff6b00, #ff9500)', color: '#fff',
                                    border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13,
                                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                                }}>{sig.action}</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* LOADS TAB */}
                {activeTab === 'loads' && (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <div style={{ fontSize: 48 - 0, marginBottom: 16 }}>🚛</div>
                        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Load Board Coming Soon</h3>
                        <p style={{ color: '#8b949e', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                            Get matched with loads automatically based on your location, equipment, and expertise.
                            Set your availability to start receiving load alerts.
                        </p>
                        <button style={{
                            marginTop: 24, background: 'linear-gradient(90deg, #ff6b00, #ff9500)',
                            color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>Set Your Availability</button>
                    </div>
                )}

                {/* TRAINING TAB */}
                {activeTab === 'training' && (
                    <div>
                        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Training & Credentials</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {[
                                { title: 'Pilot Car Fundamentals', price: 149, duration: '8 hours', badge: '🏅', points: 15 },
                                { title: 'Height Pole Operations', price: 99, duration: '4 hours', badge: '📏', points: 20 },
                                { title: 'Superload Escort Specialist', price: 349, duration: '16 hours', badge: '🏆', points: 30 },
                                { title: 'US State Regulations', price: 249, duration: '12 hours', badge: '📜', points: 25 },
                            ].map((prog, i) => (
                                <div key={i} style={{
                                    background: '#161b22', border: '1px solid #21262d', borderRadius: 12,
                                    padding: 20, transition: 'border-color 0.2s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#ff9500')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#21262d')}
                                >
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>{prog.badge}</div>
                                    <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>{prog.title}</h4>
                                    <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 12 }}>{prog.duration} • +{prog.points} reputation points</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 20, fontWeight: 700, color: '#00ff88' }}>${prog.price}</span>
                                        <button style={{
                                            background: '#21262d', border: '1px solid #30363d', borderRadius: 6,
                                            padding: '6px 14px', color: '#e0e0e6', fontSize: 13, cursor: 'pointer',
                                        }}>Enroll</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
