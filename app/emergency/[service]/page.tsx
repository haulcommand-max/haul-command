import Link from 'next/link';
import { Zap, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { ProgrammaticFAQ, getGenericFAQs } from '@/components/seo/ProgrammaticFAQ';
import { HubLinks, AuthorityLinks } from '@/lib/seo/internal-links';
import type { Metadata } from 'next';

// Killer Move #2 — Emergency + Last-Minute Pages
const EMERGENCY_SERVICES: Record<string, {
    label: string; badge: string; badgeColor: string;
    headline: string; sub: string; avgResponseMin: number; keywords: string[];
}> = {
    'emergency-pilot-car': {
        label: 'Emergency Pilot Car', badge: '🚨 Emergency', badgeColor: '#ef4444',
        headline: 'Emergency Pilot Car Service — Dispatched in Minutes',
        sub: 'Verified escort drivers on standby for urgent same-day and emergency dispatch.',
        avgResponseMin: 47,
        keywords: ['emergency pilot car service', 'urgent pilot car escort', 'pilot car same day', '24 hour pilot car'],
    },
    'last-minute-escort': {
        label: 'Last-Minute Escort', badge: '⚡ Last-Minute', badgeColor: '#f59e0b',
        headline: 'Last-Minute Escort Vehicle — Available Now',
        sub: 'Need an escort vehicle today? Haul Command connects you to available certified drivers instantly.',
        avgResponseMin: 52,
        keywords: ['last minute escort vehicle', 'same day escort vehicle', 'find escort vehicle fast', 'on demand pilot car'],
    },
    'same-day-pilot-car': {
        label: 'Same-Day Pilot Car', badge: '📍 Same-Day', badgeColor: '#10b981',
        headline: 'Same-Day Pilot Car Service',
        sub: 'Certified pilot car operators available for same-day dispatch. Post a load and get matched instantly.',
        avgResponseMin: 44,
        keywords: ['same day pilot car service', 'pilot car today', 'book pilot car same day', 'find pilot car fast'],
    },
    '24-hour-pilot-car': {
        label: '24-Hour Service', badge: '🕐 24/7', badgeColor: '#818cf8',
        headline: '24-Hour Pilot Car Service — Around the Clock',
        sub: 'Night moves, early morning dispatch, holiday escorts. Haul Command drivers are available 24/7.',
        avgResponseMin: 38,
        keywords: ['24 hour pilot car service', 'night pilot car escort', 'overnight escort vehicle', 'pilot car anytime'],
    },
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const svc = EMERGENCY_SERVICES[params.service];
    return {
        title: `${svc?.label ?? 'Emergency Escort'} | Haul Command`,
        description: svc?.sub ?? 'Emergency escort vehicle dispatch. Verified drivers, instant matching.',
        keywords: svc?.keywords ?? [],
    };
}

export default function EmergencyServicePage({ params }: any) {
    const slug = params.service;
    const svc = EMERGENCY_SERVICES[slug];

    if (!svc) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', background: '#0a0a0f', minHeight: '100vh' }}>
                Service not found. <Link href="/directory" style={{ color: '#F1A91B' }}>Browse directory →</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <span style={{ color: '#d1d5db' }}>{svc.label}</span>
                </nav>

                {/* Badge + Header */}
                <header style={{ marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: `${svc.badgeColor}12`, border: `1px solid ${svc.badgeColor}30`, borderRadius: 20, marginBottom: 14 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: svc.badgeColor, textTransform: 'uppercase', letterSpacing: 2 }}>{svc.badge}</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, color: '#f9fafb', letterSpacing: -0.5, lineHeight: 1.1 }}>{svc.headline}</h1>
                    <p style={{ margin: '12px 0 0', fontSize: 15, color: '#6b7280', lineHeight: 1.6 }}>{svc.sub}</p>
                </header>

                {/* Stat strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
                    {[
                        { label: 'Avg Response', val: `${svc.avgResponseMin} min`, icon: Clock, color: '#F1A91B' },
                        { label: 'Verified Drivers', val: '10,000+', icon: Zap, color: '#10b981' },
                        { label: 'Availability', val: '24/7', icon: AlertTriangle, color: svc.badgeColor },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                            <s.icon style={{ width: 14, height: 14, color: s.color, margin: '0 auto 6px' }} />
                            <div style={{ fontSize: 16, fontWeight: 900, color: s.color, fontFamily: 'JetBrains Mono' }}>{s.val}</div>
                            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Primary CTA */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
                    <Link href="/loads/post" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px', borderRadius: 14, background: `linear-gradient(135deg,${svc.badgeColor},${svc.badgeColor}cc)`, color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                        <Zap style={{ width: 16, height: 16 }} /> Post Emergency Load
                    </Link>
                    <Link href="/directory" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                        Browse Available Drivers →
                    </Link>
                </div>

                {/* FAQ */}
                <ProgrammaticFAQ faqs={getGenericFAQs('cost')} title="Emergency Escort — Common Questions" />

                {/* Other emergency services */}
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>Other Emergency Services</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Object.entries(EMERGENCY_SERVICES).filter(([s]) => s !== slug).map(([s, e]) => (
                            <Link key={s} href={`/emergency/${s}`} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280' }}>{e.label}</Link>
                        ))}
                    </div>
                </div>

                {/* Hub links */}
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <HubLinks compact />
                    <div style={{ marginTop: 10 }}><AuthorityLinks type="money" /></div>
                </div>
            </div>
        </div>
    );
}
