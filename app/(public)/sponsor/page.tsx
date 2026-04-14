'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SponsorPlanKey = 'city_sponsor_basic' | 'city_sponsor_premium' | 'corridor_sponsor';
type MarketType = 'city' | 'corridor';

interface SponsorPlan {
    key: SponsorPlanKey;
    badge: string;
    title: string;
    summary: string;
    marketType: MarketType;
    detail: string;
    placements: string[];
}

interface MarketOption {
    value: string;
    signal: string;
    note: string;
}

const SPONSOR_PLANS: SponsorPlan[] = [
    {
        key: 'city_sponsor_basic',
        badge: 'Fast start',
        title: 'Featured local operator',
        summary: 'Show up first when a broker checks who is active in your city.',
        marketType: 'city',
        detail:
            'Best for operators who want clean, premium visibility inside the directory and local discovery surfaces without buying a full market takeover.',
        placements: ['Priority directory card', 'Verified premium treatment', 'Local discovery boost'],
    },
    {
        key: 'city_sponsor_premium',
        badge: 'Market owner',
        title: 'Founding market sponsor',
        summary: 'Own the city-level story with the strongest placement in your lane.',
        marketType: 'city',
        detail:
            'Built for operators and service companies that want a true market position, not just another listing. Strongest fit for launch cities and mature lanes.',
        placements: ['Hero placement on city surfaces', 'Premium CTA and lead routing', 'Performance reporting in checkout flow'],
    },
    {
        key: 'corridor_sponsor',
        badge: 'Decision support',
        title: 'Corridor intelligence sponsor',
        summary: 'Show up where broker urgency and escort shortages actually spike.',
        marketType: 'corridor',
        detail:
            'Designed for brands that want to ride the corridor demand curve: route intelligence surfaces, corridor cards, and the planning moments before a load gets posted.',
        placements: ['Corridor intelligence card', 'Native map and list placement', 'Priority corridor callout'],
    },
];

const CITY_MARKETS: MarketOption[] = [
    { value: 'Houston, TX', signal: 'Hard-fill rescue demand', note: 'Broker activity remains elevated around Gulf corridor moves.' },
    { value: 'Savannah, GA', signal: 'Port-linked heavy haul demand', note: 'Strong handoff traffic into I-16 and I-95 support lanes.' },
    { value: 'Phoenix, AZ', signal: 'High permit-planning volume', note: 'Strong route-planning behavior before loads hit dispatch.' },
];

const CORRIDOR_MARKETS: MarketOption[] = [
    { value: 'I-10 Corridor', signal: 'Highest shortage pressure', note: 'Long-haul escort demand stays consistently tight across Gulf legs.' },
    { value: 'I-35 Corridor', signal: 'Wind and industrial moves', note: 'Persistent broker research behavior before premium dispatch waves.' },
    { value: 'I-75 Corridor', signal: 'Year-round manufacturing flow', note: 'Strong corridor relevance for repeat freight and regional escort teams.' },
];

const INTELLIGENCE_SLOTS = [
    {
        title: 'Home intelligence cell',
        body: 'A native market card inside the command center for urgent demand, shortage callouts, and premium local sponsor positioning.',
    },
    {
        title: 'Corridor sponsor card',
        body: 'Own the route-level moment when a broker is comparing coverage, pressure, and whether the lane is becoming a hard fill.',
    },
    {
        title: 'Featured local operator',
        body: 'Premium directory treatment for operators, service yards, hotels, and partners who need trust plus visibility.',
    },
];

function getMarkets(marketType: MarketType) {
    return marketType === 'corridor' ? CORRIDOR_MARKETS : CITY_MARKETS;
}

export default function SponsorPage() {
    const [selectedPlanKey, setSelectedPlanKey] = useState<SponsorPlanKey>('city_sponsor_premium');
    const [selectedMarket, setSelectedMarket] = useState<string>('Houston, TX');

    const activePlan = SPONSOR_PLANS.find((plan) => plan.key === selectedPlanKey) ?? SPONSOR_PLANS[0];
    const marketOptions = getMarkets(activePlan.marketType);

    function handlePlanSelect(planKey: SponsorPlanKey) {
        const nextPlan = SPONSOR_PLANS.find((plan) => plan.key === planKey) ?? SPONSOR_PLANS[0];
        setSelectedPlanKey(nextPlan.key);
        setSelectedMarket(getMarkets(nextPlan.marketType)[0].value);
    }

    // Live proof data
    const [proofData, setProofData] = useState({ operators: 0, corridors: 0, surgeActive: 0 });
    const [marketPricing, setMarketPricing] = useState<{
        tier_label: string;
        base_price_monthly: number;
        messaging: string;
        scarcity_label: string;
        pricing_posture: string;
        surge_active: boolean;
        operator_count: number;
    } | null>(null);

    useEffect(() => {
        fetch('/api/directory/listings?limit=1')
            .then(r => r.ok ? r.json() : null)
            .then(d => d?.total && setProofData(prev => ({ ...prev, operators: d.total })))
            .catch(() => {});
        fetch('/api/v1/demand-intelligence/corridors?country_code=US')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d?.corridors) setProofData(prev => ({
                    ...prev, corridors: d.corridors.length, surgeActive: d.surge_active_count ?? 0
                }));
            })
            .catch(() => {});
    }, []);

    // Fetch density-driven pricing when market selection changes
    useEffect(() => {
        const type = activePlan.marketType === 'corridor' ? 'corridor' : 'city';
        const slug = selectedMarket.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        fetch(`/api/sponsor/pricing?type=${type}&value=${slug}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d?.ok && d.pricing) setMarketPricing(d.pricing);
            })
            .catch(() => {});
    }, [selectedMarket, activePlan.marketType]);

    return (
        <div
            className="m-shell-content"
            style={{
                minHeight: '100dvh',
                background:
                    'radial-gradient(circle at top left, rgba(198, 146, 58, 0.12), transparent 32%), var(--m-bg, #060b12)',
                color: 'var(--m-text-primary, #f5f7fb)',
            }}
        >
            <div
                style={{
                    maxWidth: 1040,
                    margin: '0 auto',
                    padding: '20px var(--m-screen-pad, 16px) calc(var(--m-nav-height, 56px) + var(--m-safe-bottom, 0px) + 128px)',
                }}
            >
                <section
                    style={{
                        padding: 24,
                        borderRadius: 24,
                        border: '1px solid rgba(198, 146, 58, 0.18)',
                        background:
                            'linear-gradient(145deg, rgba(10, 14, 19, 0.98), rgba(16, 19, 26, 0.95))',
                        boxShadow: 'var(--shadow-card)',
                    }}
                >
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 12px',
                            borderRadius: 999,
                            border: '1px solid rgba(198, 146, 58, 0.18)',
                            background: 'rgba(198, 146, 58, 0.08)',
                            color: 'var(--hc-gold-400)',
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}
                    >
                        âš¡ Limited territory inventory
                    </div>
                    <h1
                        style={{
                            margin: '16px 0 10px',
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(2rem, 5vw, 3.75rem)',
                            lineHeight: 1,
                            letterSpacing: '-0.04em',
                        }}
                    >
                        Sponsor the market brokers already watch.
                    </h1>
                    <p
                        style={{
                            maxWidth: 700,
                            margin: 0,
                            color: 'var(--m-text-secondary, #c7ccd7)',
                            fontSize: '1rem',
                            lineHeight: 1.65,
                        }}
                    >
                        Haul Command sponsorship should feel like a useful market surface, not a random banner.
                        Choose the lane you want to own, pick the market you care about, and continue to the
                        live checkout flow when you are ready.
                    </p>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                            gap: 12,
                            marginTop: 20,
                        }}
                    >
                        {[
                            { value: proofData.operators > 0 ? proofData.operators.toLocaleString() : '6,949', label: 'operators visible — sponsor yours' },
                            { value: proofData.corridors > 0 ? `${proofData.corridors} corridors` : 'City + corridor', label: proofData.surgeActive > 0 ? `${proofData.surgeActive} surge active now` : 'pressure tracked live' },
                            { value: 'Limited', label: 'founding slots remaining' },
                        ].map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    padding: 14,
                                    borderRadius: 18,
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                }}
                            >
                                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--hc-gold-400)' }}>{item.value}</div>
                                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--m-text-muted, #8f97a7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={{ marginTop: 20 }}>
                    <div
                        style={{
                            marginBottom: 10,
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--m-text-muted, #8f97a7)',
                        }}
                    >
                        Choose a sponsor path
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                            gap: 12,
                        }}
                    >
                        {SPONSOR_PLANS.map((plan) => {
                            const active = plan.key === activePlan.key;
                            return (
                                <button aria-label="Interactive Button"
                                    key={plan.key}
                                    type="button"
                                    onClick={() => handlePlanSelect(plan.key)}
                                    style={{
                                        borderRadius: 20,
                                        border: `1px solid ${
                                            active ? 'rgba(198, 146, 58, 0.36)' : 'rgba(255, 255, 255, 0.08)'
                                        }`,
                                        background: active
                                            ? 'linear-gradient(160deg, rgba(26, 22, 13, 0.96), rgba(13, 16, 22, 0.96))'
                                            : 'linear-gradient(160deg, rgba(14, 17, 22, 0.96), rgba(10, 13, 18, 0.94))',
                                        color: 'inherit',
                                        padding: 18,
                                        textAlign: 'left',
                                        boxShadow: active ? 'var(--shadow-gold)' : 'var(--shadow-card)',
                                        transition: 'all var(--transition-std, 160ms ease)',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '5px 10px',
                                            borderRadius: 999,
                                            background: active ? 'rgba(198, 146, 58, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                            color: active ? 'var(--hc-gold-400)' : 'var(--m-text-muted, #8f97a7)',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {plan.badge}
                                    </div>
                                    <div style={{ marginTop: 14, fontSize: 22, lineHeight: 1.05, fontWeight: 900 }}>{plan.title}</div>
                                    <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--m-text-secondary, #c7ccd7)' }}>
                                        {plan.summary}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                        gap: 14,
                        marginTop: 20,
                    }}
                >
                    <div
                        style={{
                            padding: 20,
                            borderRadius: 22,
                            border: '1px solid rgba(198, 146, 58, 0.16)',
                            background: 'linear-gradient(160deg, rgba(12, 16, 22, 0.96), rgba(15, 18, 24, 0.94))',
                            boxShadow: 'var(--shadow-card)',
                        }}
                    >
                        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--hc-gold-400)' }}>
                            Selected package
                        </div>
                        <div style={{ marginTop: 10, fontSize: 28, lineHeight: 1.02, fontWeight: 900 }}>{activePlan.title}</div>
                        <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.65, color: 'var(--m-text-secondary, #c7ccd7)' }}>
                            {activePlan.detail}
                        </p>
                        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                            {activePlan.placements.map((placement) => (
                                <div
                                    key={placement}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '12px 14px',
                                        borderRadius: 16,
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                        fontSize: 14,
                                        color: 'var(--m-text-primary, #f5f7fb)',
                                    }}
                                >
                                    <span style={{ color: 'var(--hc-gold-400)', fontWeight: 900 }}>+</span>
                                    <span>{placement}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            padding: 20,
                            borderRadius: 22,
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            background: 'linear-gradient(160deg, rgba(12, 16, 22, 0.96), rgba(14, 18, 25, 0.94))',
                            boxShadow: 'var(--shadow-card)',
                        }}
                    >
                        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--m-text-muted, #8f97a7)' }}>
                            Target market
                        </div>
                        <div style={{ marginTop: 8, fontSize: 22, lineHeight: 1.1, fontWeight: 900 }}>
                            Pick the lane you want to own.
                        </div>
                        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                            {marketOptions.map((market) => {
                                const active = market.value === selectedMarket;
                                return (
                                    <button aria-label="Interactive Button"
                                        key={market.value}
                                        type="button"
                                        onClick={() => setSelectedMarket(market.value)}
                                        style={{
                                            padding: '14px 15px',
                                            borderRadius: 16,
                                            border: `1px solid ${
                                                active ? 'rgba(198, 146, 58, 0.32)' : 'rgba(255, 255, 255, 0.07)'
                                            }`,
                                            background: active
                                                ? 'rgba(198, 146, 58, 0.08)'
                                                : 'rgba(255, 255, 255, 0.02)',
                                            color: 'inherit',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <div style={{ fontSize: 16, fontWeight: 800 }}>{market.value}</div>
                                        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--hc-gold-400)' }}>{market.signal}</div>
                                        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--m-text-muted, #8f97a7)', lineHeight: 1.5 }}>
                                            {market.note}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section style={{ marginTop: 20 }}>
                    <div
                        style={{
                            marginBottom: 10,
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--m-text-muted, #8f97a7)',
                        }}
                    >
                        Native sponsor surfaces
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                            gap: 12,
                        }}
                    >
                        {INTELLIGENCE_SLOTS.map((slot) => (
                            <div
                                key={slot.title}
                                style={{
                                    padding: 18,
                                    borderRadius: 18,
                                    border: '1px solid rgba(255, 255, 255, 0.07)',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    boxShadow: 'var(--shadow-card)',
                                }}
                            >
                                <div style={{ fontSize: 18, lineHeight: 1.1, fontWeight: 900 }}>{slot.title}</div>
                                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--m-text-secondary, #c7ccd7)' }}>
                                    {slot.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div
                style={{
                    position: 'sticky',
                    bottom: 'calc(var(--m-nav-height, 56px) + var(--m-safe-bottom, 0px) + 12px)',
                    zIndex: 5,
                    padding: '0 var(--m-screen-pad, 16px) 12px',
                }}
            >
                <div
                    style={{
                        maxWidth: 1040,
                        margin: '0 auto',
                        padding: 16,
                        borderRadius: 22,
                        border: '1px solid rgba(198, 146, 58, 0.18)',
                        background: 'rgba(9, 11, 15, 0.9)',
                        backdropFilter: 'blur(18px)',
                        boxShadow: 'var(--shadow-gold)',
                    }}
                >
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--m-text-muted, #8f97a7)' }}>
                                Ready to launch
                            </div>
                            <div style={{ marginTop: 6, fontSize: 20, lineHeight: 1.1, fontWeight: 900 }}>
                                {activePlan.title} for {selectedMarket}
                            </div>
                            {/* Density-driven pricing intelligence */}
                            {marketPricing && (
                                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                                            padding: '3px 8px', borderRadius: 6,
                                            background: marketPricing.surge_active ? 'rgba(239,68,68,0.15)' : 'rgba(198,146,58,0.15)',
                                            border: `1px solid ${marketPricing.surge_active ? 'rgba(239,68,68,0.3)' : 'rgba(198,146,58,0.3)'}`,
                                            color: marketPricing.surge_active ? '#ef4444' : 'var(--hc-gold-400)',
                                        }}>
                                            {marketPricing.tier_label}
                                        </span>
                                        <span style={{
                                            fontSize: 10, fontWeight: 800,
                                            color: 'var(--m-text-muted)',
                                        }}>
                                            {marketPricing.scarcity_label}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--m-text-secondary)', lineHeight: 1.4 }}>
                                        {marketPricing.messaging}
                                    </div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--hc-gold-400)', marginTop: 4 }}>
                                        ${marketPricing.base_price_monthly}<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--m-text-muted)' }}>/mo</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Link aria-label="Navigation Link"
                                href={{
                                    pathname: '/sponsor/checkout',
                                    query: {
                                        product: activePlan.key,
                                        city: selectedMarket,
                                    },
                                }}
                                className="m-btn m-btn--primary"
                                style={{ textDecoration: 'none', justifyContent: 'center', flex: '1 1 220px' }}
                            >
                                Continue to checkout
                            </Link>
                            <Link aria-label="Navigation Link"
                                href="/directory"
                                className="m-btn m-btn--secondary"
                                style={{ textDecoration: 'none', justifyContent: 'center', flex: '1 1 180px' }}
                            >
                                See live directory surface
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}