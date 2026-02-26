import Link from 'next/link';
import { ChevronRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { HubLinks, AuthorityLinks } from '@/lib/seo/internal-links';
import type { Metadata } from 'next';

// Killer Move #4 — Competitor Intercept Pages
// SAFEGUARDS: factual only, no trademark misuse, no disparagement
const ALTERNATIVES: Record<string, {
    companyLabel: string;
    category: string; // What type of service they are
    factsOnly: string[]; // Only verifiable facts, NO disparagement
    hcAdvantages: string[];
    metaDescription: string;
}> = {
    'truckstop': {
        companyLabel: 'Truckstop.com',
        category: 'Freight Load Board',
        factsOnly: [
            'Load board focused primarily on dry van, flatbed, and general freight lanes',
            'Limited filtering specifically for oversize escort / pilot car loads',
            'Subscription-based access with tiered pricing for carriers',
            'Primarily broker-to-carrier matching, not escort-specific',
        ],
        hcAdvantages: [
            'Built exclusively for oversize escort and pilot car operators',
            'Escort-specific filters: state certifications, equipment type, corridor experience',
            'Instant real-time matching — median fill time under 47 minutes',
            'Free driver profiles with verified credential display',
            'Live load map with density heatmap and route intelligence',
        ],
        metaDescription: 'Looking for a Truckstop.com alternative for pilot car and escort vehicle services? See how Haul Command compares for oversize load escort operators.',
    },
    'dat-freight': {
        companyLabel: 'DAT Freight & Analytics',
        category: 'Freight Analytics & Load Board',
        factsOnly: [
            'Industry-leading freight analytics and load board for general trucking',
            'Strong rate intelligence across standard freight lanes',
            'Not specifically designed for oversize escort / pilot car workflow',
            'Rate tools focused on dry van and flatbed, not escort-per-mile pricing',
        ],
        hcAdvantages: [
            'Escort-specific rate intelligence by corridor and load type',
            'Carvana-style value indicators on every load (Strong/Market/Below)',
            'Real-time driver availability, not just rate history',
            'Free state requirements cheatsheet built in',
            'Pilot car certification verification built into profiles',
        ],
        metaDescription: 'Looking for a DAT Freight alternative for escort vehicle and pilot car services? Compare Haul Command vs DAT for oversize load escort operators.',
    },
    'uship': {
        companyLabel: 'uShip',
        category: 'Freight Marketplace',
        factsOnly: [
            'Consumer and business freight marketplace with auction-style bidding',
            'Handles a wide variety of freight including vehicle and boat transport',
            'Not purpose-built for certified oversize escort vehicle dispatch',
            'Limited state-by-state compliance and certification verification',
        ],
        hcAdvantages: [
            'Purpose-built for oversize escort — state cert verification built in',
            'Direct match to certified pilot car operators, no bidding required',
            'Instant dispatch vs multi-day auction cycles',
            'Compliance-first: driver profiles show FAC, height pole, insurance status',
            'Emergency and same-day dispatch available',
        ],
        metaDescription: 'Looking for a uShip alternative for pilot car and escort services? See how Haul Command compares for certified oversize escort dispatch.',
    },
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const alt = ALTERNATIVES[params.competitor];
    return {
        title: `${alt?.companyLabel ?? 'Competitor'} Alternatives for Pilot Car Services | Haul Command`,
        description: alt?.metaDescription ?? 'Compare pilot car and escort vehicle platforms.',
    };
}

export default function CompetitorInterceptPage({ params }: any) {
    const slug = params.competitor;
    const alt = ALTERNATIVES[slug];

    if (!alt) {
        return <div style={{ padding: 40, color: '#6b7280', background: '#0a0a0f', minHeight: '100vh' }}>Page not found.</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <span style={{ color: '#d1d5db' }}>Alternatives to {alt.companyLabel}</span>
                </nav>

                <header style={{ marginBottom: 28 }}>
                    <div style={{ display: 'inline-flex', gap: 6, padding: '4px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, marginBottom: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Platform Comparison</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: '#f9fafb', letterSpacing: -0.5 }}>
                        {alt.companyLabel} Alternatives<br />
                        <span style={{ color: '#F1A91B' }}>for Pilot Car &amp; Escort Services</span>
                    </h1>
                    <p style={{ margin: '10px 0 0', fontSize: 13, color: '#6b7280' }}>{alt.companyLabel} is a {alt.category}. Here's how it compares to Haul Command for oversize escort operators.</p>
                </header>

                {/* Side-by-side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                    {/* Their facts */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: '#6b7280' }}>{alt.companyLabel}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {alt.factsOnly.map((f, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <AlertTriangle style={{ width: 12, height: 12, color: '#4b5563', flexShrink: 0, marginTop: 2 }} />
                                    <span style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* HC advantages */}
                    <div style={{ background: 'rgba(241,169,27,0.04)', border: '1px solid rgba(241,169,27,0.15)', borderRadius: 14, padding: '1.25rem' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: '#F1A91B' }}>Haul Command</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {alt.hcAdvantages.map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <CheckCircle style={{ width: 12, height: 12, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                                    <span style={{ fontSize: 11, color: '#d1d5db', lineHeight: 1.5 }}>{a}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 24 }}>
                    <p style={{ margin: 0, fontSize: 10, color: '#4b5563', lineHeight: 1.6 }}>
                        This comparison contains only factual, publicly available information. All trademarks belong to their respective owners. Haul Command is not affiliated with {alt.companyLabel}.
                    </p>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <Link href="/start" style={{ display: 'inline-flex', padding: '12px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                        Try Haul Command Free →
                    </Link>
                </div>

                {/* Other comparisons */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 10 }}>More Comparisons</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Object.entries(ALTERNATIVES).filter(([s]) => s !== slug).map(([s, a]) => (
                            <Link key={s} href={`/alternatives/${s}`} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280' }}>{a.companyLabel}</Link>
                        ))}
                    </div>
                </div>

                <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <HubLinks compact />
                </div>
            </div>
        </div>
    );
}
