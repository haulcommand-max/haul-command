/**
 * /advertise/buy â€” Self-Serve Ad Campaign Launcher
 *
 * This page converts DirectorySponsorCard CTAs into actual campaign setup.
 * Supports CPC campaigns, corridor sponsorships, and territory takeovers.
 *
 * Links from:
 *   - DirectorySponsorCard (lower position) â†’ /advertise/buy
 *   - /advertise main page â†’ /advertise/buy
 *   - HCFooterShell â†’ /advertise
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import CheckoutButton from './CheckoutButton';

export const metadata: Metadata = {
    title: 'Launch a Campaign | Haul Command Advertising',
    description:
        'Start a self-serve advertising campaign on Haul Command. CPC campaigns from $0.75/click. Geo-targeted to states, corridors, and equipment types. Industry-only traffic.',
    alternates: { canonical: 'https://www.haulcommand.com/advertise/buy' },
};

const CAMPAIGN_TYPES = [
    {
        id: 'cpc',
        icon: 'âš¡',
        name: 'Self-Serve CPC Campaign',
        price: 'From $0.75/click',
        period: 'Pay as you go',
        color: '#3b82f6',
        features: [
            'Geo-target by state, corridor, or nationwide',
            'Industry-only traffic â€” no consumer clicks',
            'Appear in directory results, tool pages, corridor feeds',
            'Real-time dashboard with click, impression, and CTR metrics',
            'Pause or adjust budget any time',
            'Average CPC: $0.75â€“$2.50 depending on market',
        ],
        bestFor: 'Equipment vendors, insurance providers, training programs',
        cta: 'Launch CPC Campaign',
    },
    {
        id: 'corridor',
        icon: 'ðŸ›£ï¸',
        name: 'Corridor Sponsorship',
        price: '$199/mo',
        period: 'Monthly or annual (15% off)',
        color: '#D4A843',
        features: [
            'Exclusive placement on a named corridor page',
            'Your brand shown on every search touching that corridor',
            'Priority listing in corridor-related directory results',
            'Branded "Corridor Sponsor" badge on your profile',
            'Monthly analytics including search volume and match rate',
            'Includes featured placement in corridor alerts',
        ],
        bestFor: 'Operators who dominate a specific route',
        cta: 'Claim a Corridor',
    },
    {
        id: 'territory',
        icon: 'ðŸ—ºï¸',
        name: 'Territory Takeover',
        price: '$149â€“$499/mo',
        period: 'Varies by state tier',
        color: '#22c55e',
        features: [
            'Own all sponsor slots in a state or country',
            'Exclusive placement in /near-me and directory results',
            'Branded "Territory Sponsor" badge visible on all listings',
            'Priority matching for loads in your territory',
            'Monthly territory report: search volume, operator density, lead flow',
            'First-mover lock: price grandfathered for 12 months',
        ],
        bestFor: 'Large operators or companies expanding into new markets',
        cta: 'View Territory Pricing',
    },
    {
        id: 'enterprise',
        icon: 'ðŸ¢',
        name: 'Enterprise Package',
        price: 'Custom',
        period: 'Annual contract',
        color: '#8b5cf6',
        features: [
            'Multi-state or multi-country sponsorship bundles',
            'Custom ad creative and landing pages',
            'Dedicated account manager',
            'API access for campaign management',
            'Quarterly business reviews with market intelligence',
            'White-label data products for your team',
        ],
        bestFor: 'National carriers, insurance companies, logistics platforms',
        cta: 'Contact Sales',
    },
];

const TRUST_STATS = [
    { value: '50K+', label: 'Monthly Active Users' },
    { value: '120', label: 'Countries Covered' },
    { value: '95%', label: 'Industry Traffic' },
    { value: '2.8x', label: 'Avg Click-to-Lead Rate' },
];

export default function AdvertiseBuyPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#0B0B0C', color: '#E5E7EB' }}>
            {/* Hero */}
            <section style={{
                padding: '4rem 1.5rem 3rem',
                maxWidth: 1200,
                margin: '0 auto',
                textAlign: 'center',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '4px 14px', borderRadius: 999,
                    background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)',
                    color: '#60A5FA', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                    marginBottom: 20,
                }}>
                    âš¡ Self-Serve Campaigns
                </div>
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900,
                    color: '#FFFFFF', lineHeight: 1.1, marginBottom: 16,
                }}>
                    Launch a Campaign in 5 Minutes
                </h1>
                <p style={{
                    fontSize: 16, color: '#9CA3AF', maxWidth: 640,
                    margin: '0 auto 2rem', lineHeight: 1.6,
                }}>
                    Reach verified pilot car operators, heavy haul carriers, and brokers.
                    No consumer traffic. No wasted impressions. Every click is industry-qualified.
                </p>

                {/* Trust stats strip */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
                    maxWidth: 700, margin: '0 auto 3rem',
                }}>
                    {TRUST_STATS.map(s => (
                        <div key={s.label}>
                            <div style={{ fontSize: 24, fontWeight: 900, color: '#D4A843' }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Campaign Type Cards */}
            <section style={{
                padding: '0 1.5rem 4rem',
                maxWidth: 1200,
                margin: '0 auto',
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 24,
                }}>
                    {CAMPAIGN_TYPES.map(ct => (
                        <div key={ct.id} style={{
                            background: '#111114',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            padding: 28,
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {/* Accent */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                background: `linear-gradient(90deg, ${ct.color}, transparent)`,
                            }} />

                            {/* Header */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{ct.icon}</div>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F0F0F2', margin: '0 0 6px' }}>
                                    {ct.name}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: 22, fontWeight: 900, color: ct.color }}>
                                        {ct.price}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#6B7280' }}>{ct.period}</span>
                                </div>
                            </div>

                            {/* Features */}
                            <ul style={{
                                listStyle: 'none', padding: 0, margin: '0 0 16px',
                                flex: 1,
                            }}>
                                {ct.features.map(f => (
                                    <li key={f} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                        fontSize: 12, color: '#9CA3AF', lineHeight: 1.5,
                                        marginBottom: 8,
                                    }}>
                                        <span style={{
                                            width: 5, height: 5, borderRadius: '50%',
                                            background: ct.color, flexShrink: 0,
                                            marginTop: 6,
                                        }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {/* Best For */}
                            <div style={{
                                fontSize: 10, color: '#6B7280', fontWeight: 600,
                                textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                                marginBottom: 16,
                            }}>
                                Best for: {ct.bestFor}
                            </div>

                            {/* CTA */}
                            <CheckoutButton 
                                campaignId={ct.id}
                                price={ct.price}
                                color={ct.color}
                                label={ct.cta}
                                href={ct.id === 'territory' ? '/advertise/territory' : ct.id === 'enterprise' ? '/advertise?contact=enterprise' : '/advertise/territory'}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section style={{
                padding: '3rem 1.5rem',
                maxWidth: 800,
                margin: '0 auto',
                textAlign: 'center',
                borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
                    Not sure which campaign is right?
                </h2>
                <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>
                    Compare all options on our main advertising page, or see territory-specific pricing.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/advertise" style={{
                        padding: '10px 20px', borderRadius: 10,
                        background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.25)',
                        color: '#D4A843', fontWeight: 700, fontSize: 13,
                        textDecoration: 'none',
                    }}>
                        View All Options â†’
                    </Link>
                    <Link href="/advertise/territory" style={{
                        padding: '10px 20px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#9CA3AF', fontWeight: 700, fontSize: 13,
                        textDecoration: 'none',
                    }}>
                        Territory Pricing â†’
                    </Link>
                </div>
            </section>

            {/* FAQ Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: 'How much does it cost to advertise on Haul Command?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Self-serve CPC campaigns start at $0.75/click. Corridor sponsorships are $199/month. Territory sponsorships range from $149-$499/month depending on state market tier. All campaigns can be paused or adjusted at any time.',
                                },
                            },
                            {
                                '@type': 'Question',
                                name: 'Is the traffic industry-specific?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Yes. 95%+ of Haul Command traffic is from verified pilot car operators, heavy haul carriers, brokers, and dispatchers. No consumer traffic. Every impression and click is industry-qualified.',
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}