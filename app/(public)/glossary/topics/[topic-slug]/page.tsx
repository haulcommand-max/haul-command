import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ChevronRight } from 'lucide-react';
import { ScrollReveal } from '@/app/components/glossary/GlossaryAnimations';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { AdGridSlot } from '@/components/home/AdGridSlot';

export const revalidate = 3600;

const TOPIC_REGISTRY: Record<string, { label: string; sub: string; emoji: string; description: string }> = {
    'pilot-car': { label: 'Pilot Car Terms', sub: 'Escort Basics', emoji: '🚗', description: 'Essential terminology for professional pilot car operators.' },
    'escort-equipment': { label: 'Escort Equipment', sub: 'Gear & Tools', emoji: '🚐', description: 'Glossary of gear, safety apparel, and tools for escorts.' },
    'permits-regulations': { label: 'Permits & Regulations', sub: 'Legal Rules', emoji: '📜', description: 'Regulatory, legal, and compliance definitions.' },
    'route-planning': { label: 'Route Planning', sub: 'Surveys & Clearances', emoji: '🗺️', description: 'Terms related to route surveying, clearance, and navigation.' },
    'load-types': { label: 'Load Types', sub: 'Dimensions & Weight', emoji: '📦', description: 'Classifications of overweight, oversize, and special loads.' },
    'safety': { label: 'Safety', sub: 'Compliance & Risks', emoji: '🚦', description: 'Safety terminology, risk management, and compliance.' },
    'rates-costs': { label: 'Rates & Costs', sub: 'Negotiation', emoji: '💵', description: 'Financial terms, quotes, rates, and bidding rules.' },
    'vehicles': { label: 'Vehicles', sub: 'Pilot Cars & Trucks', emoji: '🚗', description: 'Definitions of different transport vehicles and trailers.' },
    'documentation': { label: 'Documentation', sub: 'Certs & Forms', emoji: '📋', description: 'Permits, certificates, and operational paperwork.' },
    // Persona slugs
    'broker': { label: 'Broker Hub', sub: 'Rates & negotiation', emoji: '🤝', description: 'Freight broker terminology and negotiation lingo.' },
    'carrier': { label: 'Carrier Hub', sub: 'Clearance & routes', emoji: '🚛', description: 'Motor carrier operational definitions.' },
    'shipper': { label: 'Shipper Hub', sub: 'Load types & rules', emoji: '📦', description: 'Shipper logistics and specialized freight definitions.' },
};

export async function generateMetadata({ params }: { params: { 'topic-slug': string } }): Promise<Metadata> {
    const slug = (await params)['topic-slug'];
    const topic = TOPIC_REGISTRY[slug];
    if (!topic) return { title: 'Topic Not Found | Haul Command' };

    return {
        title: `${topic.label} Glossary | Haul Command`,
        description: topic.description,
        alternates: { canonical: `https://www.haulcommand.com/glossary/topics/${slug}` }
    };
}

export default async function GlossaryTopicPage({ params }: { params: { 'topic-slug': string } }) {
    const slug = (await params)['topic-slug'];
    const topic = TOPIC_REGISTRY[slug];

    if (!topic) {
        notFound();
    }

    const supabase = await createClient();

    // Fetch terms matching this topic via category or generic match 
    // (A real implementation might match specialized column or tags)
    const { data: terms } = await supabase
        .from('glossary_public')
        .select('*')
        .order('term', { ascending: true })
        .limit(100); 

    // We do a soft filter in memory for now because we don't have perfect mapping yet.
    // In production, you would fetch `.eq('category', topic.label)` or use `tags.cs.{slug}`
    // If empty, just show all for the UX demo
    let filteredTerms = terms?.filter(t => t.category?.toLowerCase().includes(topic.label.toLowerCase().split(' ')[0])) || [];
    if (filteredTerms.length === 0) {
        filteredTerms = terms?.slice(0, 12) || [];
    }

    return (
        <div className="min-h-[100dvh] bg-[#0B0B0C] text-white">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
                
                {/* BREADCRUMBS */}
                <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 mb-10">
                    <Link aria-label="Glossary Index" href="/glossary" className="hover:text-white transition-colors duration-200">Glossary</Link>
                    <ChevronRight className="w-3 h-3 text-white/20" />
                    <span className="text-[#D4A844]">{topic.label}</span>
                </nav>

                <ScrollReveal className="text-center mb-16 relative z-10">
                    <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none" aria-hidden="true">
                        <div className="w-[400px] h-[200px] rounded-full bg-[#D4A844]/[0.08] blur-[120px]" />
                    </div>
                    <span className="text-6xl mb-6 block drop-shadow-xl">{topic.emoji}</span>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4A844] via-[#e8c36a] to-[#D4A844]">
                            {topic.label}
                        </span>{' '}
                        Definitions
                    </h1>
                    <p className="text-white/60 max-w-xl mx-auto text-lg leading-relaxed">
                        {topic.description} Explore verified terms curated for this sector across our 120-country framework.
                    </p>
                </ScrollReveal>

                {/* TERMS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                    {filteredTerms.map((t, idx) => (
                        <ScrollReveal key={t.slug} delay={Math.min(idx * 30, 200)}>
                            <Link href={`/glossary/${t.slug}`} className="block group h-full">
                                <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 h-full transition-all duration-300 group-hover:bg-[#1A1A1E] group-hover:border-[#D4A844]/30 relative overflow-hidden group-hover:-translate-y-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-[#D4A844] transition-colors mb-2">
                                        {t.term}
                                    </h3>
                                    <p className="text-white/50 text-sm line-clamp-3 leading-relaxed">
                                        {t.short_definition}
                                    </p>
                                </div>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>

                <div className="mb-10">
                    <AdGridSlot zone="glossary_topic_bottom" />
                </div>

                <div className="mt-12">
                    <NoDeadEndBlock
                        heading="Take Action on Your Route"
                        moves={[
                            { href: '/directory', icon: '🔍', title: 'Find Operators', desc: 'Search for specialists', primary: true, color: '#D4A844' },
                            { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many escorts do you need?' },
                            { href: '/escort-requirements', icon: '⚖️', title: 'State Escort Rules', desc: 'Requirements by state' },
                        ]}
                    />
                </div>
            </main>
        </div>
    );
}
