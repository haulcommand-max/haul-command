import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Shield, ChevronRight, Phone, FileText, AlertTriangle, CheckCircle, Clock, ExternalLink, Users } from 'lucide-react';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

interface Props {
    params: Promise<{ country: string; region: string }>;
}

function humanizeCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const categoryIcons: Record<string, string> = {
    permit_requirement_logic: '📋',
    escort_requirement_thresholds: '🚗',
    police_escort_triggers: '🚔',
    superload_classification: '🏗️',
    bridge_engineering_review_rules: '🌉',
    restricted_travel_windows: '🕐',
    holiday_movement_bans: '🚫',
    convoy_rules: '🚚',
    signage_lighting_flagging: '🚩',
    enforcement_notes: '⚖️',
    fees_and_processing: '💰',
    route_approval_and_surveys: '🗺️',
    insurance_and_bonding: '🛡️',
    other: '📄',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country, region } = await params;
    const supabase = createClient();

    const { data: jurisdiction } = await supabase
        .from('authority_jurisdictions')
        .select('name')
        .eq('country_code', country.toUpperCase())
        .eq('slug', region)
        .single();

    const name = jurisdiction?.name ?? region.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const title = `${name} Authority Hub — Oversize/Overweight Rules & Contacts | Haul Command`;
    const description = `Complete compliance directory for ${name}, ${country.toUpperCase()}. Permit requirements, escort rules, police escort triggers, contacts, and more.`;

    return {
        title,
        description,
        alternates: { canonical: `${SITE}/authority/${country}/${region}` },
        openGraph: { title, description, url: `${SITE}/authority/${country}/${region}` },
    };
}

export default async function AuthorityRegionPage({ params }: Props) {
    const { country, region } = await params;
    const supabase = createClient();

    const { data: jurisdiction } = await supabase
        .from('authority_jurisdictions')
        .select('id, name, level, country_code, admin1_code')
        .eq('country_code', country.toUpperCase())
        .eq('slug', region)
        .single();

    if (!jurisdiction) notFound();

    // All active categories for this jurisdiction
    const { data: rulesets } = await supabase
        .from('authority_rulesets')
        .select('category, confidence_score, verification, last_verified_at')
        .eq('jurisdiction_id', jurisdiction.id)
        .eq('is_active', true);

    const uniqueCategories = [...new Set((rulesets ?? []).map(r => r.category))];

    // Contact count
    const { count: contactCount } = await supabase
        .from('authority_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('jurisdiction_id', jurisdiction.id)
        .eq('is_active', true)
        .eq('is_public', true);

    // Child jurisdictions (counties/districts)
    const { data: children } = await supabase
        .from('authority_jurisdictions')
        .select('slug, name, level')
        .eq('parent_id', jurisdiction.id)
        .order('name');

    const regionDisplay = jurisdiction.name;
    const countryUpper = country.toUpperCase();

    const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Authority Directory', href: '/authority' },
        { name: countryUpper, href: `/authority/${country}` },
        { name: regionDisplay, href: `/authority/${country}/${region}` },
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((b, i) => ({
                    '@type': 'ListItem', position: i + 1, name: b.name, item: `${SITE}${b.href}`,
                })),
            },
            {
                '@type': 'WebPage',
                name: `${regionDisplay} Authority Hub`,
                url: `${SITE}/authority/${country}/${region}`,
                description: `Complete oversize/overweight compliance directory for ${regionDisplay}, ${countryUpper}.`,
            },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <main className="min-h-screen bg-slate-900 text-slate-50">
                {/* Hero */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        <nav aria-label="Breadcrumb" className="mb-6">
                            <ol className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                                {breadcrumbs.map((b, i) => (
                                    <li key={b.href} className="flex items-center gap-2">
                                        {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                                        {i === breadcrumbs.length - 1
                                            ? <span className="text-slate-300">{b.name}</span>
                                            : <Link aria-label="Navigation Link" href={b.href} className="hover:text-amber-400 transition-colors">{b.name}</Link>
                                        }
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                                <Shield className="w-3.5 h-3.5" /> Authority Hub
                            </div>
                            {contactCount !== null && contactCount > 0 && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                    <Phone className="w-3.5 h-3.5" /> {contactCount} Contacts
                                </div>
                            )}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                                <FileText className="w-3.5 h-3.5" /> {uniqueCategories.length} Rule Categories
                            </div>
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                            {regionDisplay} — Compliance Hub
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl">
                            Every oversize/overweight rule, permit contact, and compliance requirement for {regionDisplay}, {countryUpper} — verified and sourced.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
                    {/* Rule Categories Grid */}
                    {uniqueCategories.length > 0 ? (
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">Regulations & Rules</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {uniqueCategories.map(cat => {
                                    const rs = (rulesets ?? []).filter(r => r.category === cat);
                                    const bestConf = Math.max(...rs.map(r => r.confidence_score ?? 0));
                                    const anyVerified = rs.some(r => r.verification === 'verified');
                                    return (
                                        <Link aria-label="Navigation Link"
                                            key={cat}
                                            href={`/authority/${country}/${region}/${cat.replace(/_/g, '-')}`}
                                            className="group bg-slate-800/60 border border-slate-700 hover:border-amber-500/40 rounded-xl p-6 transition-all hover:bg-slate-800"
                                        >
                                            <div className="text-2xl mb-3">{categoryIcons[cat] ?? '📄'}</div>
                                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                                                {humanizeCategory(cat)}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                                                {anyVerified ? (
                                                    <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Verified</>
                                                ) : (
                                                    <><Clock className="w-3.5 h-3.5" /> Pending verification</>
                                                )}
                                                <span>•</span>
                                                <span>{Math.round(bestConf * 100)}% confidence</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    ) : (
                        <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8 text-center">
                            <div className="text-4xl mb-4">🚧</div>
                            <h2 className="text-xl font-bold text-amber-400 mb-2">Rules Data Coming Soon</h2>
                            <p className="text-slate-400">
                                We&apos;re building the compliance database for {regionDisplay}. Check back soon.
                            </p>
                        </section>
                    )}

                    {/* Child Jurisdictions */}
                    {children && children.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Users className="w-6 h-6 text-slate-400" />
                                Sub-Jurisdictions
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {children.map(ch => (
                                    <Link aria-label="Navigation Link"
                                        key={ch.slug}
                                        href={`/authority/${country}/${ch.slug}`}
                                        className="flex items-center gap-2 bg-slate-800/40 border border-slate-700 hover:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-300 hover:text-amber-400 transition-all"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                        {ch.name}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* CTAs */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <div className="text-2xl mb-3">📋</div>
                            <h2 className="text-lg font-bold text-white mb-2">Need to Move a Load in {regionDisplay}?</h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Post your move and get matched with certified {regionDisplay} escorts in minutes.
                            </p>
                            <Link aria-label="Navigation Link" href="/start?role=broker" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                                Post a Move →
                            </Link>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <div className="text-2xl mb-3">🚘</div>
                            <h2 className="text-lg font-bold text-white mb-2">Operate in {regionDisplay}?</h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Claim your free profile and get discovered by shippers and brokers.
                            </p>
                            <Link aria-label="Navigation Link" href="/start?role=escort" className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                                Claim Your Profile →
                            </Link>
                        </div>
                    </section>

                    {/* Report */}
                    <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Know Something We Don&apos;t?</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    If you operate in {regionDisplay} and know of rules, contacts, or changes we should track, tell us.
                                </p>
                                <Link aria-label="Navigation Link"
                                    href={`/authority/${country}/${region}/report?jid=${jurisdiction.id}`}
                                    className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Submit a Tip →
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
