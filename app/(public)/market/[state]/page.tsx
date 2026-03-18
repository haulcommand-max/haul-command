'use client';

/**
 * /market/[state] — State Market Intelligence Page
 * 
 * Mode-aware surface that adapts behavior based on market readiness:
 *   - live: Full action surfaces (loads, operators, corridors)
 *   - seeding: Claim + partner hunt emphasis
 *   - demand_capture: Waitlist + broker interest capture
 *   - waitlist: Coming soon + early registration
 * 
 * Fetches live data from /api/market/heartbeat?state=XX
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { MobileGate } from '@/components/mobile/MobileGate';
import { ClaimPressureEngine } from '@/components/market/ClaimPressureEngine';
import { OutcomeProofBlock } from '@/components/market/OutcomeProofBlock';
import { DensityScoreboard } from '@/components/market/DensityScoreboard';
import { IntentToActionBar, ReadinessState } from '@/components/search/SearchIntentModules';
import { OutcomeTimeline } from '@/components/outcomes/OutcomeEngine';
import { MarketMomentumModule } from '@/components/market/DominanceSignals';
import { RecentWinsModule } from '@/components/outcomes/SocialProofLayer';
import { NearbySupportModule } from '@/components/infrastructure/RouteSupportEngine';

interface HeartbeatData {
    active_loads: number;
    verified_operators: number;
    total_operators: number;
    claimed_operators: number;
    recent_loads: any[];
    market_mode: 'live' | 'seeding' | 'demand_capture' | 'waitlist';
    freshness_label: string;
    service_type_mix: Record<string, number>;
    rate_band: { min: number | null; max: number | null; median: number | null };
}

const STATE_NAMES: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    DC: 'Washington DC',
};

const MODE_CONFIG = {
    live: {
        color: '#22C55E', label: 'LIVE MARKET', emoji: '🟢',
        headline: (s: string) => `${s} is an active heavy haul market.`,
        sub: 'Live loads flowing. Verified operators available. Take action now.',
    },
    seeding: {
        color: '#F59E0B', label: 'SEEDING', emoji: '🌱',
        headline: (s: string) => `${s} market is building.`,
        sub: 'Operators are claiming profiles. Be among the first verified in this market.',
    },
    demand_capture: {
        color: '#8B5CF6', label: 'DEMAND CAPTURE', emoji: '📡',
        headline: (s: string) => `Demand detected in ${s}.`,
        sub: 'Loads are flowing but operator coverage is thin. Huge opportunity to claim territory.',
    },
    waitlist: {
        color: '#6B7280', label: 'COMING SOON', emoji: '⏳',
        headline: (s: string) => `${s} market launching soon.`,
        sub: 'Register your interest to be first when this market goes live.',
    },
};

export default function StateMarketPage({ params }: { params: Promise<{ state: string }> }) {
    const { state } = use(params);
    const stateCode = state.toUpperCase();
    const stateName = STATE_NAMES[stateCode] || stateCode;

    const [data, setData] = useState<HeartbeatData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/market/heartbeat?state=${stateCode}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [stateCode]);

    const mode = data ? MODE_CONFIG[data.market_mode] : MODE_CONFIG.waitlist;

    const content = (
        <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
            {/* Hero */}
            <div style={{ padding: '48px 16px 32px', maxWidth: 900, margin: '0 auto' }}>
                {/* Mode badge */}
                {!loading && data && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 14px', borderRadius: 999, marginBottom: 16,
                        background: `${mode.color}12`, border: `1px solid ${mode.color}30`,
                    }}>
                        <span>{mode.emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: mode.color, textTransform: 'uppercase' }}>
                            {mode.label}
                        </span>
                    </div>
                )}

                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900,
                    lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 12px',
                }}>
                    {stateName} Heavy Haul Market
                </h1>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 600, lineHeight: 1.5, margin: 0 }}>
                    {loading ? 'Loading market intelligence...' : mode.headline(stateName)}
                </p>
                {!loading && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>{mode.sub}</p>
                )}
            </div>

            {/* Stats strip */}
            {data && (
                <div style={{ padding: '0 16px', maxWidth: 900, margin: '0 auto' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: 12, marginBottom: 32,
                    }}>
                        {[
                            { val: data.active_loads, label: 'Active Loads', color: '#22C55E' },
                            { val: data.verified_operators, label: 'Verified', color: '#F59E0B' },
                            { val: data.total_operators, label: 'Total Operators', color: '#3B82F6' },
                            { val: data.claimed_operators, label: 'Claimed', color: '#8B5CF6' },
                        ].map(({ val, label, color }) => (
                            <div key={label} style={{
                                padding: '16px 14px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 26, fontWeight: 900, color }}>{val}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Outcome proof — market-level */}
            {data && (
                <div style={{ padding: '0 16px 16px', maxWidth: 900, margin: '0 auto' }}>
                    <OutcomeProofBlock variant="stacked" surface="market" state={stateCode} />
                </div>
            )}

            {/* Readiness state badge */}
            {data && (
                <div style={{ padding: '0 16px 16px', maxWidth: 900, margin: '0 auto' }}>
                    <ReadinessState mode={data.market_mode} stateName={stateName} />
                </div>
            )}

            {/* Density scoreboard */}
            {data && (
                <div style={{ padding: '0 16px 24px', maxWidth: 900, margin: '0 auto' }}>
                    <DensityScoreboard variant="market" state={stateCode} title={`${stateName} Market Density`} />
                </div>
            )}

            {/* Mode-aware content sections */}
            <div style={{ padding: '0 16px 80px', maxWidth: 900, margin: '0 auto' }}>
                {/* LIVE MODE: Action surfaces */}
                {data?.market_mode === 'live' && (
                    <>
                        {/* Recent loads */}
                        {data.recent_loads.length > 0 && (
                            <section style={{ marginBottom: 32 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px' }}>Recent Loads in {stateName}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {data.recent_loads.map((load, i) => (
                                        <div key={i} style={{
                                            padding: '14px 16px', borderRadius: 12,
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700 }}>{load.origin} → {load.destination}</div>
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                                                    {load.position_type} · {load.ago}
                                                </div>
                                            </div>
                                            {load.rate_amount && (
                                                <div style={{ fontSize: 16, fontWeight: 900, color: '#22C55E' }}>${load.rate_amount}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Outcome timeline */}
                        <div style={{ marginBottom: 24 }}>
                            <OutcomeTimeline state={stateCode} limit={5} title={`Recent Wins in ${stateName}`} />
                        </div>

                        {/* Market Momentum */}
                        <div style={{ marginBottom: 24 }}>
                            <MarketMomentumModule state={stateCode} />
                        </div>

                        {/* Social proof */}
                        <div style={{ marginBottom: 24 }}>
                            <RecentWinsModule state={stateCode} limit={4} />
                        </div>

                        {/* Route support */}
                        <div style={{ marginBottom: 24 }}>
                            <NearbySupportModule state={stateCode} limit={4} title={`Support in ${stateName}`} />
                        </div>

                        {/* Rate band */}
                        {data.rate_band.median && (
                            <section style={{ marginBottom: 32 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px' }}>Rate Intelligence</h2>
                                <div style={{
                                    padding: '18px 20px', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', justifyContent: 'space-around', textAlign: 'center',
                                }}>
                                    <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Low</div><div style={{ fontSize: 20, fontWeight: 900, color: '#EF4444' }}>${data.rate_band.min}</div></div>
                                    <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Median</div><div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B' }}>${data.rate_band.median}</div></div>
                                    <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>High</div><div style={{ fontSize: 20, fontWeight: 900, color: '#22C55E' }}>${data.rate_band.max}</div></div>
                                </div>
                            </section>
                        )}

                        {/* Action CTAs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Link href="/loads" style={{
                                padding: '18px 16px', borderRadius: 14,
                                background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.25)',
                                textDecoration: 'none', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>📋</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#F1A91B' }}>Browse Loads</div>
                            </Link>
                            <Link href="/directory" style={{
                                padding: '18px 16px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                textDecoration: 'none', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>🔍</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Find Operators</div>
                            </Link>
                        </div>
                    </>
                )}

                {/* SEEDING MODE: Claim + partner emphasis */}
                {data?.market_mode === 'seeding' && (
                    <>
                        <section style={{
                            padding: '24px 20px', borderRadius: 16, marginBottom: 24,
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
                            border: '1px solid rgba(245,158,11,0.2)',
                        }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#F59E0B' }}>
                                Be First in {stateName}
                            </h2>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: '0 0 16px' }}>
                                {data.claimed_operators} operators have already claimed their profile in {stateName}.
                                Verified operators get priority placement when the market goes live.
                            </p>
                            <Link href="/claim" style={{
                                display: 'inline-flex', padding: '12px 24px', borderRadius: 12,
                                background: '#F59E0B', color: '#000', fontWeight: 800, fontSize: 13,
                                textDecoration: 'none',
                            }}>
                                Claim Your Profile →
                            </Link>
                        </section>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Link href="/claim" style={{
                                padding: '18px 16px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                textDecoration: 'none', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>✓</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Claim Profile</div>
                            </Link>
                            <Link href="/sponsor" style={{
                                padding: '18px 16px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                textDecoration: 'none', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>🏗</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Sponsor Territory</div>
                            </Link>
                        </div>
                    </>
                )}

                {/* DEMAND_CAPTURE MODE: Waitlist + broker capture */}
                {data?.market_mode === 'demand_capture' && (
                    <section style={{
                        padding: '24px 20px', borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))',
                        border: '1px solid rgba(139,92,246,0.2)',
                    }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#8B5CF6' }}>
                            Demand Detected — Operators Needed
                        </h2>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: '0 0 16px' }}>
                            {data.active_loads} loads are flowing through {stateName} but operator coverage is thin.
                            Claim your profile now to capture this demand.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Link href="/claim" style={{
                                padding: '12px 24px', borderRadius: 12,
                                background: '#8B5CF6', color: '#fff', fontWeight: 800, fontSize: 13,
                                textDecoration: 'none',
                            }}>
                                Claim Profile
                            </Link>
                            <Link href="/loads" style={{
                                padding: '12px 24px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontWeight: 700, fontSize: 13,
                                textDecoration: 'none',
                            }}>
                                View Loads
                            </Link>
                        </div>
                    </section>
                )}

                {/* WAITLIST MODE */}
                {data?.market_mode === 'waitlist' && (
                    <section style={{
                        padding: '24px 20px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
                            {stateName} Market Launching Soon
                        </h2>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 20px' }}>
                            Be the first operator verified in {stateName}. Early claimers get founding badges and priority placement.
                        </p>
                        <Link href="/claim" style={{
                            display: 'inline-flex', padding: '14px 28px', borderRadius: 14,
                            background: 'linear-gradient(135deg, #F1A91B, #f1c27b)',
                            color: '#000', fontWeight: 900, fontSize: 14,
                            textDecoration: 'none',
                        }}>
                            Claim Your Profile →
                        </Link>
                    </section>
                )}

                {/* Explore links — always visible */}
                <div style={{ marginTop: 32 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                        Explore
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                            { href: '/directory', emoji: '📖', label: 'Directory' },
                            { href: '/corridor', emoji: '🛣', label: 'Corridors' },
                            { href: `/escort-requirements/${state}`, emoji: '📜', label: 'State Rules' },
                        ].map(link => (
                            <Link key={link.href} href={link.href} style={{
                                padding: '14px 12px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                textDecoration: 'none', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>{link.emoji}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{link.label}</div>
                            </Link>
                        ))}
                    </div>

                    {/* Intent-to-Action */}
                    <div style={{ marginTop: 20 }}>
                        <IntentToActionBar intent="general" state={stateCode} />
                    </div>
                </div>

                {/* Freshness footer */}
                {data && (
                    <div style={{ marginTop: 24, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                        Last activity: {data.freshness_label} · Data updates every 30 seconds
                    </div>
                )}
            </div>

            {/* Claim pressure — sticky bottom bar */}
            <ClaimPressureEngine
                listingId={`market-${stateCode}`}
                listingName={`${stateName} Market`}
                variant="sticky"
                state={stateCode}
                showValueContrast={false}
            />
        </div>
    );

    return (
        <MobileGate
            mobile={content}
            desktop={content}
        />
    );
}
