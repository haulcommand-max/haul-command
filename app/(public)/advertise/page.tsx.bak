import React from 'react';
import AdGridPartnerSignup from '@/components/ads/AdGridPartnerSignup';
import { AdGridMobileGate } from '@/components/mobile/gates/AdGridMobileGate';

export const metadata = {
    title: 'Advertise on HAUL COMMAND | AdGrid Partner Program',
    description: 'Reach 358,000+ pilot car operators and heavy haul professionals across 57 countries. Self-service ad platform with corridor targeting, real-time analytics, and automated billing.',
    openGraph: {
        title: 'Advertise on HAUL COMMAND | AdGrid Partner Program',
        description: 'Reach 358,000+ pilot car operators across 57 countries. Self-service ads with corridor targeting.',
    },
};

export default function AdGridPartnerPage() {
    return (
        <AdGridMobileGate>
        <main style={{ minHeight: '100vh', background: '#050508', padding: '40px 16px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Hero Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                    marginBottom: 32,
                }}>
                    {[
                        { value: '358K+', label: 'Operator Profiles' },
                        { value: '57', label: 'Countries' },
                        { value: '500+', label: 'Corridors' },
                        { value: '24/7', label: 'Live Traffic' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                            padding: '16px 12px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#F1A91B' }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <AdGridPartnerSignup />

                {/* Trust Bar */}
                <div style={{
                    marginTop: 32,
                    padding: 20,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 12,
                    textAlign: 'center',
                    color: '#555',
                    fontSize: 13,
                }}>
                    <p style={{ margin: 0 }}>🔒 Secure billing via Stripe & Crypto</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11 }}>
                        World&apos;s #1 platform for pilot car, escort vehicle, and heavy haul professionals
                    </p>
                </div>
            </div>
        </main>
        </AdGridMobileGate>
    );
}
