'use client';

import { useState } from 'react';

const PLANS = [
    {
        id: 'free', name: 'Scout', price: 0, period: '/mo',
        badge: 'FREE FOREVER', badgeColor: '#6B7280',
        features: [
            'Basic directory listing',
            'Claim your profile',
            'View 5 loads/day',
            'AI Support Bot',
            '1 territory',
            'Community access',
        ],
        cta: 'Get Started', ctaStyle: 'outline' as const,
    },
    {
        id: 'pro', name: 'Commander', price: 29, period: '/mo',
        badge: 'MOST POPULAR', badgeColor: '#F59E0B', highlighted: true,
        features: [
            'Everything in Scout',
            'Unlimited load views',
            'Priority dispatch matching',
            '12 AI agents (GPT-4o)',
            'Route Survey Generator',
            'Contract + Invoice Builder',
            'Push notifications',
            'Leaderboard ranking',
            '5 territories',
            'Crypto payments',
            'Profile optimizer',
            'Review intelligence',
        ],
        cta: 'Start Free Trial', ctaStyle: 'solid' as const,
    },
    {
        id: 'elite', name: 'Fleet Admiral', price: 99, period: '/mo',
        badge: 'ENTERPRISE', badgeColor: '#8B5CF6',
        features: [
            'Everything in Commander',
            'Unlimited territories',
            'Corridor sponsorships',
            'White-label dispatch',
            'Data intelligence API',
            'Daily anomaly scanner',
            'Ad Copy Studio',
            'SEO Page Factory',
            'Priority phone support',
            'Custom integrations',
            'Dedicated account manager',
            'SLA guarantee',
        ],
        cta: 'Contact Sales', ctaStyle: 'outline' as const,
    },
];

const BROKER_PLANS = [
    {
        id: 'broker_starter', name: 'Dispatcher', price: 49, period: '/mo',
        features: ['Post 10 loads/mo', 'View operator directory', 'AI load enhancer', 'Match notifications', 'Basic analytics'],
        cta: 'Start Trial',
    },
    {
        id: 'broker_pro', name: 'Fleet Ops', price: 199, period: '/mo', highlighted: true,
        features: ['Unlimited loads', 'Priority matching + wave dispatch', 'Fill probability engine', 'Corridor stress API', 'Broker exposure score', 'Multi-state compliance check', 'Dedicated support'],
        cta: 'Start Trial',
    },
    {
        id: 'broker_enterprise', name: 'Command Center', price: 499, period: '/mo',
        features: ['Everything in Fleet Ops', 'White-label dispatch page', 'Custom API access', 'Real-time corridor intel', 'Surge pricing alerts', 'SLA + analytics dashboard', 'Account manager'],
        cta: 'Contact Sales',
    },
];

export default function PricingPage() {
    const [tab, setTab] = useState<'operators' | 'brokers'>('operators');
    const [annual, setAnnual] = useState(false);

    const handleCTA = (planId: string) => {
        if (planId.includes('enterprise') || planId === 'elite' || planId === 'broker_enterprise') {
            window.location.href = 'mailto:sales@haulcommand.com?subject=Enterprise Inquiry';
        } else {
            window.location.href = `/login?plan=${planId}&billing=${annual ? 'annual' : 'monthly'}`;
        }
    };

    const plans = tab === 'operators' ? PLANS : BROKER_PLANS;

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #030712 0%, #0B1120 50%, #030712 100%)', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)", padding: '3rem 1rem' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 2.5rem' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: '#F59E0B', marginBottom: 12 }}>HAUL COMMAND</div>
                <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#F9FAFB', margin: '0 0 12px', lineHeight: 1.2 }}>
                    Plans Built for the Heavy Haul Industry
                </h1>
                <p style={{ fontSize: '1rem', color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
                    From solo pilot car operators to enterprise broker fleets.
                    <br />Start free. Upgrade when you&apos;re ready.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: '1.5rem' }}>
                {(['operators', 'brokers'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: tab === t ? '#F59E0B' : 'rgba(255,255,255,0.06)',
                        color: tab === t ? '#030712' : '#9CA3AF',
                        fontWeight: 700, fontSize: 14, textTransform: 'capitalize', transition: 'all 0.15s',
                    }}>{t === 'operators' ? '🚗 Operators' : '🏢 Brokers'}</button>
                ))}
            </div>

            {/* Annual toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
                <span style={{ fontSize: 13, color: annual ? '#6B7280' : '#F9FAFB' }}>Monthly</span>
                <button onClick={() => setAnnual(!annual)} style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative',
                    background: annual ? '#F59E0B' : 'rgba(255,255,255,0.15)', transition: 'all 0.2s',
                }}>
                    <span style={{
                        width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                        left: annual ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                </button>
                <span style={{ fontSize: 13, color: annual ? '#F9FAFB' : '#6B7280' }}>Annual</span>
                {annual && <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700, background: 'rgba(16,185,129,0.15)', padding: '3px 8px', borderRadius: 6 }}>Save 20%</span>}
            </div>

            {/* Plans Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: 20, maxWidth: 1100, margin: '0 auto' }}>
                {plans.map(plan => {
                    const price = annual ? Math.round(plan.price * 0.8) : plan.price;
                    const hl = 'highlighted' in plan && plan.highlighted;
                    return (
                        <div key={plan.id} style={{
                            background: hl ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))' : 'rgba(255,255,255,0.03)',
                            border: hl ? '2px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16, padding: '28px 24px', position: 'relative',
                            transform: hl ? 'scale(1.03)' : 'none', transition: 'all 0.2s',
                        }}>
                            {'badge' in plan && (plan as any).badge && (
                                <div style={{
                                    position: 'absolute', top: -12, right: 20,
                                    background: (plan as any).badgeColor || '#F59E0B', color: '#fff',
                                    fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                                    padding: '4px 12px', borderRadius: 6,
                                }}>{(plan as any).badge}</div>
                            )}

                            <h3 style={{ color: '#F9FAFB', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{plan.name}</h3>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                                <span style={{ fontSize: 40, fontWeight: 800, color: '#F9FAFB' }}>${price}</span>
                                <span style={{ fontSize: 14, color: '#6B7280' }}>{plan.period}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                                {plan.features.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                                        <span style={{ color: '#10B981', fontSize: 14, flexShrink: 0 }}>✓</span>
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => handleCTA(plan.id)} style={{
                                width: '100%', padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                                fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                                background: ('ctaStyle' in plan && plan.ctaStyle === 'solid') || hl ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                                color: ('ctaStyle' in plan && plan.ctaStyle === 'solid') || hl ? '#030712' : '#F59E0B',
                                border: ('ctaStyle' in plan && plan.ctaStyle === 'solid') || hl ? 'none' : '1px solid rgba(245,158,11,0.4)',
                            }}>{plan.cta}</button>
                        </div>
                    );
                })}
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', marginTop: '3rem', color: '#6B7280', fontSize: 13 }}>
                <p>All plans include crypto payments (300+ currencies via NOWPayments) • 57 country coverage • Offline PWA</p>
                <p style={{ marginTop: 4 }}>Questions? <a href="mailto:support@haulcommand.com" style={{ color: '#F59E0B', textDecoration: 'none' }}>support@haulcommand.com</a></p>
            </div>
        </div>
    );
}
