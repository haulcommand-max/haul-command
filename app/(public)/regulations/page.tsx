import type { Metadata } from 'next';
import Link from 'next/link';
import { REGULATIONS, type CountryRegulation } from '@/lib/regulations/global-regulations-db';
import { SponsorCard } from '@/components/monetization/SponsorCard';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

import { HCContentPageShell, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { HCEditorialHero } from "@/components/content-system/heroes/HCEditorialHero";

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
    alternates: { canonical: 'https://www.haulcommand.com/regulations' },
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
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: '#111214',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden'
            }}
            className="hover:border-[rgba(255,255,255,0.16)] hover:-translate-y-1 group"
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getCountryFlag(reg.countryCode)}</span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F9FAFB', margin: 0, letterSpacing: '-0.02em' }}>
                        {reg.countryName}
                    </h3>
                </div>
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '6px',
                        border: `1px solid ${tier.color}33`,
                        color: tier.color,
                        background: `${tier.color}10`
                    }}
                >
                    {tier.label}
                </span>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', lineHeight: 1.6, margin: '0 0 1.25rem 0', flex: 1, fontWeight: 500 }}>
                Complete legal requirements for <strong style={{ color: '#E5E7EB' }}>{reg.terminology.primary}</strong>. 
                Includes {reg.escortThresholds.length} escort threshold configurations and permit details provided by {reg.permitSystem.authority}.
            </p>
            
            <div style={{ 
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: tier.color,
                letterSpacing: '0.03em'
            }}>
                View Directory Pivot <span className="group-hover:translate-x-1 transition-transform">â†’</span>
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
        <HCContentPageShell>
            <ProofStrip variant="bar" />
            
            <HCEditorialHero
                eyebrow="Global Database"
                title="Pilot Car & Escort Regulations"
                imageUrl="/images/regulations_hero_bg_1775877308369.png"
                overlayOpacity="heavy"
                metaRow={
                    <div className="flex flex-wrap gap-4 mt-6">
                        <span className="text-[13px] font-bold text-[#E0B05C] uppercase tracking-widest">{REGULATIONS.length} Active Corridors</span>
                    </div>
                }
            >
                <p className="text-lg text-[#9CA3AF] max-w-2xl leading-relaxed mt-4 font-medium mb-8">
                    Complete guide to oversize load escort requirements across 120 jurisdictions.
                    Know the local terminology, escort thresholds, permit authorities, and equipment requirements
                    before you move.
                </p>
            </HCEditorialHero>

            <HCContentSection pad="section_balanced_pad">
                <div style={{ maxWidth: '80rem', margin: '0 auto', width: '100%' }}>
                    {/* Tier Sections */}
                    {(['A', 'B', 'C', 'D', 'E'] as const).map(tierKey => {
                        const regs = byTier[tierKey];
                        const tier = TIER_META[tierKey];
                        if (regs.length === 0) return null;
                        return (
                            <section key={tierKey} style={{ marginBottom: '4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: tier.color, margin: 0, letterSpacing: '-0.02em' }}>
                                        Tier {tierKey} — {tier.label}
                                    </h2>
                                    <span style={{ fontSize: '0.8125rem', color: '#9CA3AF', fontWeight: 600 }}>
                                        {tier.description} · {regs.length} countries
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                        gap: '1rem',
                                    }}
                                >
                                    {regs.map(reg => (
                                        <RegulationCard key={reg.countryCode} reg={reg} />
                                    ))}
                                </div>
                                {/* AdGrid: Inject sponsor after Tier B */}
                                {tierKey === 'B' && (
                                    <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                                        <SponsorCard zone="regulation" compact />
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            </HCContentSection>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <NoDeadEndBlock
                    heading="Explore Heavy Haul Resources"
                    moves={[
                        { href: '/directory', icon: 'ðŸ”', title: 'Find Verified Escorts', desc: 'Operators across 120 countries', primary: true, color: '#D4A844' },
                        { href: '/claim', icon: 'âœ“', title: 'Claim Your Profile', desc: 'List your operation free', primary: true, color: '#22C55E' },
                        { href: '/tools/escort-calculator', icon: 'ðŸ§®', title: 'Escort Calculator', desc: 'How many vehicles needed?' },
                        { href: '/escort-requirements', icon: 'âš–ï¸', title: 'US State Rules', desc: 'All 50 state requirements' },
                        { href: '/glossary/pilot-car', icon: 'ðŸ“–', title: 'Pilot Car Glossary', desc: 'Terms and definitions' },
                        { href: '/available-now', icon: 'ðŸŸ¢', title: 'Available Now', desc: 'Live operator availability' },
                    ]}
                />
            </div>

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
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
                            { '@type': 'ListItem', position: 2, name: 'Regulations', item: 'https://www.haulcommand.com/regulations' },
                        ],
                    }),
                }}
            />
        </HCContentPageShell>
    );
}