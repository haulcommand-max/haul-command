'use client';

import { useState } from 'react';

const TIERS = [
    {
        id: 'spotlight', name: 'Spotlight', price: '$9.99', period: '/week',
        multiplier: '1.5×', color: '#06b6d4', grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
        icon: 'â—', features: ['Highlighted in search', '1.5× ranking boost', 'Spotlight badge', '7-day duration'],
        best: 'Testing the waters',
    },
    {
        id: 'featured', name: 'Featured', price: '$29', period: '/month',
        multiplier: '2×', color: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)',
        icon: 'â˜…', popular: true,
        features: ['Top placement', '2× ranking boost', 'Featured badge', 'Priority in shortlists', '30-day duration'],
        best: 'Serious operators',
    },
    {
        id: 'premium', name: 'Premium', price: '$79', period: '/month',
        multiplier: '3×', color: '#8b5cf6', grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        icon: 'âš¡',
        features: ['Guaranteed top-3', '3× ranking boost', 'Premium badge everywhere', 'Priority dispatch', 'Corridor features', 'Performance report', '30-day duration'],
        best: 'Dominate your territory',
    },
];

export default function BoostPage() {
    const [sel, setSel] = useState('featured');
    const [loading, setLoading] = useState(false);

    const buy = async (id: string) => {
        setLoading(true);
        try {
            const r = await fetch('/api/boost/purchase', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: id }),
            });
            const d = await r.json();
            if (d.checkoutUrl) window.location.href = d.checkoutUrl;
            else if (d.error) alert(d.error);
        } catch { alert('Error. Try again.'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e0', fontFamily: "'Inter',system-ui,sans-serif" }}>
            <div style={{ textAlign: 'center', padding: '60px 20px 40px', background: 'linear-gradient(180deg,#111118,#0a0a0f)' }}>
                <div style={{ fontSize: 14, color: '#00ff88', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Profile Boost</div>
                <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>Get Found <span style={{ color: '#00ff88' }}>First</span></h1>
                <p style={{ fontSize: 18, color: '#888', maxWidth: 560, margin: '16px auto 0' }}>Boost your profile to the top. More visibility = more calls, loads, revenue.</p>
            </div>

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 48 }}>
                    {[{ v: '3.2×', l: 'more views', c: '#00ff88' }, { v: '67%', l: 'more contacts', c: '#f59e0b' }, { v: '5.4×', l: 'faster match', c: '#818cf8' }].map(s => (
                        <div key={s.l} style={{ textAlign: 'center', padding: '20px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 32, fontWeight: 800, color: s.c }}>{s.v}</div>
                            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
                    {TIERS.map(t => {
                        const active = sel === t.id;
                        return (
                            <div key={t.id} onClick={() => setSel(t.id)} style={{
                                background: active ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                border: active ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 20, padding: '32px 28px', cursor: 'pointer', position: 'relative',
                                transition: 'all 0.3s', transform: active ? 'scale(1.02)' : 'scale(1)',
                            }}>
                                {t.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 20, background: t.grad, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Most Popular</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <span style={{ width: 44, height: 44, borderRadius: 12, background: t.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>{t.icon}</span>
                                    <div><div style={{ fontWeight: 700, fontSize: 20, color: '#fff' }}>{t.name}</div><div style={{ fontSize: 12, color: '#888' }}>{t.best}</div></div>
                                </div>
                                <div style={{ marginBottom: 24 }}>
                                    <span style={{ fontSize: 40, fontWeight: 800, color: '#fff' }}>{t.price}</span>
                                    <span style={{ fontSize: 16, color: '#888' }}>{t.period}</span>
                                    <span style={{ marginLeft: 12, padding: '4px 10px', borderRadius: 6, background: `${t.color}20`, color: t.color, fontSize: 13, fontWeight: 700 }}>{t.multiplier} boost</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                                    {t.features.map((f, i) => <div key={i} style={{ display: 'flex', gap: 10 }}><span style={{ color: t.color }}>âœ“</span><span style={{ fontSize: 14, color: '#bbb' }}>{f}</span></div>)}
                                </div>
                                <button aria-label="Interactive Button" onClick={(e) => { e.stopPropagation(); buy(t.id); }} disabled={loading} style={{
                                    width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                                    background: active ? t.grad : 'rgba(255,255,255,0.08)',
                                    color: active ? '#fff' : '#aaa', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
                                }}>
                                    {loading ? 'Processing...' : `Boost with ${t.name}`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}