import { getGlossaryHub } from '@/lib/glossary/queries';
import Link from 'next/link';
import { ArrowRight, Book, Globe } from 'lucide-react';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 86400;

export default async function GlossaryHubPage() {
    const data = await getGlossaryHub();

    return (
        <div className="min-h-screen bg-[#070708] text-white">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                
                {/* Hero Section */}
                <div className="mb-16">
                    <h1 className="text-5xl font-black text-white tracking-tight mb-4 text-[#D4A844]">
                        Haul Command Glossary
                    </h1>
                    <p className="text-xl text-gray-400">
                        The definitive guide to heavy haul terminology, compliance limits, and pilot car equipment.
                    </p>
                    <div className="flex items-center gap-6 mt-8">
                        <div className="bg-[#101012] border border-white/5 rounded-2xl p-6 text-center">
                            <div className="text-3xl font-black text-white">{data.counters.total_terms}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Verified Terms</div>
                        </div>
                        <div className="bg-[#101012] border border-white/5 rounded-2xl p-6 text-center">
                            <div className="text-3xl font-black text-white">{data.counters.total_countries}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Countries</div>
                        </div>
                    </div>
                </div>

                {/* Topics Grid */}
                <section className="mb-16">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Book className="w-4 h-4" /> Browse by Topic
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.topics.map((topic: any) => (
                            <Link href={`/glossary/topics/${topic.slug}`} key={topic.slug} className="group p-6 bg-[#101012] border border-white/5 hover:border-white/20 transition-all rounded-2xl flex flex-col gap-3">
                                <h3 className="text-xl font-bold text-white group-hover:text-[#D4A844] transition-colors">{topic.name}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2">{topic.description}</p>
                                <span className="text-xs font-bold text-gray-500 mt-auto">{topic.active_term_count} Terms</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Global Coverage Grid */}
                <section className="mb-16">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Global Coverage
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {data.countries.map((country: any) => (
                            <Link href={`/glossary/${country.code.toLowerCase()}`} key={country.code} className="px-5 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center gap-3">
                                <span className="font-bold text-white">{country.code}</span>
                                <span className="text-xs font-bold text-gray-500 bg-black px-2 py-0.5 rounded-full">{country.term_count} terms</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recently Updated */}
                <section className="mb-16">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Recently Updated</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.recently_updated.map((term: any) => (
                            <Link href={`/glossary/${term.slug}`} key={term.slug} className="p-5 bg-[#101012] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                                <h4 className="font-bold text-white mb-2">{term.term}</h4>
                                <p className="text-sm text-gray-400 line-clamp-2">{term.short_definition}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                <NoDeadEndBlock
                    heading={`Need specific operational support?`}
                    moves={[
                        { href: '/directory', icon: '🔍', title: 'Find Operators', desc: `Search specialists`, primary: true, color: '#D4A844' },
                        { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many escorts do you need?' },
                    ]}
                />
            </main>
        </div>
    );
}
