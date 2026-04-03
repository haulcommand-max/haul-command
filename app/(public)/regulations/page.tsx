import type { Metadata } from 'next';
import Link from 'next/link';
import { REGULATIONS, type CountryRegulation } from '@/lib/regulations/global-regulations-db';

export const metadata: Metadata = {
    title: 'Pilot Car & Escort Vehicle Regulations by Country',
    description:
        'Complete guide to oversize load escort requirements, pilot car regulations, and permit systems across 120 countries. Know the rules before you move.',
    keywords: [
        'pilot car regulations',
        'escort vehicle requirements',
        'oversize load rules',
        'escort regulations by country',
        'pilot car requirements',
        'wide load escort rules',
        'oversize load permits',
    ],
    alternates: { canonical: '/regulations' },
};

const TIER_META: Record<string, { label: string; color: string; description: string }> = {
    A: { label: 'Gold', color: '#D4A843', description: 'Full regulatory data · High confidence' },
    B: { label: 'Blue', color: '#60A5FA', description: 'Good coverage · Some gaps' },
    C: { label: 'Silver', color: '#94A3B8', description: 'Partial data · Expanding' },
    D: { label: 'Slate', color: '#64748B', description: 'Limited data · Contact local authority' },
    E: { label: 'Copper', color: '#B87333', description: 'Emerging market · Frontier data' },
};

function getCountryFlag(code: string): string {
    const magicNumber = 127397;
    return code
        .toUpperCase()
        .split('')
        .map(char => String.fromCodePoint(char.charCodeAt(0) + magicNumber))
        .join('');
}

function RegulationCard({ reg }: { reg: CountryRegulation }) {
    const tier = TIER_META[reg.tier] ?? TIER_META.D;
    return (
        <Link
            href={`/regulations/${reg.countryCode.toLowerCase()}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden'
            }}
            className="hover:border-[var(--hc-gold-500)]/30 hover:bg-[rgba(255,255,255,0.04)] group"
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{getCountryFlag(reg.countryCode)}</span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F9FAFB', margin: 0 }}>
                        {reg.countryName}
                    </h3>
                </div>
                <span
                    style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        border: `1px solid ${tier.color}33`,
                        color: tier.color,
                        background: `${tier.color}15`
                    }}
                >
                    {tier.label}
                </span>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', lineHeight: 1.6, margin: '0 0 1rem 0', flex: 1 }}>
                Complete legal requirements for <strong>{reg.terminology.primary}</strong>. 
                Includes {reg.escortThresholds.length} escort threshold configurations and permit details provided by {reg.permitSystem.authority}.
            </p>
            
            <div style={{ 
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: tier.color,
            }}>
                View Regulations <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </Link>
    );
}

export default function RegulationsIndexPage() {
    const byTier: Record<string, typeof REGULATIONS> = {
        A: REGULATIONS.filter(r => r.tier === 'A'),
        B: REGULATIONS.filter(r => r.tier === 'B'),
        C: REGULATIONS.filter(r => r.tier === 'C'),
        D: REGULATIONS.filter(r => r.tier === 'D'),
        E: REGULATIONS.filter(r => r.tier === 'E'),
    };

    return (
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
            {/* Hero */}
            <div style={{ marginBottom: '3rem' }}>
                <h1
                    className="speakable-headline"
                    data-speakable="true"
                    style={{
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.025em',
                        lineHeight: 1.15,
                        color: '#F9FAFB',
                        marginBottom: '1rem',
                    }}
                >
                    Pilot Car & Escort Vehicle Regulations
                </h1>
                <p
                    className="speakable-summary"
                    data-speakable="true"
                    style={{
                        fontSize: '1.125rem',
                        color: '#9CA3AF',
                        lineHeight: 1.6,
                        maxWidth: '48rem',
                    }}
                >
                    Complete guide to oversize load escort requirements across {REGULATIONS.length} countries.
                    Know the local terminology, escort thresholds, permit authorities, and equipment requirements
                    before you move.
                </p>
            </div>

            {/* Tier Sections */}
            {(['A', 'B', 'C', 'D', 'E'] as const).map(tierKey => {
                const regs = byTier[tierKey];
                const tier = TIER_META[tierKey];
                if (regs.length === 0) return null;
                return (
                    <section key={tierKey} style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: tier.color, margin: 0 }}>
                                Tier {tierKey} — {tier.label}
                            </h2>
                            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                {tier.description} · {regs.length} countries
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '0.75rem',
                            }}
                        >
                            {regs.map(reg => (
                                <RegulationCard key={reg.countryCode} reg={reg} />
                            ))}
                        </div>
                    </section>
                );
            })}

            {/* Structured Data — FAQPage for snippets (expanded for maximum coverage) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: REGULATIONS.map(reg => ({
                            '@type': 'Question',
                            name: `Do I need a pilot car in ${reg.countryName}?`,
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: reg.voiceAnswer,
                            },
                        })),
                    }),
                }}
            />
            {/* BreadcrumbList */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
                            { '@type': 'ListItem', position: 2, name: 'Regulations', item: 'https://haulcommand.com/regulations' },
                        ],
                    }),
                }}
            />
        </div>
    );
}
