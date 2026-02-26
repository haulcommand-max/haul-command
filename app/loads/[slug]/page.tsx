import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { BrokerReportCard } from '@/components/intelligence/ReportCards';
import CorridorRiskWidget from '@/components/intelligence/CorridorRiskWidget';
import { GatedCTA } from '@/components/ui/GatedCTA';
import { GreenlightBanner } from '@/components/load-board/GreenlightBanner';

export const revalidate = 60;

interface PageProps {
    params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = supabaseServer();
    const { data } = await supabase
        .from('v_loads_teaser')
        .select('origin_city, origin_state, dest_city, dest_state, service_required, rate_band')
        .eq('load_id', params.slug)
        .single();

    if (!data) return { title: 'Load Not Found | Haul Command' };

    return {
        title: `${data.service_required}: ${data.origin_city} → ${data.dest_city} | Haul Command`,
        description: `Open ${data.service_required} load from ${data.origin_city}, ${data.origin_state} to ${data.dest_city}, ${data.dest_state}. Rate: ${data.rate_band}. Join Haul Command to apply.`,
    };
}

export default async function LoadDetailPage({ params }: PageProps) {
    const supabase = supabaseServer();

    const { data: load } = await supabase
        .from('v_loads_teaser')
        .select('*')
        .eq('load_id', params.slug)
        .single();

    if (!load) notFound();

    // Get auth session to decide what to show
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthed = !!session;

    const fillColors = { HIGH: '#10b981', MEDIUM: '#f59e0b', LOW: '#ef4444' } as Record<string, string>;
    const fillColor = load.fill_bucket ? (fillColors[load.fill_bucket] ?? '#6b7280') : '#6b7280';

    return (
        <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px', color: 'var(--hc-text, #f5f5f5)' }}>

            {/* Breadcrumb */}
            <nav style={{ fontSize: 12, color: 'var(--hc-muted, #888)', marginBottom: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Link href="/" style={{ color: '#d97706', textDecoration: 'none' }}>Home</Link>
                <span>/</span>
                <Link href="/loads" style={{ color: '#d97706', textDecoration: 'none' }}>Loads</Link>
                <span>/</span>
                <span>{load.origin_city} → {load.dest_city}</span>
            </nav>

            {/* Hero */}
            <header style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                            <span style={badge('#d97706', 'rgba(217,119,6,0.15)')}>{load.service_required}</span>
                            {load.urgency && (
                                <span style={badge(
                                    load.urgency === 'hot' ? '#ef4444' : load.urgency === 'warm' ? '#f59e0b' : '#6b7280',
                                    load.urgency === 'hot' ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)'
                                )}>{load.urgency?.toUpperCase()}</span>
                            )}
                            {load.fill_bucket && (
                                <span style={badge(fillColor, `${fillColor}15`)}>
                                    {load.fill_bucket} fill likelihood
                                </span>
                            )}
                        </div>
                        <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, margin: '0 0 6px', lineHeight: 1.15 }}>
                            {load.origin_city}, {load.origin_state} → {load.dest_city}, {load.dest_state}
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--hc-muted, #aaa)', margin: 0 }}>
                            Posted {new Date(load.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {load.move_date && ` · Move date: ${new Date(load.move_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                            {load.distance_miles && ` · ${Math.round(load.distance_miles)} miles`}
                        </p>
                    </div>

                    {/* Rate */}
                    <div style={{
                        padding: '16px 24px',
                        background: 'var(--hc-panel, #141414)',
                        border: '1px solid var(--hc-border, #222)',
                        borderRadius: 14,
                        textAlign: 'center',
                        minWidth: 140,
                    }}>
                        {isAuthed ? (
                            <>
                                <div style={{ fontSize: 11, color: 'var(--hc-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Rate</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', fontFeatureSettings: '"tnum"' }}>
                                    {load.rate_band}
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 11, color: 'var(--hc-muted, #888)', marginBottom: 6 }}>Rate (blurred)</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--hc-muted, #888)', filter: 'blur(6px)', userSelect: 'none' }}>
                                    $000–$000
                                </div>
                                <a href="/login" style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#d97706', fontWeight: 700, textDecoration: 'none' }}>
                                    Sign in to view →
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Greenlight Banner — shown to authenticated users */}
            {isAuthed ? (
                <div style={{ marginBottom: 24 }}>
                    <GreenlightBanner
                        status="GREENLIGHT"
                        chips={load.escort_front_required ? ['Front escort required'] : []}
                    />
                </div>
            ) : (
                <div style={{ marginBottom: 24 }}>
                    <GreenlightBanner
                        status="WARN"
                        reason="Sign in to check your eligibility for this load against your certifications and coverage area."
                        ctaLabel="Sign In"
                        ctaHref="/login"
                    />
                </div>
            )}

            {/* Escort Requirements */}
            <section style={card}>
                <h2 style={sectionTitle}>Escort Requirements</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                    {[
                        { label: 'Front Escort', value: load.escort_front_required },
                        { label: 'Rear Escort', value: load.escort_rear_required },
                        { label: 'Class', value: load.escort_class_required },
                    ].filter(r => r.value != null).map(r => (
                        <div key={r.label} style={infoRow}>
                            <span style={{ fontSize: 10, color: 'var(--hc-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.label}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{String(r.value)}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Intelligence panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
                <section style={card}>
                    <h2 style={sectionTitle}>Broker Trust & Performance</h2>
                    {isAuthed ? (
                        <BrokerReportCard brokerId={(load as any).broker_id ?? ''} />
                    ) : (
                        <div style={{ padding: '20px', background: 'rgba(217,119,6,0.04)', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
                            <p style={{ fontSize: 12, color: 'var(--hc-muted, #aaa)', margin: 0 }}>
                                Sign in to view broker trust score, payment history, and dispute records.
                            </p>
                        </div>
                    )}
                </section>

                <section style={card}>
                    <h2 style={sectionTitle}>Corridor Risk</h2>
                    <CorridorRiskWidget corridorSlug={`${load.origin_city?.toLowerCase().replace(/ /g, '-')}-${load.origin_state?.toLowerCase()}`} />
                </section>
            </div>

            {/* CTA for unauthenticated */}
            {!isAuthed && (
                <div style={{ marginBottom: 32 }}>
                    <GatedCTA
                        mode="live"
                        headline="Join Haul Command to Apply for This Load"
                    />
                </div>
            )}

            {/* Apply button for authed users */}
            {isAuthed && (
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                    <a
                        href={`/loads/${params.slug}/apply`}
                        style={{
                            display: 'inline-block', padding: '16px 48px',
                            background: 'linear-gradient(135deg, #d97706, #b45309)',
                            color: '#111', fontWeight: 900, fontSize: 15,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            borderRadius: 14, textDecoration: 'none',
                            boxShadow: '0 4px 20px rgba(217,119,6,0.3)',
                        }}
                    >
                        Apply for This Load →
                    </a>
                </div>
            )}

            {/* SEO footer */}
            <p style={{ fontSize: 12, color: 'var(--hc-muted, #777)', lineHeight: 1.6 }}>
                This {load.service_required} load is sourced from{' '}
                <Link href={`/directory/${load.origin_country?.toLowerCase() ?? 'us'}/${load.origin_state?.toLowerCase()}`} style={{ color: '#d97706' }}>
                    {load.origin_city}, {load.origin_state}
                </Link>{' '}
                and dispatched via the Haul Command platform. View all{' '}
                <Link href="/loads" style={{ color: '#d97706' }}>open pilot car loads</Link>.
            </p>
        </main>
    );
}

// ─── Tiny style helpers ───────────────────────────────────────────────────────
const card: React.CSSProperties = {
    background: 'var(--hc-panel, #141414)',
    border: '1px solid var(--hc-border, #222)',
    borderRadius: 14, padding: '20px', marginBottom: 16,
};
const sectionTitle: React.CSSProperties = {
    fontSize: 12, fontWeight: 900, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--hc-muted, #888)',
    margin: '0 0 16px',
};
const infoRow: React.CSSProperties = {
    padding: '10px 12px', background: 'var(--hc-elevated, #1e1e1e)',
    border: '1px solid var(--hc-border, #222)', borderRadius: 10,
    display: 'flex', flexDirection: 'column',
};
function badge(color: string, bg: string): React.CSSProperties {
    return {
        display: 'inline-block', padding: '3px 10px',
        background: bg, border: `1px solid ${color}40`,
        borderRadius: 20, fontSize: 10, fontWeight: 800,
        color, textTransform: 'uppercase', letterSpacing: '0.08em',
    };
}
