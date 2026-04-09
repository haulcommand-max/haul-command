import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { ChevronRight } from 'lucide-react';
import { ScrollReveal } from '@/app/components/glossary/GlossaryAnimations';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { AdGridSlot } from '@/components/home/AdGridSlot';

interface Props {
    params: Promise<{ code: string }>;
}

const COUNTRY_META: Record<string, { name: string; flag: string; demonym: string }> = {
    us: { name: 'United States', flag: '🇺🇸', demonym: 'American' },
    ca: { name: 'Canada', flag: '🇨🇦', demonym: 'Canadian' },
    au: { name: 'Australia', flag: '🇦🇺', demonym: 'Australian' },
    gb: { name: 'United Kingdom', flag: '🇬🇧', demonym: 'British' },
    nz: { name: 'New Zealand', flag: '🇳🇿', demonym: 'New Zealand' },
    se: { name: 'Sweden', flag: '🇸🇪', demonym: 'Swedish' },
    no: { name: 'Norway', flag: '🇳🇴', demonym: 'Norwegian' },
    ae: { name: 'United Arab Emirates', flag: '🇦🇪', demonym: 'UAE' },
    sa: { name: 'Saudi Arabia', flag: '🇸🇦', demonym: 'Saudi' },
    de: { name: 'Germany', flag: '🇩🇪', demonym: 'German' },
    za: { name: 'South Africa', flag: '🇿🇦', demonym: 'South African' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params;
    const meta = COUNTRY_META[code.toLowerCase()];
    if (!meta) return { title: 'Country Glossary | Haul Command' };

    return {
        title: `${meta.name} Oversize & Escort Terminology | Haul Command Glossary`,
        description: `${meta.demonym} transport terminology for oversize loads, escort vehicles, and heavy haul operations. Country-specific terms and regulatory language.`,
        alternates: { canonical: `/glossary/country/${code.toLowerCase()}` },
        robots: 'index,follow',
    };
}

export default async function CountryGlossaryPage({ params }: Props) {
    const { code } = await params;
    const isoCode = code.toUpperCase();
    const meta = COUNTRY_META[code.toLowerCase()];

    if (!meta) notFound();

    const supabase = await createClient();

    // Fetch all term variants for this country (only indexed ones)
    const { data: variants } = await supabase
        .from('glossary_term_variants')
        .select('concept_slug, term_local, is_primary, search_aliases, regulatory_notes')
        .eq('country_code', isoCode)
        .eq('noindex', false)
        .order('is_primary', { ascending: false });

    // Fetch concept details
    const conceptSlugs = [...new Set((variants ?? []).map(v => v.concept_slug))];
    const { data: concepts } = conceptSlugs.length > 0
        ? await supabase
            .from('glossary_concepts')
            .select('concept_slug, concept_name, concept_description, category')
            .in('concept_slug', conceptSlugs)
        : { data: [] };

    const conceptMap = new Map((concepts ?? []).map(c => [c.concept_slug, c]));

    type VariantWithConcept = {
        concept_slug: string;
        concept_name: string;
        concept_description: string;
        category: string;
        term_local: string;
        is_primary: boolean;
        regulatory_notes: string | null;
        search_aliases: string[];
    };

    const enriched: VariantWithConcept[] = (variants ?? [])
        .filter(v => conceptMap.has(v.concept_slug))
        .map(v => {
            const c = conceptMap.get(v.concept_slug)!;
            return { ...v, concept_name: c.concept_name, concept_description: c.concept_description, category: c.category || 'general' };
        });

    const grouped = new Map<string, VariantWithConcept[]>();
    for (const item of enriched) {
        if (!grouped.has(item.category)) grouped.set(item.category, []);
        grouped.get(item.category)!.push(item);
    }

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${meta.name} Transport Glossary`,
        description: `${meta.demonym} oversize load and escort vehicle terminology.`,
        url: `https://haulcommand.com/glossary/country/${code.toLowerCase()}`,
        numberOfItems: enriched.length,
    };

    return (
        <div className="min-h-[100dvh] bg-[#0B0B0C] text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
                
                {/* BREADCRUMBS */}
                <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 mb-10">
                    <Link aria-label="Glossary Index" href="/glossary" className="hover:text-white transition-colors duration-200">Glossary</Link>
                    <ChevronRight className="w-3 h-3 text-white/20" />
                    <span className="text-[#D4A844]">{meta.name}</span>
                </nav>

                {/* HERO */}
                <ScrollReveal className="text-center mb-16 relative z-10">
                    <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none" aria-hidden="true">
                        <div className="w-[400px] h-[300px] rounded-full bg-[#D4A844]/[0.08] blur-[120px]" />
                    </div>
                    
                    <div className="inline-flex items-center gap-2 bg-[#D4A844]/10 border border-[#D4A844]/20 rounded-full px-4 py-1.5 mb-6">
                        <span className="text-lg">{meta.flag}</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#D4A844]">
                            {meta.name} Verified Framework
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4A844] via-[#e8c36a] to-[#D4A844]">
                            {meta.name}
                        </span>{' '}
                        Transport Terminology
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
                        {enriched.length} {meta.demonym} oversize load and escort vehicle terms mapped to their global counterparts. Understand local regulations and nuanced definitions.
                    </p>
                </ScrollReveal>

                {/* AD GRID SLOT */}
                <div className="mb-14">
                    <AdGridSlot zone="glossary_country_top" />
                </div>

                {/* CATEGORIES GRID */}
                {[...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
                    <ScrollReveal key={category} className="mb-14">
                        <h2 className="text-[11px] font-black tracking-[0.2em] text-[#D4A844] uppercase mb-5 flex items-center gap-2">
                            <span className="w-8 h-px bg-gradient-to-r from-[#D4A844] to-transparent" />
                            {category.replace(/_/g, ' ')}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item, i) => (
                                <Link 
                                    aria-label={`View Term: ${item.term_local}`}
                                    key={`${item.concept_slug}-${i}`}
                                    href={`/glossary/${item.concept_slug.toLowerCase()}`}
                                    className="block group h-full"
                                >
                                    <div className="bg-[#121214] border border-white/5 rounded-2xl p-5 h-full transition-all duration-300 group-hover:bg-[#1A1A1E] group-hover:border-[#D4A844]/30 relative overflow-hidden group-hover:-translate-y-1">
                                        
                                        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                                            <span className="text-white font-bold text-base group-hover:text-[#D4A844] transition-colors line-clamp-1">
                                                {item.term_local}
                                            </span>
                                            {item.is_primary && (
                                                <span className="text-[9px] text-[#22c55e] font-bold uppercase tracking-widest bg-[#22c55e]/10 px-1.5 py-0.5 rounded">
                                                    local primary
                                                </span>
                                            )}
                                            <span className="text-xs text-white/30 hidden sm:inline-block">
                                                → {item.concept_name}
                                            </span>
                                        </div>
                                        
                                        <p className="text-white/45 text-sm line-clamp-2 leading-relaxed mb-3">
                                            {item.concept_description}
                                        </p>
                                        
                                        {item.regulatory_notes && (
                                            <div className="mt-3 pt-3 border-t border-[#D4A844]/10">
                                                <span className="block text-xs text-[#D4A844]/80 font-medium leading-relaxed">
                                                    <span className="mr-1.5">⚖️</span>
                                                    {item.regulatory_notes}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </ScrollReveal>
                ))}

                {enriched.length === 0 && (
                    <div className="text-center py-24 bg-[#121214] border border-white/5 rounded-3xl opacity-80">
                        <span className="text-4xl mb-4 block opacity-50 grayscale">{meta.flag}</span>
                        <p className="text-lg text-white/50 mb-4 font-medium">
                            {meta.name} terminology is actively being mapped to the global framework.
                        </p>
                        <Link href="/glossary" className="text-[#D4A844] font-bold uppercase tracking-widest text-xs hover:text-white transition-colors">
                            Browse the Global Glossary →
                        </Link>
                    </div>
                )}

                {/* BROWSE OTHER COUNTRIES */}
                <ScrollReveal delay={100} className="mt-20 pt-10 border-t border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-5">
                        Explore Other Jurisdictions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(COUNTRY_META)
                            .filter(([k]) => k !== code.toLowerCase())
                            .map(([k, v]) => (
                                <Link
                                    key={k}
                                    href={`/glossary/country/${k}`}
                                    className="bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15 px-4 py-2 rounded-xl text-white/60 hover:text-white transition-all text-sm font-medium flex items-center gap-2"
                                >
                                    <span className="text-lg">{v.flag}</span> {v.name}
                                </Link>
                            ))}
                    </div>
                </ScrollReveal>

                {/* NO DEAD END BLOCK */}
                <div className="mt-16">
                    <NoDeadEndBlock
                        heading={`Next Steps in ${meta.name}`}
                        moves={[
                            { href: '/directory', icon: '🔍', title: 'Find Operators', desc: `Search ${meta.demonym} specialists`, primary: true, color: '#D4A844' },
                            { href: `/regulations/${code.toLowerCase()}`, icon: '⚖️', title: 'State Escort Rules', desc: 'Browse local requirements' },
                            { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'Equipment estimation' },
                        ]}
                    />
                </div>

            </main>
        </div>
    );
}
