'use client';

import { useState } from 'react';

export default function SponsorPage() {
    const [selectedType, setSelectedType] = useState<'state' | 'corridor' | 'city' | 'country'>('state');

    const plans = {
        state: { price: 199, name: 'State Sponsorship', icon: '🏛️', features: ['Top banner on state page', 'Featured in state search results', 'Monthly performance report', 'Brand logo in operator listings'] },
        corridor: { price: 149, name: 'Corridor Sponsorship', icon: '🛣️', features: ['Corridor page banner', 'Featured in corridor listings', 'Demand alert reports', 'Route-based targeting'] },
        city: { price: 79, name: 'City Sponsorship', icon: '🏙️', features: ['City page placement', 'Local search priority', 'Weekly traffic report', 'Neighborhood visibility'] },
        country: { price: 499, name: 'Country Sponsorship', icon: '🌎', features: ['Country page hero', 'All state/city pages sidebar', 'Premium analytics dashboard', 'Dedicated support manager'] },
    };

    const hotTerritories = [
        { type: 'state', value: 'TX', label: 'Texas', demand: 'Very High', searches: '2.4k/mo' },
        { type: 'state', value: 'FL', label: 'Florida', demand: 'Very High', searches: '1.8k/mo' },
        { type: 'corridor', value: 'I-10', label: 'I-10 Corridor', demand: 'High', searches: '950/mo' },
        { type: 'corridor', value: 'I-95', label: 'I-95 Corridor', demand: 'High', searches: '870/mo' },
        { type: 'state', value: 'GA', label: 'Georgia', demand: 'High', searches: '1.1k/mo' },
        { type: 'city', value: 'Houston-TX', label: 'Houston, TX', demand: 'Very High', searches: '680/mo' },
        { type: 'state', value: 'CA', label: 'California', demand: 'Very High', searches: '2.1k/mo' },
        { type: 'corridor', value: 'I-75', label: 'I-75 Corridor', demand: 'High', searches: '720/mo' },
    ];

    const plan = plans[selectedType];

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f',
            color: '#e0e0e6', fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>
            {/* Hero */}
            <div style={{
                background: 'linear-gradient(135deg, #0d1117, #1a1a2e 50%, #0d1117)',
                padding: '64px 24px', textAlign: 'center',
                borderBottom: '1px solid #21262d',
            }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
                <h1 style={{
                    fontSize: 40, fontWeight: 800, margin: '0 0 12px',
                    background: 'linear-gradient(90deg, #ff6b00, #ff9500, #ffd700)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Territory Sponsorship</h1>
                <p style={{ color: '#8b949e', fontSize: 17, maxWidth: 550, margin: '0 auto', lineHeight: 1.5 }}>
                    Own your market. Get premium placement where decision-makers search for escort services.
                </p>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
                {/* Territory Type Selector */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40,
                }}>
                    {(Object.entries(plans) as [keyof typeof plans, typeof plans[keyof typeof plans]][]).map(([key, p]) => (
                        <button key={key} onClick={() => setSelectedType(key)} style={{
                            background: selectedType === key ? '#21262d' : '#161b22',
                            border: `2px solid ${selectedType === key ? '#ff9500' : '#21262d'}`,
                            borderRadius: 12, padding: '20px 16px', cursor: 'pointer',
                            textAlign: 'center', transition: 'all 0.3s',
                        }}>
                            <div style={{ fontSize: 32 }}>{p.icon}</div>
                            <div style={{
                                fontSize: 14, fontWeight: 600, marginTop: 8,
                                color: selectedType === key ? '#ff9500' : '#e0e0e6',
                            }}>{p.name}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#00ff88', marginTop: 4 }}>${p.price}<span style={{ fontSize: 12, color: '#8b949e' }}>/mo</span></div>
                        </button>
                    ))}
                </div>

                {/* Selected Plan Detail */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48,
                }}>
                    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 16, padding: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <span style={{ fontSize: 36 }}>{plan.icon}</span>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{plan.name}</h2>
                                <div style={{ fontSize: 28, fontWeight: 800, color: '#00ff88', marginTop: 4 }}>${plan.price}<span style={{ fontSize: 14, color: '#8b949e', fontWeight: 400 }}>/month</span></div>
                            </div>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {plan.features.map((f, i) => (
                                <li key={i} style={{
                                    padding: '10px 0', borderBottom: i < plan.features.length - 1 ? '1px solid #21262d' : 'none',
                                    fontSize: 14, display: 'flex', alignItems: 'center', gap: 10,
                                }}>
                                    <span style={{ color: '#00ff88' }}>✓</span> {f}
                                </li>
                            ))}
                        </ul>
                        <button style={{
                            width: '100%', marginTop: 24,
                            background: 'linear-gradient(90deg, #ff6b00, #ff9500)',
                            color: '#fff', border: 'none', borderRadius: 10,
                            padding: '14px 24px', fontSize: 16, fontWeight: 700,
                            cursor: 'pointer', transition: 'transform 0.2s',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            Claim This Territory
                        </button>
                    </div>

                    {/* Hot Territories */}
                    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 16, padding: 32 }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>🔥 Hot Territories</h3>
                        <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 16 }}>High-demand territories with proven search volume</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {hotTerritories.map((t, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', background: '#0d1117', borderRadius: 8,
                                    border: '1px solid #161b22', transition: 'border-color 0.2s', cursor: 'pointer',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#ff9500')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#161b22')}
                                >
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</span>
                                        <span style={{
                                            marginLeft: 8, fontSize: 11, padding: '2px 6px', borderRadius: 4,
                                            background: t.type === 'state' ? '#ff950022' : t.type === 'corridor' ? '#00ccff22' : '#00ff8822',
                                            color: t.type === 'state' ? '#ff9500' : t.type === 'corridor' ? '#00ccff' : '#00ff88',
                                        }}>{t.type}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: 11, padding: '2px 8px', borderRadius: 4,
                                            background: t.demand === 'Very High' ? '#ff444422' : '#ffcc0022',
                                            color: t.demand === 'Very High' ? '#ff4444' : '#ffcc00',
                                        }}>{t.demand}</span>
                                        <span style={{ fontSize: 12, color: '#8b949e' }}>{t.searches}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Social Proof / FAQ */}
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Why Sponsors Win</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 800, margin: '0 auto' }}>
                        {[
                            { stat: '3.2x', label: 'More visibility than non-sponsored profiles' },
                            { stat: '47%', label: 'Higher click-through rate on sponsored pages' },
                            { stat: '24/7', label: 'Your brand visible to active brokers' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: '#ff9500' }}>{s.stat}</div>
                                <div style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
