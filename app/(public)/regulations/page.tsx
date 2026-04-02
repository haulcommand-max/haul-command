import type { Metadata } from 'next';
import Link from 'next/link';
import { REGULATIONS, type CountryRegulation } from '@/lib/regulations/global-regulations-db';

export const metadata: Metadata = {
    title: 'Pilot Car & Escort Vehicle Regulations by Country',
    description:
        'Complete guide to oversize load escort requirements, pilot car regulations, and permit systems across 52+ countries. Know the rules before you move.',
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
};

function RegulationCard({ reg }: { reg: CountryRegulation }) {
    const tier = TIER_META[reg.tier] ?? TIER_META.D;
    return (
        <Link
            href={`/regulations/${reg.countryCode.toLowerCase()}`}
            style={{
                display: 'block',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
            }}
            className="hover:border-[var(--hc-gold-500)]/30 hover:bg-[rgba(255,255,255,0.04)]"
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#E5E7EB', margin: 0 }}>
                    {reg.countryName}
                </h3>
                <span
                    style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        border: `1px solid ${tier.color}33`,
                        color: tier.color,
                    }}
                >
                    {tier.label}
                </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: '#D1D5DB' }}>{reg.terminology.primary}</strong>
                {reg.escortThresholds.length > 0 &&
                    ` · ${reg.escortThresholds.length} escort threshold${reg.escortThresholds.length > 1 ? 's' : ''}`}
                {` · Permit: ${reg.permitSystem.authority}`}
            </p>
        </Link>
    );
}

export default function RegulationsIndexPage() {
    const byTier = {
        A: REGULATIONS.filter(r => r.tier === 'A'),
        B: REGULATIONS.filter(r => r.tier === 'B'),
        C: REGULATIONS.filter(r => r.tier === 'C'),
        D: REGULATIONS.filter(r => r.tier === 'D'),
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
            {(['A', 'B', 'C', 'D'] as const).map(tierKey => {
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

            {/* Structured Data — FAQPage for snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: REGULATIONS.slice(0, 10).map(reg => ({
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
        </div>
    );
}
