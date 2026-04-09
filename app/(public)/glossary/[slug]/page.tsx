import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { Metadata } from 'next';
import SaveButton from '@/components/capture/SaveButton';
import AudioPronunciation from '@/components/glossary/AudioPronunciation';
import CommonlyConfusedWith from '@/components/glossary/CommonlyConfusedWith';
import { NativeAdCard } from '@/components/ads/NativeAdCard';
import { ShareButton } from '@/components/social/ShareButton';
import { SchemaOrchestrator } from '@/components/seo/SchemaOrchestrator';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

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
            {/* GlossaryPage SchemaOrchestrator */}
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
                    "description": term.short_definition,
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

            {/* FAQPage — snippet capture for EVERY glossary term */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": `What is ${term.term.toLowerCase().startsWith('a ') || term.term.toLowerCase().startsWith('an ') || term.term.toLowerCase().startsWith('the ') ? term.term : `a ${term.term}`} in heavy haul?`,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": term.short_definition
                            }
                        },
                        ...(term.why_it_matters ? [{
                            "@type": "Question",
                            "name": `Why does ${term.term} matter for oversize load transport?`,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": term.why_it_matters
                            }
                        }] : []),
                        ...(term.applicable_countries && term.applicable_countries.length > 0 ? [{
                            "@type": "Question",
                            "name": `Which countries require ${term.term}?`,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": `${term.term} applies in ${term.applicable_countries.join(', ')}. Requirements vary by jurisdiction — consult local transport authorities for specific regulations.`
                            }
                        }] : []),
                        ...(term.synonyms && term.synonyms.length > 0 ? [{
                            "@type": "Question",
                            "name": `What are other names for ${term.term}?`,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": `${term.term} is also known as: ${term.synonyms.join(', ')}. These terms are used interchangeably in different regions and jurisdictions.`
                            }
                        }] : []),
                    ]
                })
            }} />

            <div className="min-h-screen bg-[#0B0B0C] text-white selection:bg-blue-500/30">
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    
                    {/* BREADCRUMBS */}
                    <nav className="text-sm font-medium text-gray-500 mb-8 flex items-center gap-2">
                        <Link aria-label="Navigation Link" href="/glossary" className="hover:text-white transition-colors">Glossary</Link>
                        <span>/</span>
                        <Link aria-label="Navigation Link" href={`/glossary#${term.category || ''}`} className="hover:text-white transition-colors capitalize">
                            {term.category || 'Terms'}
                        </Link>
                        <span>/</span>
                        <span className="text-blue-400">{term.term}</span>
                    </nav>

                    {/* HERO DEFINITION */}
                    <div className="bg-[#121214] border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <span className="font-serif text-9xl">“</span>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4 flex-wrap">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                                {term.term}
                            </h1>
                            <AudioPronunciation term={term.term} phonetic={term.phonetic_guide} variant="pill" />
                            <SaveButton entityType="glossary_topic" entityId={term.slug} entityLabel={term.term} variant="pill" />
                            <ShareButton
                                title={`${term.term} — Heavy Haul Definition`}
                                text={term.short_definition}
                                context="directory"
                            />
                            {term.acronyms && term.acronyms.length > 0 && (
                                <span className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-md uppercase tracking-widest font-bold">
                                    {term.acronyms.join(', ')}
                                </span>
                            )}
                        </div>

                        <p
                            className="text-xl text-gray-300 leading-relaxed font-medium speakable-summary"
                            data-speakable="true"
                        >
                            {term.short_definition}
                        </p>
                        
                        {/* Synonyms / Aliases */}
                        {term.synonyms && term.synonyms.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/5 flex gap-2 items-center flex-wrap">
                                <span className="text-sm text-gray-500">Also known as:</span>
                                {term.synonyms.map((syn: string) => (
                                    <span key={syn} className="text-sm text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                        {syn}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* MAIN CONTENT AREA */}
                        <div className="md:col-span-2 space-y-8">
                            
                            {/* Further Details / Long Definition */}
                            {term.long_definition && (
                                <section className="prose prose-invert max-w-none">
                                    <h2 className="text-2xl font-bold border-b border-white/10 pb-2 mb-4">Expanded Meaning</h2>
                                    <div className="text-gray-300 leading-7 whitespace-pre-wrap">{term.long_definition}</div>
                                </section>
                            )}

                            {/* Why It Matters */}
                            {term.why_it_matters && (
                                <section className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6">
                                    <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2">
                                        Why It Matters
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">{term.why_it_matters}</p>
                                </section>
                            )}

                            {/* Commonly Confused With — P1 SEO + authority */}
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
                                <section className="bg-gradient-to-r from-[#18181B] to-[#121214] border border-white/10 rounded-xl p-6 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
                                    <h3 className="text-xl font-bold text-white mb-2 relative z-10">Find Verified Professionals</h3>
                                    <p className="text-sm text-gray-400 mb-4 relative z-10">
                                        Haul Command connects you with {term.term} experts in your area.
                                    </p>
                                    <div className="relative z-10">
                                        <Link aria-label="Navigation Link" href={`/directory?q=${term.surface_categories[0]}`} className="inline-flex items-center justify-center bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                                            Search Directory →
                                        </Link>
                                    </div>
                                </section>
                            )}

                        </div>

                        {/* SIDEBAR */}
                        <aside className="space-y-6">
                            
                            {/* TOOLS WIDGET */}
                            {term.related_tools && term.related_tools.length > 0 && (
                                <div className="bg-[#121214] border border-white/10 rounded-xl p-5">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Recommended Tools</h3>
                                    <ul className="space-y-3">
                                        {term.related_tools.map((tool: string) => (
                                            <li key={tool}>
                                                <Link aria-label="Navigation Link" href={`/tools/${tool}`} className="flex items-center justify-between text-blue-400 hover:text-blue-300 text-sm font-medium">
                                                    Open {tool.replace('-', ' ')}
                                                    <span>→</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* RELATED REGULATIONS & COUNTRIES */}
                            {((term.applicable_countries && term.applicable_countries.length > 0) || (term.related_rules && term.related_rules.length > 0)) && (
                                <div className="bg-[#121214] border border-white/10 rounded-xl p-5">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Jurisdiction & Rules</h3>
                                    
                                    {term.applicable_countries && term.applicable_countries.length > 0 && (
                                        <div className="mb-4">
                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-2">Applies In</span>
                                            <div className="flex flex-wrap gap-2">
                                                {term.applicable_countries.map((c: string) => (
                                                    <span key={c} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {term.related_rules && term.related_rules.length > 0 && (
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-2">Relevant Regulations</span>
                                            <ul className="space-y-2">
                                                {term.related_rules.map((r: string) => {
                                                    const formattedRule = r.toLowerCase() === 'united states' ? 'us' : r.replace(/\s+/g, '-').toLowerCase();
                                                    return (
                                                        <li key={r}>
                                                            <Link aria-label="Navigation Link" href={`/regulations/${formattedRule}`} className="text-sm text-gray-400 hover:text-white underline decoration-white/20 underline-offset-4 line-clamp-2">
                                                                {r}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* RELATED TERMS */}
                            {term.related_slugs && term.related_slugs.length > 0 && (
                                <div className="bg-[#121214] border border-white/10 rounded-xl p-5">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">See Also</h3>
                                    <ul className="space-y-2">
                                        {term.related_slugs.map((slug: string) => {
                                            const formattedSlug = slug.toLowerCase() === 'united states' ? 'us' : slug;
                                            return (
                                                <li key={slug}>
                                                    <Link aria-label="Navigation Link" href={`/glossary/${formattedSlug}`} className="text-gray-400 hover:text-white transition-colors text-sm font-medium capitalize flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                                                        {slug.replace(/-/g, ' ')}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* AdGrid Placement: glossary-sidebar (event: ad_impression / glossary) */}
                            <NativeAdCard
                                placementId="glossary-sidebar"
                                surface="glossary"
                                variant="sidebar"
                            />

                        </aside>
                    </div>

                        {/* GUARANTEED INTERNAL LINK MESH — every glossary page gets tool + regulation + directory */}
                        {/* This fires even when DB fields (related_tools, related_rules) are empty */}
                        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Related Resources</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {/* Tool link — guaranteed */}
                                <Link href={(term.related_tools?.[0] ? `/tools/${term.related_tools[0]}` : '/tools/escort-calculator')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(212,168,68,0.06)', border: '1px solid rgba(212,168,68,0.15)', borderRadius: 10, textDecoration: 'none' }}>
                                    <span style={{ fontSize: 14 }}>🧮</span>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#D4A844' }}>Related Tool</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{term.related_tools?.[0] ? term.related_tools[0].replace(/-/g, ' ') : 'Escort Calculator'}</div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', color: '#D4A844', fontSize: 12 }}>→</span>
                                </Link>
                                {/* Regulation link — guaranteed */}
                                <Link href={(term.applicable_countries?.includes('US') ? '/escort-requirements' : '/regulations')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, textDecoration: 'none' }}>
                                    <span style={{ fontSize: 14 }}>⚖️</span>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Escort Requirements by State</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Rules for every US state</div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>→</span>
                                </Link>
                                {/* Directory/commercial link — guaranteed */}
                                <Link href="/directory"
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, textDecoration: 'none' }}>
                                    <span style={{ fontSize: 14 }}>🔍</span>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E' }}>Find Verified Escort Operators</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Pilot cars across 120 countries</div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', color: '#22C55E', fontSize: 12 }}>→</span>
                                </Link>
                            </div>
                        </div>

                        {/* NO DEAD END — every glossary page gets this */}
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

                    </main>
                </div>
            </Fragment>
    );
}
