import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getCorridorData, getAllCorridorSlugs, estimateEscortCost } from '@/lib/data/corridors';

interface Props {
    params: Promise<{ corridor: string }>;
}

// Pre-render known corridors at build time (ISR)
export async function generateStaticParams() {
    try {    
        return getAllCorridorSlugs().map(slug => ({ corridor: slug }));
    
    } catch {
        return []; // ISR handles at runtime
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { corridor } = await params;
    const supabase = createClient();

    const { data: page } = await supabase
        .from('seo_pages')
        .select('title, meta_description, canonical_url')
        .eq('slug', `corridors/${corridor}`)
        .eq('status', 'published')
        .single();

    // Fall back to static data
    const staticData = getCorridorData(corridor);
    if (!page && !staticData) return { title: 'Corridor Not Found | Haul Command' };

    const title = page?.title ?? staticData?.metaTitle ?? `${corridor.toUpperCase()} Corridor | Haul Command`;
    const description = page?.meta_description ?? staticData?.metaDescription ?? '';

    return {
        title: `${title} | Haul Command`,
        description,
        alternates: { canonical: page?.canonical_url ?? `/corridors/${corridor}` },
        openGraph: { title, description },
    };
}

export default async function CorridorPage({ params }: Props) {
    const { corridor } = await params;
    const supabase = createClient();
    const slug = `corridors/${corridor}`;

    const { data: page } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    // Use static data as fallback — allows corridors to work before seo_pages is seeded
    const staticData = getCorridorData(corridor);
    if (!page && !staticData) notFound();

    // Get related region pages that share this corridor
    const { data: links } = await supabase
        .from('seo_internal_links')
        .select('to_slug, weight')
        .eq('from_slug', slug)
        .order('weight', { ascending: false })
        .limit(12);

    const relatedSlugs = (links ?? []).map(l => l.to_slug);
    const { data: relatedPages } = relatedSlugs.length > 0
        ? await supabase
            .from('seo_pages')
            .select('slug, title, type, region, country')
            .in('slug', relatedSlugs)
            .eq('status', 'published')
        : { data: [] };

    const statePages = (relatedPages ?? []).filter(p => p.type === 'region');

    const corridorDisplay = staticData?.displayName ?? corridor.split('-').map(w => w.toUpperCase()).join(' ');
    const h1Text = page?.h1 ?? staticData?.h1 ?? `${corridorDisplay} Heavy Haul Escort Guide`;

    const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Corridors', href: '/corridors' },
        { name: corridorDisplay, href: `/${slug}` },
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((b, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: b.name,
                    item: `https://haulcommand.com${b.href}`,
                })),
            },
            {
                '@type': 'WebPage',
                name: page?.title ?? h1Text,
                description: page?.meta_description ?? staticData?.metaDescription ?? '',
                url: `https://haulcommand.com/${slug}`,
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main className="min-h-screen bg-hc-bg text-hc-text">
                {/* Hero */}
                <div className="section-zone border-b py-16" style={{ borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="hc-container">
                        <nav aria-label="Breadcrumb" className="mb-6">
                            <ol className="flex items-center gap-2 text-sm text-hc-muted flex-wrap">
                                {breadcrumbs.map((b, i) => (
                                    <li key={b.href} className="flex items-center gap-2">
                                        {i > 0 && <span className="text-hc-subtle">/</span>}
                                        {i === breadcrumbs.length - 1
                                            ? <span className="text-hc-text">{b.name}</span>
                                            : <Link href={b.href} className="hover:text-hc-gold-400 transition-colors">{b.name}</Link>}
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hc-gold-500/10 border border-hc-gold-500/20 text-hc-gold-400 text-xs font-semibold mb-4">
                            Corridor Intelligence
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                            {h1Text}
                        </h1>
                        {staticData && (
                            <div className="flex flex-wrap gap-3 mt-4 mb-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 text-hc-muted text-xs font-semibold">
                                    📍 {staticData.endpoints}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 text-hc-muted text-xs font-semibold">
                                    🛣 {staticData.totalMiles.toLocaleString()} mi total
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${staticData.supplyPct < 35
                                        ? 'bg-red-500/10 border border-red-500/25 text-red-400'
                                        : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                                    }`}>
                                    {staticData.supplyPct < 35 ? '🔴 Supply Shortage' : '🟡 Tightening'} · {staticData.operatorCount} escorts
                                </span>
                            </div>
                        )}
                        <p className="text-xl text-hc-muted max-w-3xl">
                            {page?.meta_description ?? staticData?.metaDescription}
                        </p>
                    </div>
                </div>

                <div className="hc-container py-12 space-y-12">
                    {/* Broker + Operator intelligence notes */}
                    {staticData && (
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                                <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">📊 Broker Intel</div>
                                <p className="text-hc-muted text-sm leading-relaxed">{staticData.brokerIntelNote}</p>
                            </div>
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
                                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">🚘 Operator Intel</div>
                                <p className="text-hc-muted text-sm leading-relaxed">{staticData.escortIntelNote}</p>
                            </div>
                        </section>
                    )}

                    {/* Key regulations alert */}
                    {staticData?.keyRegulations && (
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Key Regulations on {corridorDisplay}</h2>
                            <div className="space-y-3">
                                {staticData.keyRegulations.map((reg, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-hc-surface border border-hc-border rounded-xl">
                                        <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                                        <span className="text-hc-muted text-sm leading-relaxed">{reg}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* State-by-state requirements table */}
                    {staticData?.stateRequirements && staticData.stateRequirements.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-2">State-by-State Escort Requirements</h2>
                            <p className="text-hc-muted mb-6">Requirements trigger based on your load dimensions. Confirm with each state DOT before move.</p>
                            <div className="space-y-3">
                                {staticData.stateRequirements.map((sr) => (
                                    <div key={sr.stateCode} className="bg-hc-surface border border-hc-border rounded-xl p-5">
                                        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-black text-white">{sr.state}</span>
                                                <span className="text-xs font-bold text-hc-muted bg-white/5 border border-white/8 px-2 py-0.5 rounded">{sr.stateCode}</span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${sr.nightMovement === 'prohibited' ? 'bg-red-500/10 text-red-400' :
                                                        sr.nightMovement === 'restricted' ? 'bg-amber-500/10 text-amber-400' :
                                                            'bg-green-500/10 text-green-400'
                                                    }`}>
                                                    {sr.nightMovement === 'prohibited' ? '✗ Night Banned' : sr.nightMovement === 'restricted' ? '⚠ Night Restricted' : '✓ Night OK'}
                                                </span>
                                                <span className="text-xs text-hc-muted">Police trigger: &gt;{sr.policeTriggerWidthFt}ft wide</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                            <div><span className="text-hc-muted">Escorts needed:</span> <span className="text-white font-semibold">{sr.escortsRequired}</span></div>
                                            <div><span className="text-hc-muted">Trigger width:</span> <span className="text-white font-semibold">&ge;{sr.widthTriggerFt}ft</span></div>
                                        </div>
                                        <p className="text-hc-muted text-xs mt-2 leading-relaxed">{sr.permitNotes}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* DB content block (if available) */}
                    {page?.content_md && (
                        <section className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-hc-muted prose-strong:text-white prose-li:text-hc-muted prose-a:text-hc-gold-400 prose-a:no-underline hover:prose-a:text-hc-gold-300">
                            <div dangerouslySetInnerHTML={{ __html: page.content_md }} />
                        </section>
                    )}

                    {/* States along this corridor */}
                    {statePages && statePages.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-2">Regulations by State Along {corridorDisplay}</h2>
                            <p className="text-hc-muted mb-6">
                                Each state has different escort requirements, permit thresholds, and operating hour rules.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {statePages.map(p => {
                                    const stateDisplay = (p.region ?? '')
                                        .split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                    return (
                                        <Link key={p.slug} href={`/${p.slug}`}
                                            className="bg-hc-surface border border-hc-border hover:border-hc-gold-500/40 hover:bg-hc-elevated rounded-xl p-4 transition-all group">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl">{p.country === 'CA' ? '🍁' : '🇺🇸'}</span>
                                                <span className="font-bold text-white">{stateDisplay}</span>
                                            </div>
                                            <p className="text-hc-muted text-sm">Escort requirements & permit rules</p>
                                            <span className="mt-3 inline-flex text-hc-gold-400 text-sm group-hover:translate-x-1 transition-transform">
                                                View Requirements →
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* CTAs */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-hc-surface border border-hc-border rounded-xl p-6">
                            <div className="text-2xl mb-3">📋</div>
                            <h2 className="text-lg font-bold text-white mb-2">Plan a Move Along {corridorDisplay}?</h2>
                            <p className="text-hc-muted text-sm mb-4">
                                Get matched with certified escort operators who know this corridor.
                            </p>
                            <Link href="/start?role=broker"
                                className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-hc-bg font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                                Post a Move →
                            </Link>
                        </div>
                        <div className="bg-hc-surface border border-hc-border rounded-xl p-6">
                            <div className="text-2xl mb-3">🚘</div>
                            <h2 className="text-lg font-bold text-white mb-2">Run Escorts on {corridorDisplay}?</h2>
                            <p className="text-hc-muted text-sm mb-4">
                                Get discovered by brokers moving loads along this corridor every week.
                            </p>
                            <Link href="/start?role=escort"
                                className="inline-flex items-center gap-2 bg-hc-elevated hover:bg-hc-high text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors border border-hc-border">
                                Create Free Profile →
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
