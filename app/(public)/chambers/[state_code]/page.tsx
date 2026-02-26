import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ChevronRight, AlertTriangle, Weight, Clock, MapPin, Building2, Hotel, ShieldCheck } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ state_code: string }> }): Promise<Metadata> {
    const { state_code } = await params;
    const s = state_code.toUpperCase();
    return {
        title: `Pilot Car & Heavy Haul Directory — ${s} | Haul Command`,
        description: `Verified escort operators, oversize load regulations, and corridor intelligence for ${s}. Find pilot cars, travel windows, and certification requirements.`,
    };
}

export default async function StateDirectoryPage({ params }: { params: Promise<{ state_code: string }> }) {
    const { state_code } = await params;
    const supabase = createClient();
    const region = state_code.toUpperCase();

    // Parallel fetching
    const [chambersRes, rulesRes, hotelsRes] = await Promise.all([
        supabase.from('chambers')
            .select('id, canonical_name, slug, city, website, phone')
            .eq('region', region)
            .order('confidence', { ascending: false })
            .limit(100),
        supabase.from('state_regulations')
            .select('state_code, height_threshold_feet, max_weight_lbs, has_curfews, content_markdown')
            .eq('state_code', region)
            .single(),
        supabase.from('hotels')
            .select('id, name, city, has_truck_parking, pilot_friendly_score')
            .eq('state_code', region)
            .order('pilot_friendly_score', { ascending: false })
            .limit(10)
    ]);

    const chambers = chambersRes.data || [];
    const rules = rulesRes.data;
    const hotels = hotelsRes.data || [];

    if (!rules && chambers.length === 0) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-hc-bg text-hc-text">
            {/* ── Breadcrumb — desktop only ── */}
            <div className="hidden md:flex border-b border-hc-border-bare px-4 sm:px-6 py-3">
                <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-hc-subtle font-semibold uppercase tracking-widest">
                    <Link href="/directory" className="hover:text-hc-gold-500 transition-colors">Directory</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-hc-text">{region}</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

                {/* ── Header ───────────────────────────────── */}
                <div className="border-b border-hc-border pb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-hc-gold-500/8 border border-hc-gold-500/20 rounded-full mb-5">
                        <MapPin className="w-3 h-3 text-hc-gold-500" />
                        <span className="text-[10px] font-black text-hc-gold-500 uppercase tracking-widest">State Hub</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-hc-text mb-4 uppercase">
                        Heavy Haul <span className="brand-gradient-text">{region}</span>
                    </h1>
                    <p className="text-lg text-hc-muted leading-relaxed max-w-2xl">
                        Verified pilot car operators, oversize load regulations, and corridor intelligence for {region}.
                    </p>
                    {/* Link to directory results */}
                    <div className="mt-5">
                        <Link
                            href={`/directory/us/${region.toLowerCase()}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Find Verified Escorts in {region}
                        </Link>
                    </div>
                </div>

                {/* ── Regulations Quick-Glance ─────────────── */}
                {rules && (
                    <section className="hc-card p-6">
                        <h2 className="text-xl font-black text-hc-text mb-6 flex items-center gap-2 uppercase tracking-tight">
                            <AlertTriangle className="w-5 h-5 text-hc-gold-500" />
                            {region} Regulations
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-hc-elevated rounded-xl border border-hc-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Weight className="w-4 h-4 text-hc-muted" />
                                    <p className="text-xs text-hc-muted font-semibold uppercase tracking-widest">Height Threshold</p>
                                </div>
                                <p className="text-2xl font-black tabular-nums text-hc-text">
                                    {rules.height_threshold_feet ? `${rules.height_threshold_feet}'` : 'N/A'}
                                </p>
                            </div>
                            <div className="p-4 bg-hc-elevated rounded-xl border border-hc-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Weight className="w-4 h-4 text-hc-muted" />
                                    <p className="text-xs text-hc-muted font-semibold uppercase tracking-widest">Max Weight</p>
                                </div>
                                <p className="text-2xl font-black tabular-nums text-hc-text">
                                    {rules.max_weight_lbs ? `${(rules.max_weight_lbs / 1000).toFixed(0)}k lbs` : 'N/A'}
                                </p>
                            </div>
                            <div className="p-4 bg-hc-elevated rounded-xl border border-hc-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-hc-muted" />
                                    <p className="text-xs text-hc-muted font-semibold uppercase tracking-widest">Curfews</p>
                                </div>
                                <p className={`text-2xl font-black ${rules.has_curfews ? 'text-hc-warning' : 'text-hc-success'}`}>
                                    {rules.has_curfews ? 'Active' : 'Standard'}
                                </p>
                            </div>
                        </div>
                        {rules.content_markdown && (
                            <div className="mt-5 pt-5 border-t border-hc-border-bare">
                                <p className="text-sm text-hc-muted leading-relaxed line-clamp-4">
                                    {rules.content_markdown.replace(/[#*`]/g, '').trim()}
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* ── Local Chambers ───────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 className="w-5 h-5 text-hc-gold-500" />
                        <h2 className="text-xl font-black text-hc-text uppercase tracking-tight">
                            Local Chambers &amp; Business Hubs
                        </h2>
                    </div>
                    {chambers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {chambers.map(c => (
                                <Link href={`/directory/${region.toLowerCase()}/${c.slug}`} key={c.id}>
                                    <div className="group hc-card p-5 hover:border-hc-border-high transition-all duration-200 h-full">
                                        <h3 className="font-bold text-hc-text group-hover:text-hc-gold-500 transition-colors line-clamp-2 mb-2">
                                            {c.canonical_name}
                                        </h3>
                                        <p className="text-sm text-hc-muted flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {c.city}, {region}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        /* Claim Territory CTA — zero dead end */
                        <div className="hc-card p-10 text-center flex flex-col items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-hc-gold-500/10 border border-hc-gold-500/20 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-hc-gold-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-hc-text uppercase tracking-tight mb-2">
                                    No Verified Escorts in {region} Yet
                                </h3>
                                <p className="text-hc-muted text-sm leading-relaxed max-w-sm">
                                    Be the first verified pilot car operator to claim this territory.
                                    Early operators dominate the corridor leaderboard.
                                </p>
                            </div>
                            <Link
                                href="/onboarding"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-dispatch"
                            >
                                Claim {region} Territory
                            </Link>
                            <Link href="/directory" className="text-xs text-hc-subtle hover:text-hc-muted transition-colors">
                                ← Back to all states
                            </Link>
                        </div>
                    )}
                </section>

                {/* ── Pilot-Friendly Hotels ────────────────── */}
                {hotels.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Hotel className="w-5 h-5 text-hc-gold-500" />
                            <h2 className="text-xl font-black text-hc-text uppercase tracking-tight">
                                Verified Pilot-Friendly Lodging
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {hotels.map(h => (
                                <div key={h.id} className="hc-card p-5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-hc-text">{h.name}</h4>
                                        <p className="text-sm text-hc-muted mt-0.5 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {h.city}, {region}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-hc-success/10 text-hc-success border border-hc-success/20">
                                            {h.pilot_friendly_score}/10
                                        </span>
                                        {h.has_truck_parking && (
                                            <p className="text-xs text-hc-gold-500 mt-1 font-semibold">Truck Parking</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </main>
    );
}
