import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { Metadata } from 'next';
import { 
    BookOpen, Scale, Wrench, Search, ChevronRight, Share2, 
    BookmarkPlus, Globe, Info, ArrowRight, BookType, HelpCircle
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
import { getGlossaryTerm } from '@/lib/glossary/queries';
import { TrustStrip } from '@/components/ui/intent-blocks';
import { RegulationComplianceTeaser } from '@/components/monetization/DataProductTeaser';

export const revalidate = 86400; // Cache for 24h

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const slug = (await params).slug;
    const data = await getGlossaryTerm(slug);
    
    if (!data || !data.slug) {
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
    
    const term = await getGlossaryTerm(slug);

    if (!term || !term.slug) {
        // Here you might check aliases table and redirect if alias.
        // For now, assume Not Found if not available via RPC payload.
        notFound();
    }

    // Commercial and Routing logic 
    const claimLinks = term.links?.filter((l: any) => l.link_type === 'claim_path') || [];
    const directoryLinks = term.links?.filter((l: any) => l.link_type === 'next_action' && l.target_id.includes('directory')) || [];
    const requirementLinks = term.links?.filter((l: any) => l.link_type === 'next_action' && l.target_id.includes('requirements')) || [];
    const toolLinks = term.links?.filter((l: any) => l.link_type === 'related_tool') || [];

    return (
        <Fragment>
            <SchemaOrchestrator
                type="GlossaryPage"
                data={{
                    term: term.term,
                    definition: term.short_definition,
                    url: `https://www.haulcommand.com/glossary/${term.slug}`,
                    relatedTerms: (term.related_terms || []).map((rt: any) => rt.slug),
                }}
            />

            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "DefinedTerm",
                    "termCode": term.slug,
                    "name": term.term,
                    "alternateName": term.aliases && term.aliases.length > 0 ? term.aliases : undefined,
                    "description": term.long_definition ? `${term.short_definition} ${term.long_definition.slice(0, 150)}...` : term.short_definition,
                    "inDefinedTermSet": {
                        "@type": "DefinedTermSet",
                        "name": "Haul Command Heavy Haul Glossary",
                        "url": "https://www.haulcommand.com/glossary"
                    }
                })
            }} />

            <div className="min-h-screen bg-[#070708] text-white selection:bg-[#D4A844]/30 font-sans">
                <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none bg-gradient-to-b from-[#D4A844]/5 to-transparent opacity-50" />
                
                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">

                    {/* TRUST STRIP — Source confidence, freshness, verification chain */}
                    <div className="mb-8">
                        <TrustStrip
                            confidenceLevel="verified_current"
                            lastVerifiedAt={new Date().toISOString().split('T')[0]}
                            officialSourceName="Haul Command Regulatory Research Desk"
                            metrics={{ verifiedCount: 24164 }}
                        />
                    </div>
                    
                    {/* BREADCRUMBS */}
                    <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-10">
                        <Link aria-label="Glossary Index" href="/glossary" className="hover:text-white transition-colors duration-200">Glossary</Link>
                        <ChevronRight className="w-3 h-3 text-white/20" />
                        <Link aria-label={`Category ${term.topic_primary_name}`} href={`/glossary/topics/${term.topic_primary_slug}`} className="hover:text-white transition-colors duration-200">
                            {term.topic_primary_name || 'Terms'}
                        </Link>
                        <ChevronRight className="w-3 h-3 text-white/20" />
                        <span className="text-[#D4A844]">{term.term}</span>
                    </nav>

                    {/* HERO DEFINITION */}
                    <div className="bg-[#101012] border border-white/5 shadow-2xl rounded-3xl p-8 md:p-12 mb-10 relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#D4A844]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#D4A844]/10 transition-all duration-700" />
                        
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8 relative z-10">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-sm">
                                    {term.term}
                                </h1>
                            </div>
                            
                            {/* ACTION BAR */}
                            <div className="flex items-center gap-3">
                                <AudioPronunciation term={term.term} phonetic="" variant="pill" className="h-10 hover:bg-white/10 transition-colors" />
                                <SaveButton entityType="glossary_topic" entityId={term.slug} entityLabel={term.term} variant="pill" />
                                <ShareButton title={`${term.term} — Heavy Haul Definition`} text={term.short_definition} context="directory" />
                            </div>
                        </div>

                        <p className="text-2xl text-gray-300 leading-snug font-medium border-l-4 border-[#D4A844] pl-6 py-1 relative z-10">
                            {term.short_definition}
                        </p>
                        
                        {/* Synonyms / Aliases */}
                        {term.aliases && term.aliases.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/5 flex gap-3 items-center flex-wrap relative z-10">
                                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <BookType className="w-4 h-4" /> Also known as
                                </span>
                                {term.aliases.map((syn: string) => (
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
                            
                            {/* Plain English */}
                            {term.plain_english && (
                                <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-[#D4A844] uppercase tracking-widest mb-3">Quick Read</h3>
                                    <p className="text-lg text-gray-200">{term.plain_english}</p>
                                </section>
                            )}

                            {/* Expanded Meaning */}
                            {term.long_definition && (
                                <section className="prose prose-invert prose-lg max-w-none text-gray-300">
                                    <h2 className="text-2xl font-bold text-white mb-6">Expanded Meaning</h2>
                                    <div className="leading-relaxed whitespace-pre-wrap">{term.long_definition}</div>
                                </section>
                            )}
                            
                            {/* FAQs */}
                            {term.faqs && term.faqs.length > 0 && (
                                <section className="border-t border-white/10 pt-8 mt-8">
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                        <HelpCircle className="w-6 h-6 text-[#D4A844]" /> Frequently Asked Questions
                                    </h2>
                                    <div className="space-y-6">
                                        {term.faqs.map((faq: any, idx: number) => (
                                            <div key={idx}>
                                                <h4 className="text-lg font-bold text-white mb-2">{faq.question}</h4>
                                                <p className="text-gray-400">{faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Data Product Teaser — cross-sell jurisdiction compliance data */}
                            {term.country_codes && term.country_codes.length > 0 && (
                                <div className="my-8">
                                    <RegulationComplianceTeaser
                                        countryCode={term.country_codes[0]}
                                    />
                                </div>
                            )}

                            {/* Smart Paywall */}
                            <div className="my-8">
                                <SmartPaywallBannerAnon surface="glossary_term" />
                            </div>

                            {/* Why It Matters */}
                            {term.why_it_matters && (
                                <section className="bg-[#D4A844]/10 border border-[#D4A844]/20 rounded-2xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#D4A844]" />
                                    <h3 className="text-xl font-bold text-[#D4A844] mb-4 flex items-center gap-2">
                                        <Info className="w-5 h-5" /> Why It Matters
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed text-lg">{term.why_it_matters}</p>
                                </section>
                            )}
                        </div>

                        {/* SIDEBAR */}
                        <aside className="space-y-8">
                            
                            {/* Regulatory Note / Overlays */}
                            {term.regulatory_note && (
                                <div className="bg-[#101012] border border-red-500/20 rounded-2xl p-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-400 mb-4 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Regional Note
                                    </h3>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {term.regulatory_note}
                                    </p>
                                </div>
                            )}

                            {/* TOOLS WIDGET */}
                            {toolLinks.length > 0 && (
                                <div className="bg-[#101012] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-5 flex items-center gap-2">
                                        <Wrench className="w-4 h-4" /> Recommended Tools
                                    </h3>
                                    <ul className="space-y-3">
                                        {toolLinks.map((tool: any, i: number) => (
                                            <li key={i}>
                                                <Link aria-label={`Open Tool`} href={tool.target_id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group">
                                                    <span className="text-sm font-medium text-gray-300 group-hover:text-white capitalize">
                                                        {tool.anchor_text || tool.target_id.split('/').pop().replace(/-/g, ' ')}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* RELATED TERMS */}
                            {term.related_terms && term.related_terms.length > 0 && (
                                <div className="bg-[#101012] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-5 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> See Also
                                    </h3>
                                    <ul className="space-y-3">
                                        {term.related_terms.map((rt: any) => (
                                            <li key={rt.slug}>
                                                <Link aria-label={`View term: ${rt.slug}`} href={`/glossary/${rt.slug}`} className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-white transition-colors capitalize group">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-[#D4A844] transition-colors" />
                                                    {rt.term}
                                                </Link>
                                            </li>
                                        ))}
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

                    {/* NO DEAD END */}
                    <div className="mt-12">
                        <NoDeadEndBlock
                            heading={`What Would You Like to Do with ${term.term}?`}
                            moves={[
                                ...(directoryLinks.length > 0 ? [{ href: directoryLinks[0].target_id, icon: '🔍', title: directoryLinks[0].anchor_text || 'Find Operators', desc: `Search specialists`, primary: true, color: '#D4A844' }] : [{ href: '/directory', icon: '🔍', title: 'Find Operators', desc: `Search specialists`, primary: true, color: '#D4A844' }]),
                                ...(claimLinks.length > 0 ? [{ href: claimLinks[0].target_id, icon: '✓', title: 'Claim Your Profile', desc: 'Join the directory', primary: true, color: '#22C55E' }] : []),
                                ...(requirementLinks.length > 0 ? [{ href: requirementLinks[0].target_id, icon: '⚖️', title: 'State Escort Rules', desc: 'Requirements by state' }] : []),
                                { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many escorts do you need?' },
                                { href: '/glossary', icon: '📖', title: 'Full Glossary', desc: 'All heavy haul terms' },
                            ]}
                        />
                    </div>
                </main>
            </div>
        </Fragment>
    );
}
