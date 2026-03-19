/**
 * /county/[county-slug] — County SEO Page
 *
 * "Pilot Car Escorts in [County], [State]"
 * Shows live escort counts, scarcity slots, nearby corridors, and CTA.
 */

import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import OperatorTrustCard from '@/components/directory/OperatorTrustCard';

interface Props {
    params: Promise<{ 'county-slug': string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { 'county-slug': slug } = await params;
    const parts = slug.split('-');
    const stateCode = parts.pop()?.toUpperCase() ?? '';
    const countyName = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return {
        title: `Pilot Car Escorts in ${countyName} County, ${stateCode} | Haul Command`,
        description: `Find available pilot car and escort vehicle operators in ${countyName} County, ${stateCode}. Real-time availability, trust scores, and instant booking. ${countyName} County's leading platform for oversize load escorts.`,
        openGraph: {
            title: `${countyName} County Pilot Car Escorts — Haul Command`,
            description: `Live escort vehicle availability in ${countyName} County, ${stateCode}. Verified operators with real-time status.`,
        },
    };
}

export default async function CountyPage({ params }: Props) {
    const { 'county-slug': slug } = await params;
    const parts = slug.split('-');
    const stateCode = parts.pop()?.toUpperCase() ?? '';
    const countyName = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const supabase = await createClient();

    // Fetch county data + territory slots
    const { data: territory } = await supabase
        .from('county_territories')
        .select('*')
        .eq('state_code', stateCode)
        .ilike('county_name', countyName)
        .single();

    // Fetch escorts based in this state — include trust_score, is_claimed, equipment_tags
    const { data: escorts, count: escortCount } = await supabase
        .from('directory_listings')
        .select(`
            id, user_id, availability_status, has_high_pole, has_dashcam,
            equipment_tags, trust_score, is_claimed, verification_status,
            completed_escorts, reliability_score,
            profiles!inner(display_name, home_state)
        `, { count: 'exact' })
        .eq('profiles.home_state', stateCode)
        .in('availability_status', ['available', 'busy'])
        .limit(12);

    const availableNow = (escorts ?? []).filter((e: any) => e.availability_status === 'available').length;
    const maxSlots = territory?.max_slots ?? 3;
    const claimedSlots = territory?.claimed_slots ?? 0;
    const remaining = Math.max(0, maxSlots - claimedSlots);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #030712, #0c1222, #030712)',
            color: '#e2e8f0',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            {/* Hero */}
            <header style={{
                padding: '60px 24px 40px',
                maxWidth: 900,
                margin: '0 auto',
            }}>
                <div style={{ fontSize: 12, color: '#f97316', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                    📍 {stateCode} · County Intelligence
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
                    Pilot Car Escorts in {countyName} County
                </h1>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, maxWidth: 600 }}>
                    Real-time escort vehicle availability in {countyName} County, {stateCode}.
                    Verified operators with trust scores, response times, and equipment capabilities.
                    Book instantly or post a load for competitive bids.
                </p>
            </header>

            <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
                {/* Live Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 12,
                    marginBottom: 32,
                }}>
                    <StatCard label="Available Now" value={String(availableNow)} color="#22c55e" icon="🟢" />
                    <StatCard label="Total in State" value={String(escortCount ?? 0)} color="#3b82f6" icon="🚗" />
                    <StatCard
                        label="Territory Slots"
                        value={`${remaining}/${maxSlots}`}
                        color={remaining <= 1 ? '#fbbf24' : '#94a3b8'}
                        icon={remaining <= 0 ? '🔴' : remaining <= 1 ? '🟡' : '🟢'}
                    />
                </div>

                {/* Scarcity Banner */}
                {remaining <= 1 && (
                    <div style={{
                        padding: '14px 20px',
                        background: remaining <= 0 ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
                        border: `1px solid ${remaining <= 0 ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`,
                        borderRadius: 12,
                        marginBottom: 24,
                        fontSize: 13,
                        fontWeight: 700,
                        color: remaining <= 0 ? '#f87171' : '#fbbf24',
                    }}>
                        {remaining <= 0
                            ? `⚠️ All ${maxSlots} territory slots in ${countyName} County are claimed. Competition is high.`
                            : `🔥 Only 1 territory slot remaining in ${countyName} County!`}
                    </div>
                )}

                {/* Escorts Grid */}
                {escorts && escorts.length > 0 && (
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                            Nearby Operators
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: 16,
                        }}>
                            {(escorts as any[]).map((e) => {
                                // Build equipment flair tags
                                const equipmentTypes: string[] = [];
                                if (e.has_high_pole) equipmentTypes.push('High Pole');
                                if (e.has_dashcam) equipmentTypes.push('Dashcam');
                                if (Array.isArray(e.equipment_tags)) {
                                    e.equipment_tags.forEach((t: string) => {
                                        if (!equipmentTypes.includes(t)) equipmentTypes.push(t);
                                    });
                                }

                                return (
                                    <OperatorTrustCard
                                        key={e.user_id}
                                        id={e.id ?? e.user_id}
                                        name={e.profiles?.display_name ?? 'Operator'}
                                        profileHref={`/place/${e.id ?? e.user_id}`}
                                        location={`${countyName} County, ${stateCode}`}
                                        status={e.availability_status === 'available' ? 'available' : 'busy'}
                                        isVerified={e.verification_status === 'verified'}
                                        trustScore={e.trust_score ?? undefined}
                                        equipmentTypes={equipmentTypes}
                                        jobsCompleted={e.completed_escorts ?? undefined}
                                        confidenceScore={e.reliability_score ?? undefined}
                                        isClaimed={e.is_claimed ?? false}
                                        compact
                                    />
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* CTA */}
                <div style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    borderRadius: 20,
                    padding: '32px',
                    textAlign: 'center',
                }}>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                        Need an Escort in {countyName} County?
                    </h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>
                        Post your load and get matched with verified operators in minutes.
                    </p>
                    <Link href="/loads/post" style={{
                        display: 'inline-block', padding: '14px 32px',
                        background: '#fff', color: '#ea580c',
                        borderRadius: 12, fontWeight: 800, fontSize: 14,
                        textDecoration: 'none',
                    }}>
                        Post a Load →
                    </Link>
                </div>

                {/* Schema.org */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'LocalBusiness',
                            name: `Pilot Car Services in ${countyName} County, ${stateCode}`,
                            description: `Find escort vehicle operators in ${countyName} County, ${stateCode}. Verified, real-time availability.`,
                            areaServed: {
                                '@type': 'AdministrativeArea',
                                name: `${countyName} County, ${stateCode}`,
                            },
                        }),
                    }}
                />
            </main>
        </div>
    );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
    return (
        <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 14, padding: '16px 20px',
        }}>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color, fontFeatureSettings: '"tnum"' }}>{value}</div>
        </div>
    );
}
