export const dynamic = 'force-dynamic';
export const revalidate = 3600;
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
    ShieldCheck, Clock, AlertTriangle, CheckCircle,
    Zap, MapPin, ArrowLeft, TrendingUp, Users
} from 'lucide-react';

// ── Data layer ────────────────────────────────────────────────────────────────

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

async function getTerminalData(portSlug: string, terminalSlug: string) {
    const { data: terminal } = await getSupabase()
        .from('terminal_registry')
        .select(`
      id, terminal_name, terminal_slug, terminal_type,
      twic_required, appointment_required,
      typical_gate_delay_minutes, operating_hours,
      gate_instructions, special_requirements,
      cargo_types, port_id,
      port_infrastructure!inner (
        id, port_name, port_slug, port_city, state_region,
        country_code, port_type, port_authority_website,
        twic_enforcement_level, latitude, longitude
      )
    `)
        .eq('terminal_slug', terminalSlug)
        .eq('port_infrastructure.port_slug', portSlug)
        .single();

    if (!terminal) return null;

    // Risk profile
    const { data: risk } = await getSupabase()
        .from('terminal_risk_profile')
        .select('denial_rate, avg_delay_minutes, risk_score, total_events, last_calculated_at')
        .eq('terminal_id', terminal.id)
        .single();

    // Nearby TWIC operators (via port proximity)
    const { data: operators } = await getSupabase()
        .from('port_operator_proximity')
        .select(`
      distance_miles, is_twic_verified,
      escort_profiles!inner (
        user_id, display_name, region_code, verified,
        has_high_pole, response_time_score, reliability_score
      )
    `)
        .eq('port_id', terminal.port_id)
        .eq('is_twic_verified', true)
        .order('distance_miles', { ascending: true })
        .limit(8);

    // Gate event stats
    const { data: gateStats } = await getSupabase()
        .from('gate_event_log')
        .select('event_type, delay_minutes')
        .eq('terminal_id', terminal.id)
        .order('occurred_at', { ascending: false })
        .limit(50);

    const successCount = gateStats?.filter(e => e.event_type === 'success').length ?? 0;
    const totalEvents = gateStats?.length ?? 0;
    const successRate = totalEvents > 0 ? Math.round((successCount / totalEvents) * 100) : null;
    const avgDelay = gateStats && gateStats.length > 0
        ? Math.round(gateStats.reduce((s, e) => s + (e.delay_minutes ?? 0), 0) / gateStats.length)
        : null;

    return { terminal, risk, operators, successRate, avgDelay, totalEvents };
}

// ── Static params ─────────────────────────────────────────────────────────────

// generateStaticParams removed — force-dynamic handles rendering at request time

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string; state: string; port_slug: string; terminal_slug: string }>;
}): Promise<Metadata> {
    const { port_slug, terminal_slug } = await params;
    const data = await getTerminalData(port_slug, terminal_slug);
    if (!data) return { title: 'Terminal Not Found' };

    const { terminal } = data;
    const port = (terminal as any).port_infrastructure;
    const title = `${terminal.terminal_name} — Pilot Car & Escort Services | Haul Command`;
    const description = `TWIC-verified pilot car escorts for ${terminal.terminal_name} at ${port.port_name}, ${port.port_city}. Gate requirements, delay data, and trusted operators dispatched instantly.`;

    return {
        title,
        description,
        openGraph: { title, description, type: 'website' },
        other: {
            'terminal-name': terminal.terminal_name,
            'port-name': port.port_name,
        },
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function RiskBadge({ score }: { score: number | null }) {
    if (score === null) return null;
    const label = score >= 65 ? 'HIGH RISK' : score >= 35 ? 'MEDIUM' : 'LOW RISK';
    const cls = score >= 65
        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
        : score >= 35
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
            {label}
        </span>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TerminalPage({
    params,
}: {
    params: Promise<{ country: string; state: string; port_slug: string; terminal_slug: string }>;
}) {
    const { country, state, port_slug, terminal_slug } = await params;
    const data = await getTerminalData(port_slug, terminal_slug);
    if (!data) notFound();

    const { terminal, risk, operators, successRate, avgDelay, totalEvents } = data;
    const port = (terminal as any).port_infrastructure;

    const riskScore = risk?.risk_score != null ? Number(risk.risk_score) : null;

    // Structured data — Place + Service + FAQPage (AI Search Domination)
    const canonicalUrl = `https://haulcommand.com/ports/${country}/${state}/${port_slug}/${terminal_slug}`;
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: terminal.terminal_name,
            description: `${terminal.terminal_name} is a ${terminal.terminal_type ?? 'cargo'} terminal at ${port.port_name}, ${port.port_city ?? port.state_region}. TWIC card ${terminal.twic_required ? 'required' : 'not required'}. ${successRate != null ? `Gate success rate: ${successRate}%.` : ''} ${operators?.length ?? 0} TWIC-verified pilot car escorts nearby.`,
            containedInPlace: {
                '@type': 'Port',
                name: port.port_name,
                address: { '@type': 'PostalAddress', addressRegion: port.state_region, addressCountry: port.country_code },
                url: `https://haulcommand.com/ports/${country}/${state}/${port_slug}`,
            },
            url: canonicalUrl,
            ...(port.latitude && port.longitude ? { geo: { '@type': 'GeoCoordinates', latitude: port.latitude, longitude: port.longitude } } : {}),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: `Pilot Car & Escort Services — ${terminal.terminal_name}`,
            description: `Find TWIC-verified pilot car escorts and oversize load escort services for ${terminal.terminal_name} at ${port.port_name}.`,
            provider: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
            areaServed: { '@type': 'Place', name: `${port.port_name}, ${port.state_region}` },
            url: canonicalUrl,
            ...(successRate != null ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: (successRate / 20).toFixed(1), reviewCount: totalEvents, bestRating: 5, worstRating: 1 } } : {}),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
                {
                    '@type': 'Question',
                    name: `Is TWIC required at ${terminal.terminal_name}?`,
                    acceptedAnswer: { '@type': 'Answer', text: terminal.twic_required ? `Yes, a TWIC (Transportation Worker Identification Credential) card is required for access to ${terminal.terminal_name}. All pilot car and escort operators must hold a valid TWIC card.` : `No, ${terminal.terminal_name} does not require a TWIC card for access. Standard escort operator credentials apply.` },
                },
                {
                    '@type': 'Question',
                    name: `How long are gate delays at ${terminal.terminal_name}?`,
                    acceptedAnswer: { '@type': 'Answer', text: (risk?.avg_delay_minutes != null || terminal.typical_gate_delay_minutes != null) ? `Average gate delay at ${terminal.terminal_name} is approximately ${Math.round(Number(risk?.avg_delay_minutes ?? terminal.typical_gate_delay_minutes ?? 30))} minutes based on recorded gate events.` : `Gate delay data for ${terminal.terminal_name} is being collected. Contact Haul Command for the latest information.` },
                },
                {
                    '@type': 'Question',
                    name: `Does ${terminal.terminal_name} require an appointment?`,
                    acceptedAnswer: { '@type': 'Answer', text: terminal.appointment_required ? `Yes, ${terminal.terminal_name} requires an appointment for access. Confirm scheduling with the terminal operator before dispatch.` : `${terminal.terminal_name} allows walk-in access, though conditions may vary by cargo type and time of day.` },
                },
                {
                    '@type': 'Question',
                    name: `How many TWIC-verified pilot car escorts are available near ${terminal.terminal_name}?`,
                    acceptedAnswer: { '@type': 'Answer', text: `Haul Command has ${operators?.length ?? 0} TWIC-verified pilot car and escort operators on record near ${terminal.terminal_name} at ${port.port_name}.` },
                },
            ],
        },
    ];

    return (
        <>
            {structuredData.map((sd, i) => (
                <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sd) }} />
            ))}

            <main className="min-h-screen bg-[#0A0C10] text-white">
                {/* ── Breadcrumb ── */}
                <div className="border-b border-white/5">
                    <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-white/40">
                        <Link href="/directory" className="hover:text-white/70 transition-colors">Directory</Link>
                        <span>/</span>
                        <Link href={`/ports/${country}/${state}/${port_slug}`} className="hover:text-white/70 transition-colors">
                            {port.port_name}
                        </Link>
                        <span>/</span>
                        <span className="text-white/70">{terminal.terminal_name}</span>
                    </div>
                </div>

                {/* ── AI Answer Block — direct citable summary for AI crawlers ── */}
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div style={{ background: 'rgba(241,169,27,0.04)', border: '1px solid rgba(241,169,27,0.12)', borderRadius: 10, padding: '14px 18px' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#d1d5db', lineHeight: 1.65 }}>
                            <strong style={{ color: '#F1A91B' }}>{terminal.terminal_name}</strong> is a {terminal.terminal_type ?? 'cargo'} terminal located at {port.port_name}, {port.port_city ?? port.state_region}.{' '}
                            TWIC card: <strong style={{ color: terminal.twic_required ? '#f59e0b' : '#34d399' }}>{terminal.twic_required ? 'Required' : 'Not required'}</strong>.{' '}
                            Appointment: <strong>{terminal.appointment_required ? 'Required' : 'Walk-in OK'}</strong>.{' '}
                            {successRate != null && <>Gate success rate: <strong style={{ color: '#34d399' }}>{successRate}%</strong> ({totalEvents} events).{' '}</>}
                            {(operators?.length ?? 0) > 0 && <><strong style={{ color: '#a5b4fc' }}>{operators!.length} TWIC-verified</strong> pilot car escorts available nearby.</>}
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

                    {/* ── Header ── */}
                    <div className="space-y-3">
                        <Link
                            href={`/ports/${country}/${state}/${port_slug}`}
                            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to {port.port_name}
                        </Link>

                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{terminal.terminal_name}</h1>
                                <p className="text-white/50 mt-1">
                                    {port.port_name} · {port.port_city}, {port.state_region}
                                    {terminal.terminal_type && (
                                        <span className="ml-2 text-xs bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                                            {terminal.terminal_type}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <RiskBadge score={riskScore} />
                        </div>
                    </div>

                    {/* ── Gate Conditions Grid ── */}
                    <section>
                        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">
                            Gate Conditions
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* TWIC */}
                            <div className={`rounded-xl border p-4 ${terminal.twic_required
                                ? 'bg-amber-500/10 border-amber-500/20'
                                : 'bg-white/3 border-white/8'}`}>
                                <ShieldCheck className={`w-5 h-5 mb-2 ${terminal.twic_required ? 'text-amber-400' : 'text-white/30'}`} />
                                <p className="text-xs text-white/40 mb-0.5">TWIC</p>
                                <p className={`text-sm font-semibold ${terminal.twic_required ? 'text-amber-300' : 'text-white/60'}`}>
                                    {terminal.twic_required ? 'Required' : 'Not Required'}
                                </p>
                            </div>

                            {/* Appointment */}
                            <div className={`rounded-xl border p-4 ${terminal.appointment_required
                                ? 'bg-blue-500/10 border-blue-500/20'
                                : 'bg-white/3 border-white/8'}`}>
                                <CheckCircle className={`w-5 h-5 mb-2 ${terminal.appointment_required ? 'text-blue-400' : 'text-white/30'}`} />
                                <p className="text-xs text-white/40 mb-0.5">Appointment</p>
                                <p className={`text-sm font-semibold ${terminal.appointment_required ? 'text-blue-300' : 'text-white/60'}`}>
                                    {terminal.appointment_required ? 'Required' : 'Walk-in'}
                                </p>
                            </div>

                            {/* Gate delay */}
                            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                                <Clock className="w-5 h-5 mb-2 text-white/30" />
                                <p className="text-xs text-white/40 mb-0.5">Avg Delay</p>
                                <p className="text-sm font-semibold text-white/80">
                                    {riskScore != null && risk?.avg_delay_minutes != null
                                        ? `~${Math.round(Number(risk.avg_delay_minutes))} min`
                                        : terminal.typical_gate_delay_minutes != null
                                            ? `~${terminal.typical_gate_delay_minutes} min`
                                            : '—'}
                                </p>
                            </div>

                            {/* Gate success */}
                            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                                <TrendingUp className="w-5 h-5 mb-2 text-white/30" />
                                <p className="text-xs text-white/40 mb-0.5">Gate Success</p>
                                <p className="text-sm font-semibold text-white/80">
                                    {successRate != null ? `${successRate}%` : '—'}
                                    {totalEvents > 0 && (
                                        <span className="text-xs text-white/30 ml-1">({totalEvents} events)</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Broker advisories */}
                        {riskScore !== null && riskScore >= 35 && (
                            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                    <span className="text-sm font-medium text-amber-300">Broker Advisories</span>
                                </div>
                                <ul className="space-y-1 pl-6">
                                    {terminal.twic_required && (
                                        <li className="text-xs text-white/60">TWIC card required for terminal access</li>
                                    )}
                                    {terminal.appointment_required && (
                                        <li className="text-xs text-white/60">Appointment required — confirm before dispatch</li>
                                    )}
                                    {risk?.avg_delay_minutes != null && Number(risk.avg_delay_minutes) > 45 && (
                                        <li className="text-xs text-white/60">
                                            Typical gate delay: {Math.round(Number(risk.avg_delay_minutes))} min
                                        </li>
                                    )}
                                    {risk?.denial_rate != null && Number(risk.denial_rate) > 0.10 && (
                                        <li className="text-xs text-white/60">Elevated denial rate — verify credentials ahead</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* ── Cargo types ── */}
                    {terminal.cargo_types && (terminal.cargo_types as string[]).length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3">
                                Cargo Types Handled
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {(terminal.cargo_types as string[]).map((c: string) => (
                                    <span key={c} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/70">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── TWIC Operators ── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">TWIC-Verified Escorts</h2>
                                <p className="text-sm text-white/40 mt-0.5">
                                    {operators && operators.length > 0
                                        ? `${operators.length} verified operators near this terminal`
                                        : 'No verified operators on record'}
                                </p>
                            </div>
                            {operators && operators.length > 0 && (
                                <div className="flex items-center gap-1.5 text-white/40">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm">{operators.length}</span>
                                </div>
                            )}
                        </div>

                        {operators && operators.length > 0 ? (
                            <div className="grid gap-3">
                                {operators.map((op: any) => {
                                    const profile = op.escort_profiles;
                                    const reliability = Number(profile?.reliability_score ?? 70);
                                    const statusColor = reliability >= 85 ? '#22c55e' : reliability >= 70 ? '#eab308' : '#ef4444';
                                    return (
                                        <Link
                                            key={profile?.user_id}
                                            href={`/directory/profile/${profile?.user_id}`}
                                            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-4 hover:bg-white/5 hover:border-white/15 transition-all group"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm group-hover:text-[#F1A91B] transition-colors truncate">
                                                        {profile?.display_name ?? 'Verified Escort'}
                                                    </span>
                                                    {profile?.verified && (
                                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" aria-label="Verified" />
                                                    )}
                                                    {profile?.has_high_pole && (
                                                        <Zap className="w-3.5 h-3.5 text-[#F1A91B] flex-shrink-0" aria-label="Height pole" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <MapPin className="w-3 h-3 text-white/30 flex-shrink-0" />
                                                    <span className="text-xs text-white/40">
                                                        {profile?.region_code} · {Math.round(op.distance_miles)} mi away
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                                                <span className="text-xs text-white/40">{Math.round(reliability)}% reliability</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-white/8 bg-white/3 p-8 text-center">
                                <ShieldCheck className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                <p className="text-sm text-white/40">No TWIC-verified operators on record for this terminal.</p>
                                <p className="text-xs text-white/25 mt-1">Coverage is growing. Check back soon.</p>
                            </div>
                        )}
                    </section>

                    {/* ── Gate instructions ── */}
                    {terminal.gate_instructions && (
                        <section>
                            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3">
                                Gate Instructions
                            </h2>
                            <div className="rounded-xl border border-white/8 bg-white/3 p-5">
                                <p className="text-sm text-white/70 leading-relaxed">{terminal.gate_instructions}</p>
                            </div>
                        </section>
                    )}

                    {/* ── Operating hours ── */}
                    {terminal.operating_hours && (
                        <section>
                            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3">
                                Operating Hours
                            </h2>
                            <div className="rounded-xl border border-white/8 bg-white/3 p-5">
                                <p className="text-sm text-white/70">{terminal.operating_hours}</p>
                            </div>
                        </section>
                    )}

                    {/* ── Back to port CTA ── */}
                    <div className="pt-4 border-t border-white/5">
                        <Link
                            href={`/ports/${country}/${state}/${port_slug}`}
                            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            View all terminals at {port.port_name}
                        </Link>
                    </div>

                </div>
            </main>
        </>
    );
}


