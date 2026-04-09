import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { Metadata } from 'next';
import { 
    BookOpen, Scale, Wrench, Search, ChevronRight, Share2, 
    BookmarkPlus, Globe, Volume2, Info, ArrowRight, BookType
} from 'lucide-react';
import SaveButton from '@/components/capture/SaveButton';
import AudioPronunciation from '@/components/glossary/AudioPronunciation';
import CommonlyConfusedWith from '@/components/glossary/CommonlyConfusedWith';
import { NativeAdCard } from '@/components/ads/NativeAdCard';
import { ShareButton } from '@/components/social/ShareButton';
import { SchemaOrchestrator } from '@/components/seo/SchemaOrchestrator';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { SmartPaywallBannerAnon } from '@/components/monetization/SmartPaywallBannerAnon';

export const revalidate = 86400; // Cache for 24h

// Dynamic metadata generation for entity SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const slug = (await params).slug;
    const supabase = await createClient();
    
    // Attempt canonical fetch
    const { data } = await supabase
        .from('glossary_public')
        .select('term, short_definition, slug')
        .eq('slug', slug)
        .single();
        
    if (!data) {
        return { title: 'Term Not Found | Haul Command' };
    }

    return {
        title: `${data.term} Definition (Heavy Haul & Pilot Car) | Haul Command Glossary`,
        description: data.short_definition,
        alternates: {
            canonical: `https://www.haulcommand.com/glossary/${data.slug}`,
        }
    };
}

export default async function GlossaryTermPage({ params }: { params: { slug: string } }) {
    const slug = (await params).slug;
    const supabase = await createClient();

    // 1. Fetch exactly by slug OR if it exists as a synonym
    const { data: terms, error } = await supabase
        .from('glossary_public')
        .select('*')
        .or(`slug.eq."${slug}",synonyms.cs.{"${slug}"}`)
        .limit(1);

    if (error || !terms || terms.length === 0) {
        notFound();
    }

    const term = terms[0];

    // 2. Canonical Routing Logic: If user reached via synonym alias, 301 Redirect to canonical
    if (term.slug !== slug) {
        redirect(`/glossary/${term.slug}`);
    }

    return (
        <Fragment>
            <SchemaOrchestrator
                type="GlossaryPage"
                data={{
                    term: term.term,
                    definition: term.short_definition,
                    url: `https://www.haulcommand.com/glossary/${term.slug}`,
                    relatedTerms: term.related_slugs ?? [],
                }}
            />

            {/* INJECT JSON-LD SCHEMA */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "DefinedTerm",
                    "termCode": term.slug,
                    "name": term.term,
                    "alternateName": term.synonyms && term.synonyms.length > 0 ? term.synonyms : undefined,
                    "description": term.long_definition ? `${term.short_definition} ${term.long_definition.slice(0, 150)}...` : term.short_definition,
                    "inDefinedTermSet": {
                        "@type": "DefinedTermSet",
                        "name": "Haul Command Heavy Haul Glossary",
                        "url": "https://www.haulcommand.com/glossary"
                    }
                })
            }} />

            {/* BreadcrumbList */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.haulcommand.com" },
                        { "@type": "ListItem", "position": 2, "name": "Glossary", "item": "https://www.haulcommand.com/glossary" },
                        ...(term.category ? [{ "@type": "ListItem", "position": 3, "name": term.category, "item": `https://www.haulcommand.com/glossary#${term.category}` }] : []),
                        { "@type": "ListItem", "position": term.category ? 4 : 3, "name": term.term, "item": `https://www.haulcommand.com/glossary/${term.slug}` }
                    ]
                })
            }} />

            <div className="min-h-screen bg-[#070708] text-white selection:bg-blue-500/30 font-sans">
                {/* Subtle top gradient */}
                <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none bg-gradient-to-b from-blue-900/10 to-transparent opacity-50" />
                
                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
                    
                    {/* BREADCRUMBS */}
                    <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-10">
                        <Link aria-label="Glossary Index" href="/glossary" className="hover:text-white transition-colors duration-200">Glossary</Link>
                        <ChevronRight className="w-3 h-3 text-white/20" />
                        <Link aria-label={`Category ${term.category}`} href={`/glossary#${term.category || ''}`} className="hover:text-white transition-colors duration-200">
                            {term.category || 'Terms'}
                        </Link>
                        <ChevronRight className="w-3 h-3 text-white/20" />
                        <span className="text-blue-400">{term.term}</span>
                    </nav>

                    {/* HERO DEFINITION */}
                    <div className="bg-[#101012] border border-white/5 shadow-2xl rounded-3xl p-8 md:p-12 mb-10 relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/20 transition-all duration-700" />
                        
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8 relative z-10">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-sm">
                                    {term.term}
                                </h1>
                                {term.acronyms && term.acronyms.length > 0 && (
                                    <div className="flex gap-2">
                                        {term.acronyms.map((acronym: string) => (
                                            <span key={acronym} className="bg-white/10 text-white text-sm px-3 py-1 rounded border border-white/10 uppercase tracking-widest font-bold">
                                                {acronym}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* ACTION BAR */}
                            <div className="flex items-center gap-3">
                                <AudioPronunciation term={term.term} phonetic={term.phonetic_guide} variant="pill" className="h-10 hover:bg-white/10 transition-colors" />
                                <SaveButton entityType="glossary_topic" entityId={term.slug} entityLabel={term.term} variant="pill" />
                                <ShareButton title={`${term.term} — Heavy Haul Definition`} text={term.short_definition} context="directory" />
                            </div>
                        </div>

                        <p className="text-2xl text-gray-300 leading-snug font-medium border-l-4 border-blue-500 pl-6 py-1 speakable-summary relative z-10" data-speakable="true">
                            {term.short_definition}
                        </p>
                        
                        {/* Synonyms / Aliases */}
                        {term.synonyms && term.synonyms.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/5 flex gap-3 items-center flex-wrap relative z-10">
                                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <BookType className="w-4 h-4" /> Also known as
                                </span>
                                {term.synonyms.map((syn: string) => (
                                    <span key={syn} className="text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors px-3.5 py-1.5 rounded-full border border-white/5 shadow-sm">
                                        {syn}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* MAIN CONTENT AREA */}
                        <div className="lg:col-span-2 space-y-10">
                            
                            {/* Further Details / Long Definition */}
                            {term.long_definition && (
                                <section className="prose prose-invert prose-lg max-w-none text-gray-300">
                                    <h2 className="text-2xl font-bold text-white mb-6">Expanded Meaning</h2>
                                    <div className="leading-relaxed whitespace-pre-wrap">{term.long_definition}</div>
                                </section>
                            )}

                            {/* Smart Paywall Injector for High-Value Routing */}
                            <div className="my-8">
                                <SmartPaywallBannerAnon surface="glossary_term" />
                            </div>

                            {/* Why It Matters */}
                            {term.why_it_matters && (
                                <section className="bg-blue-950/20 border border-blue-900/50 rounded-2xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                    <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                        <Info className="w-5 h-5" /> Why It Matters
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed text-lg">{term.why_it_matters}</p>
                                </section>
                            )}

                            {/* Commonly Confused With */}
                            <CommonlyConfusedWith
                                currentTerm={term.term}
                                confusedTerms={(term.commonly_confused ?? []).map((c: any) => ({
                                    slug: c.slug,
                                    term: c.term,
                                    difference: c.difference,
                                }))}
                                relatedSlugs={term.related_slugs ?? []}
                            />
                            
                            {/* Haul Command Directory Linker */}
                            {term.surface_categories && term.surface_categories.length > 0 && (
                                <section className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <h3 className="text-2xl font-bold text-white mb-3 relative z-10 flex items-center gap-2">
                                        <Search className="w-6 h-6 text-blue-500" /> Find Verified Professionals
                                    </h3>
                                    <p className="text-gray-400 mb-6 relative z-10 text-lg">
                                        Haul Command connects you with {term.term} experts serving your exact corridor.
                                    </p>
                                    <Link aria-label={`Search Directory for ${term.term}`} href={`/directory?q=${term.surface_categories[0]}`} className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors relative z-10 group/btn">
                                        Search the Directory <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </section>
                            )}

                        </div>

                        {/* SIDEBAR */}
                        <aside className="space-y-8">
                            
                            {/* JURISDICTION & RULES */}
                            {((term.applicable_countries && term.applicable_countries.length > 0) || (term.related_rules && term.related_rules.length > 0)) && (
                                <div className="bg-[#101012] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Jurisdiction & Rules
                                    </h3>
                                    
                                    {term.applicable_countries && term.applicable_countries.length > 0 && (
                                        <div className="mb-6">
                                            <span className="text-xs text-gray-500 font-semibold mb-3 block">APPLIES IN</span>
                                            <div className="flex flex-wrap gap-2">
                                                {term.applicable_countries.map((c: string) => (
                                                    <span key={c} className="text-sm font-medium px-3 py-1 bg-white/5 border border-white/10 rounded-md text-gray-300">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {term.related_rules && term.related_rules.length > 0 && (
                                        <div>
                                            <span className="text-xs text-gray-500 font-semibold mb-3 block">REGULATIONS</span>
                                            <ul className="space-y-3">
                                                {term.related_rules.map((r: string) => {
                                                    const formattedRule = r.toLowerCase() === 'united states' ? 'us' : r.replace(/\s+/g, '-').toLowerCase();
                                                    return (
                                                        <li key={r}>
                                                            <Link aria-label={`Regulation: ${r}`} href={`/regulations/${formattedRule}`} className="flex items-start gap-2 text-sm text-gray-300 hover:text-white group">
                                                                <Scale className="w-4 h-4 mt-0.5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                                                                <span className="underline decoration-white/20 underline-offset-4 line-clamp-2 leading-relaxed">
                                                                    {r}
                                                                </span>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TOOLS WIDGET */}
                            {term.related_tools && term.related_tools.length > 0 && (
                                <div className="bg-[#101012] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-5 flex items-center gap-2">
                                        <Wrench className="w-4 h-4" /> Recommended Tools
                                    </h3>
                                    <ul className="space-y-3">
                                        {term.related_tools.map((tool: string) => (
                                            <li key={tool}>
                                                <Link aria-label={`Open ${tool}`} href={`/tools/${tool}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group">
                                                    <span className="text-sm font-medium text-gray-300 group-hover:text-white capitalize">
                                                        {tool.replace(/-/g, ' ')}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* RELATED TERMS */}
                            {term.related_slugs && term.related_slugs.length > 0 && (
                                <div className="bg-[#101012] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-5 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> See Also
                                    </h3>
                                    <ul className="space-y-3">
                                        {term.related_slugs.map((slug: string) => {
                                            const formattedSlug = slug.toLowerCase() === 'united states' ? 'us' : slug;
                                            return (
                                                <li key={slug}>
                                                    <Link aria-label={`View term: ${slug}`} href={`/glossary/${formattedSlug}`} className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-white transition-colors capitalize group">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-blue-500 transition-colors" />
                                                        {slug.replace(/-/g, ' ')}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* AdGrid Placement */}
                            <NativeAdCard
                                placementId="glossary-sidebar"
                                surface="glossary"
                                variant="sidebar"
                            />
                        </aside>
                    </div>

                    {/* AD GRID SLOT */}
                    <div className="mt-14 mb-8">
                        <AdGridSlot zone="glossary_term_bottom" />
                    </div>

                    {/* ACTION ORIENTED RESOURCES MESH */}
                    <div className="mt-16 pt-12 border-t border-white/10">
                        <h2 className="text-lg font-bold text-white mb-6">Related Heavy Haul Resources</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link href={(term.related_tools?.[0] ? `/tools/${term.related_tools[0]}` : '/tools/escort-calculator')}
                                className="flex flex-col gap-2 p-6 bg-amber-900/10 border border-amber-500/20 rounded-2xl hover:bg-amber-900/20 transition-all group">
                                <Wrench className="w-6 h-6 text-amber-500 mb-2" />
                                <h4 className="text-base font-bold text-white">Related Tool</h4>
                                <p className="text-sm text-gray-400">{term.related_tools?.[0] ? term.related_tools[0].replace(/-/g, ' ') : 'Escort Calculator'}</p>
                            </Link>

                            <Link href={(term.applicable_countries?.includes('US') ? '/escort-requirements' : '/regulations')}
                                className="flex flex-col gap-2 p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl hover:bg-blue-900/20 transition-all group">
                                <Scale className="w-6 h-6 text-blue-500 mb-2" />
                                <h4 className="text-base font-bold text-white">State Requirements</h4>
                                <p className="text-sm text-gray-400">Rules for heavy haul escorts</p>
                            </Link>

                            <Link href="/directory"
                                className="flex flex-col gap-2 p-6 bg-green-900/10 border border-green-500/20 rounded-2xl hover:bg-green-900/20 transition-all group">
                                <Search className="w-6 h-6 text-green-500 mb-2" />
                                <h4 className="text-base font-bold text-white">Find Verified Operators</h4>
                                <p className="text-sm text-gray-400">Pilot cars across 120 countries</p>
                            </Link>
                        </div>
                    </div>

                    {/* NO DEAD END */}
                    <div className="mt-12">
                        <NoDeadEndBlock
                            heading={`What Would You Like to Do with ${term.term}?`}
                            moves={[
                                { href: '/directory', icon: '🔍', title: 'Find Operators', desc: `Search for ${term.term} specialists`, primary: true, color: '#D4A844' },
                                { href: '/claim', icon: '✓', title: 'Claim Your Profile', desc: 'For operators & service providers', primary: true, color: '#22C55E' },
                                { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many escorts do you need?' },
                                { href: '/escort-requirements', icon: '⚖️', title: 'State Escort Rules', desc: 'Requirements by state' },
                                { href: '/glossary', icon: '📖', title: 'Full Glossary', desc: 'All heavy haul terms' },
                                { href: '/loads', icon: '📋', title: 'Load Board', desc: 'Post or find loads' },
                            ]}
                        />
                    </div>
                </main>
            </div>
        </Fragment>
    );
}
