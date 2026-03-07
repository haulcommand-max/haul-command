/**
 * /available-now/[city-state] — "Available Now Near [City]" SEO Page
 *
 * Programmatic SEO: captures "pilot car available now near [city]" searches.
 * Shows real-time escort availability with live counts and booking CTA.
 */

import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Metadata } from 'next';
import OperatorTrustCard from '@/components/directory/OperatorTrustCard';

interface Props {
    params: Promise<{ 'city-state': string }>;
}

function parseCityState(slug: string): { city: string; stateCode: string } {
    const parts = slug.split('-');
    const stateCode = (parts.pop() ?? '').toUpperCase();
    const city = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { city, stateCode };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { city, stateCode } = parseCityState((await params)['city-state']);
    return {
        title: `Pilot Car Available Now Near ${city}, ${stateCode} | Haul Command`,
        description: `Find pilot car and escort vehicle operators available right now near ${city}, ${stateCode}. Real-time status, verified trust scores, instant booking. Updated every 30 seconds.`,
        openGraph: {
            title: `Available Now: Pilot Car Escorts Near ${city}, ${stateCode}`,
            description: `Live escort vehicle availability near ${city}. Verified operators ready for dispatch.`,
        },
    };
}

export default async function AvailableNowPage({ params }: Props) {
    const { city, stateCode } = parseCityState((await params)['city-state']);
    const supabase = await createClient();

    // Fetch available escorts in this state — include trust_score, is_claimed, equipment_tags for card upgrades
    const { data: escorts } = await supabase
        .from('driver_profiles')
        .select(`
            id, user_id, base_lat, base_lng, service_radius_miles,
            availability_status, has_high_pole, has_dashcam, equipment_tags,
            last_active_at, trust_score, is_claimed, verification_status,
            completed_escorts, reliability_score,
            profiles!inner ( display_name, home_state )
        `)
        .eq('profiles.home_state', stateCode)
        .eq('availability_status', 'available')
        .order('last_active_at', { ascending: false })
        .limit(20);

    const availableCount = escorts?.length ?? 0;
    const withHighPole = (escorts ?? []).filter((e: any) => e.has_high_pole).length;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #030712, #041e1a, #030712)',
            color: '#e2e8f0',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            {/* Hero */}
            <header style={{ padding: '60px 24px 40px', maxWidth: 900, margin: '0 auto' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 20,
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                    fontSize: 11, fontWeight: 800, color: '#22c55e', marginBottom: 16,
                }}>
                    <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
                        animation: 'pulse 2s ease-in-out infinite',
                    }} />
                    LIVE · Updated every 30 seconds
                </div>

                <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
                    Pilot Cars Available Now Near {city}
                </h1>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, maxWidth: 600 }}>
                    {availableCount} verified escort operators are currently available in {stateCode}.
                    Real-time availability, trust scores, and instant booking.
                </p>
            </header>

            <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px' }}>
                        <div style={{ fontSize: 10, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>🟢 Available Now</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#22c55e', fontFeatureSettings: '"tnum"' }}>{availableCount}</div>
                    </div>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px' }}>
                        <div style={{ fontSize: 10, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>📡 High Pole</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#3b82f6', fontFeatureSettings: '"tnum"' }}>{withHighPole}</div>
                    </div>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 20px' }}>
                        <div style={{ fontSize: 10, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>📍 Region</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#f97316' }}>{city}, {stateCode}</div>
                    </div>
                </div>

                {/* Escorts List — upgraded with OperatorTrustCard (3 competitive wins) */}
                {availableCount > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 40 }}>
                        {(escorts as any[]).map((e) => {
                            const lastActive = e.last_active_at
                                ? Math.floor((Date.now() - new Date(e.last_active_at).getTime()) / 60000)
                                : null;

                            // Build equipment flair tags from data
                            const equipmentTypes: string[] = [];
                            if (e.has_high_pole) equipmentTypes.push('High Pole');
                            if (e.has_dashcam) equipmentTypes.push('Dashcam');
                            if (Array.isArray(e.equipment_tags)) {
                                e.equipment_tags.forEach((t: string) => {
                                    if (!equipmentTypes.includes(t)) equipmentTypes.push(t);
                                });
                            }

                            const socialLine = lastActive !== null && lastActive < 60
                                ? `Active ${lastActive < 1 ? 'just now' : `${lastActive}m ago`}`
                                : undefined;

                            return (
                                <OperatorTrustCard
                                    key={e.user_id}
                                    id={e.id ?? e.user_id}
                                    name={e.profiles?.display_name ?? 'Operator'}
                                    profileHref={`/place/${e.id ?? e.user_id}`}
                                    location={`${city}, ${e.profiles?.home_state ?? stateCode}`}
                                    status="available"
                                    isVerified={e.verification_status === 'verified'}
                                    trustScore={e.trust_score ?? undefined}
                                    equipmentTypes={equipmentTypes}
                                    jobsCompleted={e.completed_escorts ?? undefined}
                                    confidenceScore={e.reliability_score ?? undefined}
                                    socialProofLine={socialLine}
                                    isClaimed={e.is_claimed ?? false}
                                    compact
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        background: '#0f172a', border: '1px solid #1e293b',
                        borderRadius: 16, padding: '40px', textAlign: 'center', marginBottom: 40,
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No Escorts Available Right Now</h3>
                        <p style={{ fontSize: 13, color: '#64748b' }}>
                            Post a load and our matching engine will find the best operators as they come online.
                        </p>
                    </div>
                )}

                {/* CTA */}
                <div style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    borderRadius: 20, padding: '32px', textAlign: 'center',
                }}>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                        Need an Escort Near {city}?
                    </h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>
                        Post your load and get matched with {availableCount > 0 ? `${availableCount} available` : 'verified'} operators instantly.
                    </p>
                    <Link href="/loads/post" style={{
                        display: 'inline-block', padding: '14px 32px',
                        background: '#fff', color: '#16a34a',
                        borderRadius: 12, fontWeight: 800, fontSize: 14,
                        textDecoration: 'none',
                    }}>
                        Post a Load →
                    </Link>
                </div>

                {/* SEO: nearby cities links */}
                <div style={{ marginTop: 40 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Also Available In</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {['Orlando', 'Tampa', 'Miami', 'Jacksonville', 'Dallas', 'Houston', 'Atlanta', 'Charlotte'].map(c => (
                            <Link key={c} href={`/available-now/${c.toLowerCase()}-${stateCode.toLowerCase()}`} style={{
                                padding: '6px 14px', borderRadius: 8,
                                background: '#0f172a', border: '1px solid #1e293b',
                                color: '#94a3b8', fontSize: 12, fontWeight: 600,
                                textDecoration: 'none',
                            }}>
                                {c}
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Service',
                        name: `Pilot Car Services Available Near ${city}, ${stateCode}`,
                        description: `${availableCount} escort vehicle operators available now near ${city}.`,
                        areaServed: { '@type': 'City', name: city, containedInPlace: { '@type': 'State', name: stateCode } },
                        provider: { '@type': 'Organization', name: 'Haul Command' },
                    }),
                }}
            />

            <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
        </div>
    );
}

