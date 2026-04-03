'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    getTerritoryPrice,
    getCorridorPrice,
    getPortPrice,
    getCountryTerritoryPrice,
    US_STATE_MARKET_TIER,
    CORRIDOR_TIER_MAP,
    PORT_TIER_MAP,
    getTierBadgeColor,
    formatSponsorPrice,
    projectAnnualTerritoryRevenue,
    type USMarketTier,
    type CorridorTier,
    type PortTier,
    type GlobalMarketTier,
} from '@/lib/monetization/sponsor-pricing';

// ═══════════════════════════════════════════════════════════════
// /advertise — SELF-SERVE SPONSOR STOREFRONT
//
// Monetization surfaces:
//   - Territory sponsorship (50 US states, tiered pricing)
//   - Corridor sponsorship (12 major corridors)
//   - Port sponsorship (10 major ports)
//   - Country sponsorship (120 countries, PPP-adjusted)
//
// Role+Intent: sponsor + acquire_territory + geo
// AdGrid: Every surface on this page IS the product
// ═══════════════════════════════════════════════════════════════

const T = {
    bg: '#0B0B0C',
    gold: '#D4A843',
    goldGlow: 'rgba(212,168,67,0.15)',
    goldBorder: 'rgba(212,168,67,0.25)',
    text: '#f9fafb',
    dim: '#9CA3AF',
    muted: '#6b7280',
    card: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)',
    green: '#10b981',
    cyan: '#22d3ee',
    blue: '#3b82f6',
};

type SponsorTab = 'territory' | 'corridor' | 'port' | 'country';

const US_STATES_FULL: Record<string, string> = {
    AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
    CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
    IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
    ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
    MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
    NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
    OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
    TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
    WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'Washington DC',
};

const TIER_LABEL: Record<USMarketTier, string> = {
    mega: '🔥 Mega Market',
    major: '⚡ Major Market',
    mid: '📊 Mid Market',
    growth: '🌱 Growth Market',
    emerging: '🌍 Emerging Market',
};

function TierBadge({ tier }: { tier: string }) {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        mega:     { bg: 'rgba(251,191,36,0.10)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
        major:    { bg: 'rgba(59,130,246,0.10)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
        mid:      { bg: 'rgba(156,163,175,0.10)', text: '#d1d5db', border: 'rgba(156,163,175,0.20)' },
        growth:   { bg: 'rgba(34,197,94,0.10)', text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
        emerging: { bg: 'rgba(107,114,128,0.10)', text: '#9ca3af', border: 'rgba(107,114,128,0.20)' },
        flagship: { bg: 'rgba(251,191,36,0.10)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
        primary:  { bg: 'rgba(59,130,246,0.10)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
        secondary:{ bg: 'rgba(156,163,175,0.10)', text: '#d1d5db', border: 'rgba(156,163,175,0.20)' },
        tier1:    { bg: 'rgba(251,191,36,0.10)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
        tier2:    { bg: 'rgba(59,130,246,0.10)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
        tier3:    { bg: 'rgba(156,163,175,0.10)', text: '#d1d5db', border: 'rgba(156,163,175,0.20)' },
        gold:     { bg: 'rgba(251,191,36,0.10)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
        blue:     { bg: 'rgba(59,130,246,0.10)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
        silver:   { bg: 'rgba(156,163,175,0.10)', text: '#d1d5db', border: 'rgba(156,163,175,0.20)' },
        slate:    { bg: 'rgba(107,114,128,0.10)', text: '#9ca3af', border: 'rgba(107,114,128,0.20)' },
    };
    const c = colors[tier] || colors.mid;
    return (
        <span style={{
            fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        }}>
            {tier}
        </span>
    );
}

function PriceCard({ title, subtitle, monthly, annual, tier, features, cta, ctaHref }: {
    title: string; subtitle?: string; monthly: number; annual?: number;
    tier: string; features: string[]; cta?: string; ctaHref?: string;
}) {
    return (
        <div style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
            padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
            transition: 'all 0.3s',
        }} className="ag-price-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: T.text }}>{title}</h3>
                    {subtitle && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{subtitle}</div>}
                </div>
                <TierBadge tier={tier} />
            </div>

            <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: T.gold }}>${monthly}</span>
                    <span style={{ fontSize: 13, color: T.muted }}>/mo</span>
                </div>
                {annual && (
                    <div style={{ fontSize: 11, color: T.green, marginTop: 4 }}>
                        ${annual}/mo billed annually · Save {Math.round((1 - annual / monthly) * 100)}%
                    </div>
                )}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {features.map((f, i) => (
                    <li key={i} style={{ fontSize: 12, color: T.dim, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: T.green, fontSize: 11 }}>✓</span> {f}
                    </li>
                ))}
            </ul>

            <Link
                href={ctaHref || '/contact?ref=sponsor'}
                style={{
                    marginTop: 'auto', padding: '12px 0', borderRadius: 10, textAlign: 'center',
                    background: `linear-gradient(135deg, ${T.gold}, #d97706)`,
                    color: '#000', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                    letterSpacing: '0.02em',
                }}
            >
                {cta || 'Claim This Territory'}
            </Link>
        </div>
    );
}

export default function AdvertisePage() {
    const [tab, setTab] = useState<SponsorTab>('territory');
    const [tierFilter, setTierFilter] = useState<USMarketTier | 'all'>('all');

    const stateEntries = Object.entries(US_STATE_MARKET_TIER)
        .map(([code, tier]) => ({ code, name: US_STATES_FULL[code] || code, ...getTerritoryPrice(code) }))
        .filter(s => tierFilter === 'all' || s.tier === tierFilter)
        .sort((a, b) => b.priceMonthly - a.priceMonthly);

    const corridorEntries = Object.entries(CORRIDOR_TIER_MAP)
        .map(([slug, tier]) => ({ slug, ...getCorridorPrice(slug) }));

    const portEntries = Object.entries(PORT_TIER_MAP)
        .map(([slug, tier]) => ({ slug, ...getPortPrice(slug) }));

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', system-ui" }}>
            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Advertise on Haul Command — Sponsor Territory, Corridor, or Port",
                "url": "https://haulcommand.com/advertise",
                "description": "Sponsor a territory, corridor, or port on the #1 heavy haul logistics platform. Tiered pricing from $149/mo. 50 US states, 12 corridors, 10 ports, 120 countries.",
            }) }} />

            {/* Hero */}
            <section style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${T.border}` }}>
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(212,168,67,0.5) 0%, transparent 70%)',
                }} />
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 60px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: T.goldGlow, border: `1px solid ${T.goldBorder}`,
                        borderRadius: 999, padding: '6px 16px', fontSize: 10, fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.12em', color: T.gold, marginBottom: 24,
                    }}>
                        💰 Revenue Opportunity · Limited Slots
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.08,
                        letterSpacing: '-0.03em', marginBottom: 16, maxWidth: 700,
                    }}>
                        Own the{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #D4A843, #E4B872)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            #1 Position
                        </span>{' '}
                        in Heavy Haul
                    </h1>
                    <p style={{ fontSize: 16, color: T.dim, lineHeight: 1.6, maxWidth: 560, marginBottom: 32 }}>
                        Sponsor a territory, corridor, or port. Your brand appears at the top of every relevant
                        directory page, search result, and intelligence report. Limited to 2 sponsors per zone.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📍</span>
                            <div><div style={{ fontWeight: 700 }}>50 US States</div><div style={{ fontSize: 11, color: T.muted }}>$149-$499/mo</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛣️</span>
                            <div><div style={{ fontWeight: 700 }}>12 Corridors</div><div style={{ fontSize: 11, color: T.muted }}>$179-$349/mo</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚓</span>
                            <div><div style={{ fontWeight: 700 }}>10 Ports</div><div style={{ fontSize: 11, color: T.muted }}>$299-$599/mo</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌍</span>
                            <div><div style={{ fontWeight: 700 }}>120 Countries</div><div style={{ fontSize: 11, color: T.muted }}>$219-$399/mo</div></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tab Navigation */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
                    {([
                        { id: 'territory' as SponsorTab, label: '📍 US Territories', count: Object.keys(US_STATE_MARKET_TIER).length },
                        { id: 'corridor' as SponsorTab, label: '🛣️ Corridors', count: Object.keys(CORRIDOR_TIER_MAP).length },
                        { id: 'port' as SponsorTab, label: '⚓ Ports', count: Object.keys(PORT_TIER_MAP).length },
                        { id: 'country' as SponsorTab, label: '🌍 Countries', count: 120 },
                    ] as const).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{
                                flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none',
                                cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                background: tab === t.id ? T.goldGlow : 'transparent',
                                color: tab === t.id ? T.gold : T.muted,
                                transition: 'all 0.2s',
                            }}
                        >
                            {t.label} <span style={{ opacity: 0.6 }}>({t.count})</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Content */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

                {/* ── TERRITORY TAB ── */}
                {tab === 'territory' && (
                    <>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                            {(['all', 'mega', 'major', 'mid', 'growth', 'emerging'] as const).map(f => (
                                <button key={f} onClick={() => setTierFilter(f)} style={{
                                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                    background: tierFilter === f ? T.goldGlow : 'rgba(255,255,255,0.04)',
                                    color: tierFilter === f ? T.gold : T.muted,
                                    transition: 'all 0.2s',
                                }}>
                                    {f === 'all' ? `All (${Object.keys(US_STATE_MARKET_TIER).length})` : TIER_LABEL[f]}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {stateEntries.map(s => (
                                <PriceCard
                                    key={s.code}
                                    title={`${s.name} (${s.code})`}
                                    subtitle={s.config.rationale}
                                    monthly={s.priceMonthly}
                                    annual={s.priceAnnualMonthly}
                                    tier={s.tier}
                                    features={[
                                        `Top placement in ${s.name} directory searches`,
                                        'Sponsor badge on all state pages',
                                        'Featured in email alerts for this territory',
                                        'Priority support + analytics dashboard',
                                        s.tier === 'mega' ? 'Exclusive: max 2 sponsors per state' : 'Limited slots available',
                                    ]}
                                    cta={`Own ${s.code} — $${s.priceMonthly}/mo`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* ── CORRIDOR TAB ── */}
                {tab === 'corridor' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {corridorEntries.map(c => (
                            <PriceCard
                                key={c.slug}
                                title={c.slug.toUpperCase().replace(/-/g, ' ')}
                                monthly={c.priceMonthly}
                                annual={c.priceAnnualMonthly}
                                tier={c.tier}
                                features={[
                                    `Sponsor badge on ${c.slug.toUpperCase()} corridor pages`,
                                    'Featured in corridor intelligence reports',
                                    'Priority listing for all operators in this corridor',
                                    'Corridor activity alerts + analytics',
                                ]}
                                cta={`Own ${c.slug.toUpperCase()} — $${c.priceMonthly}/mo`}
                            />
                        ))}
                    </div>
                )}

                {/* ── PORT TAB ── */}
                {tab === 'port' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {portEntries.map(p => (
                            <PriceCard
                                key={p.slug}
                                title={p.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                monthly={p.priceMonthly}
                                annual={p.priceAnnualMonthly}
                                tier={p.tier}
                                features={[
                                    'Premium placement on port-adjacent pages',
                                    'Featured in port logistics intelligence',
                                    `Max ${p.maxSlots} sponsor slot${p.maxSlots > 1 ? 's' : ''} — exclusivity`,
                                    'Port activity alerts + demand data',
                                ]}
                                cta={`Claim Port — $${p.priceMonthly}/mo`}
                            />
                        ))}
                    </div>
                )}

                {/* ── COUNTRY TAB ── */}
                {tab === 'country' && (
                    <div>
                        <p style={{ fontSize: 13, color: T.dim, marginBottom: 24, lineHeight: 1.6 }}>
                            Sponsor a country to dominate heavy haul search results across that market.
                            Pricing is PPP-adjusted. Contact us for multi-country packages.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {([
                                { code: 'US', tier: 'gold' as GlobalMarketTier, name: 'United States' },
                                { code: 'CA', tier: 'gold' as GlobalMarketTier, name: 'Canada' },
                                { code: 'AU', tier: 'gold' as GlobalMarketTier, name: 'Australia' },
                                { code: 'GB', tier: 'gold' as GlobalMarketTier, name: 'United Kingdom' },
                                { code: 'DE', tier: 'gold' as GlobalMarketTier, name: 'Germany' },
                                { code: 'NL', tier: 'gold' as GlobalMarketTier, name: 'Netherlands' },
                                { code: 'BR', tier: 'gold' as GlobalMarketTier, name: 'Brazil' },
                                { code: 'AE', tier: 'gold' as GlobalMarketTier, name: 'UAE' },
                                { code: 'SE', tier: 'blue' as GlobalMarketTier, name: 'Sweden' },
                                { code: 'NO', tier: 'blue' as GlobalMarketTier, name: 'Norway' },
                                { code: 'FR', tier: 'blue' as GlobalMarketTier, name: 'France' },
                                { code: 'ES', tier: 'blue' as GlobalMarketTier, name: 'Spain' },
                                { code: 'JP', tier: 'silver' as GlobalMarketTier, name: 'Japan' },
                                { code: 'KR', tier: 'silver' as GlobalMarketTier, name: 'South Korea' },
                                { code: 'MX', tier: 'blue' as GlobalMarketTier, name: 'Mexico' },
                                { code: 'ZA', tier: 'gold' as GlobalMarketTier, name: 'South Africa' },
                            ]).map(c => {
                                const pricing = getCountryTerritoryPrice(c.code, c.tier);
                                return (
                                    <PriceCard
                                        key={c.code}
                                        title={`${c.name} (${c.code})`}
                                        monthly={pricing.priceMonthly}
                                        tier={c.tier}
                                        features={[
                                            `Top placement in ${c.name} directory`,
                                            'Country-wide sponsor badge',
                                            `Max ${pricing.maxSlots} sponsor slot${pricing.maxSlots > 1 ? 's' : ''}`,
                                            'Featured in country intelligence reports',
                                        ]}
                                        cta={`Own ${c.code} — $${pricing.priceMonthly}/mo`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* Social Proof / Scarcity */}
            <section style={{ borderTop: `1px solid ${T.border}`, background: '#0a0a0d' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>
                        Why Sponsors{' '}
                        <span style={{ color: T.gold }}>Win</span>
                    </h2>
                    <p style={{ fontSize: 14, color: T.dim, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
                        Haul Command is the #1 platform heavy haul operators use to find work,
                        check regulations, and calculate rates. Your brand becomes the default.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                        {[
                            { metric: '120', label: 'Countries covered' },
                            { metric: '50', label: 'US States' },
                            { metric: '2', label: 'Max sponsors per zone' },
                            { metric: '$149', label: 'Starting monthly' },
                        ].map((s, i) => (
                            <div key={i} style={{ padding: 24, borderRadius: 14, background: T.card, border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: 32, fontWeight: 900, color: T.gold }}>{s.metric}</div>
                                <div style={{ fontSize: 11, color: T.muted, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section style={{ borderTop: `1px solid ${T.border}` }}>
                <div style={{ maxWidth: 700, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
                        Ready to claim your territory?
                    </h2>
                    <p style={{ fontSize: 14, color: T.dim, marginBottom: 32, lineHeight: 1.6 }}>
                        Contact our partnerships team or start your sponsorship today. Annual plans save 15%.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/contact?ref=sponsor" style={{
                            padding: '16px 40px', borderRadius: 12,
                            background: `linear-gradient(135deg, ${T.gold}, #d97706)`,
                            color: '#000', fontWeight: 900, fontSize: 14, textDecoration: 'none',
                            textTransform: 'uppercase', letterSpacing: '0.03em',
                        }}>
                            Start Sponsoring →
                        </Link>
                        <Link href="/data" style={{
                            padding: '16px 40px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                            color: T.text, fontWeight: 700, fontSize: 14, textDecoration: 'none',
                        }}>
                            Browse Data Products
                        </Link>
                    </div>
                </div>
            </section>

            <style dangerouslySetInnerHTML={{ __html: `
                .ag-price-card:hover {
                    border-color: rgba(212,168,67,0.20) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
                }
            `}} />
        </div>
    );
}
