import Link from 'next/link';
import { CorridorMobileGate } from '@/components/mobile/gates/CorridorMobileGate';
import { getAllCorridorSlugs, getCorridorData } from '@/lib/data/corridors';
import { getCorridorSignals, getSignalBadge } from '@/lib/corridor-signals';

export const metadata = {
    title: 'Corridor Intelligence | Haul Command',
    description: 'Browse heavy haul corridors, demand pressure, and escort coverage before you post or bid.',
};

export default async function CorridorIndexPage() {
    const corridors = getAllCorridorSlugs()
        .map((slug) => getCorridorData(slug))
        .filter((corridor): corridor is NonNullable<typeof corridor> => corridor !== null);

    // Fetch live signals for all corridors in parallel
    const signalMap = new Map<string, Awaited<ReturnType<typeof getCorridorSignals>>>();
    const signalResults = await Promise.allSettled(
        corridors.map(async (c) => {
            const signals = await getCorridorSignals(c.slug);
            return { slug: c.slug, signals };
        })
    );
    for (const result of signalResults) {
        if (result.status === 'fulfilled' && result.value.signals) {
            signalMap.set(result.value.slug, result.value.signals);
        }
    }

    return (
        <CorridorMobileGate>
            <main style={{ minHeight: '100vh', background: 'var(--hc-bg)', color: 'var(--hc-text)' }}>
                <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 16px 88px' }}>
                    <section
                        style={{
                            padding: '28px',
                            borderRadius: 24,
                            border: '1px solid rgba(198, 146, 58, 0.18)',
                            background:
                                'linear-gradient(145deg, rgba(12, 16, 22, 0.98), rgba(17, 20, 28, 0.92))',
                            boxShadow: 'var(--shadow-card)',
                            marginBottom: 24,
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
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Corridor intelligence
                        </div>
                        <h1
                            style={{
                                margin: '16px 0 10px',
                                fontFamily: 'var(--font-display)',
                                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                                lineHeight: 1.02,
                                letterSpacing: '-0.04em',
                            }}
                        >
                            Watch the lanes that decide whether a load moves.
                        </h1>
                        <p
                            style={{
                                maxWidth: 720,
                                margin: 0,
                                color: 'var(--hc-muted)',
                                fontSize: '1rem',
                                lineHeight: 1.65,
                            }}
                        >
                            Haul Command surfaces broker pressure, escort density, and the route conditions that
                            turn a normal move into a hard fill. Browse the core corridors below and jump into the
                            lane that matters most right now.
                        </p>
                    </section>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                            gap: 16,
                        }}
                    >
                        {corridors.map((corridor) => (
                            <Link
                                key={corridor.slug}
                                href={`/corridor/${corridor.slug}`}
                                style={{
                                    display: 'block',
                                    padding: 20,
                                    borderRadius: 20,
                                    border: `1px solid ${
                                        corridor.hot ? 'rgba(198, 146, 58, 0.28)' : 'rgba(255, 255, 255, 0.08)'
                                    }`,
                                    background:
                                        corridor.hot
                                            ? 'linear-gradient(160deg, rgba(17, 20, 28, 0.98), rgba(27, 22, 14, 0.94))'
                                            : 'linear-gradient(160deg, rgba(15, 18, 24, 0.96), rgba(12, 15, 20, 0.94))',
                                    boxShadow: 'var(--shadow-card)',
                                    minHeight: 220,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                    <div>
                                        {(() => {
                                            const signals = signalMap.get(corridor.slug);
                                            const badge = signals ? getSignalBadge(signals) : null;
                                            return badge ? (
                                                <div style={{
                                                    fontSize: 12, fontWeight: 800,
                                                    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                                                    color: badge.color,
                                                    background: badge.bg,
                                                    padding: '4px 10px', borderRadius: 999,
                                                    display: 'inline-block',
                                                }}>
                                                    {badge.label}
                                                </div>
                                            ) : (
                                                <div style={{
                                                    fontSize: 12, fontWeight: 800,
                                                    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                                                    color: corridor.hot ? 'var(--hc-gold-400)' : 'var(--hc-muted)',
                                                }}>
                                                    {corridor.hot ? 'Hot corridor' : 'Active corridor'}
                                                </div>
                                            );
                                        })()}
                                        <div
                                            style={{
                                                marginTop: 8,
                                                fontSize: 24,
                                                lineHeight: 1.1,
                                                fontWeight: 900,
                                                color: 'var(--hc-text)',
                                            }}
                                        >
                                            {corridor.displayName}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            alignSelf: 'flex-start',
                                            padding: '6px 10px',
                                            borderRadius: 999,
                                            background:
                                                corridor.supplyPct < 35
                                                    ? 'rgba(239, 68, 68, 0.12)'
                                                    : 'rgba(245, 158, 11, 0.12)',
                                            color:
                                                corridor.supplyPct < 35
                                                    ? 'var(--hc-danger)'
                                                    : 'var(--hc-warning)',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.06em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {corridor.supplyPct < 35 ? 'Shortage' : 'Tight'}
                                    </div>
                                </div>

                                <p
                                    style={{
                                        margin: '16px 0 18px',
                                        color: 'var(--hc-muted)',
                                        fontSize: 14,
                                        lineHeight: 1.55,
                                    }}
                                >
                                    {corridor.endpoints}
                                </p>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                        gap: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 12,
                                            borderRadius: 14,
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                        }}
                                    >
                                        <div style={{ fontSize: 11, color: 'var(--hc-subtle)', textTransform: 'uppercase' }}>
                                            Escorts
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>{corridor.operatorCount}</div>
                                    </div>
                                    <div
                                        style={{
                                            padding: 12,
                                            borderRadius: 14,
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                        }}
                                    >
                                        <div style={{ fontSize: 11, color: 'var(--hc-subtle)', textTransform: 'uppercase' }}>
                                            Demand
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>{corridor.demandScore}</div>
                                    </div>
                                    <div
                                        style={{
                                            padding: 12,
                                            borderRadius: 14,
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                        }}
                                    >
                                        <div style={{ fontSize: 11, color: 'var(--hc-subtle)', textTransform: 'uppercase' }}>
                                            Miles
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>
                                            {corridor.totalMiles.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </CorridorMobileGate>
    );
}
