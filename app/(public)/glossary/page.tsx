import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Heavy Haul Glossary | The Definitive Pilot Car & Oversize Load Dictionary | Haul Command',
    description: 'The complete A-Z glossary for heavy haul transportation, escort vehicles, oversize loads, and DOT compliance regulations.',
};

export default async function GlossaryHubPage() {
    const supabase = await createClient();

    // Fetch featured terms
    const { data: terms } = await supabase
        .from('glossary_public')
        .select('*')
        .order('snippet_priority', { ascending: false })
        .limit(100);

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                
                {/* HERO SECTION */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-400">
                            Heavy Haul
                        </span>{' '}
                        Glossary
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        The ultimate dictionary of terms, slang, regulations, and acronyms for the pilot car and oversize load industry.
                    </p>
                </div>

                {/* VISUAL CATEGORY DIRECTORY (Inspired by WLS image layout) */}
                <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-white text-center mb-8 border-b border-white/10 pb-4">Glossary Categories</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        <Link aria-label="Navigation Link" href="#pilot-car" className="group bg-[#121214] border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col items-center">
                            <div className="h-32 w-full bg-gradient-to-tr from-blue-900/30 to-black relative">
                                <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-80 group-hover:scale-110 transition-transform">🚔</span>
                            </div>
                            <div className="p-4 text-center w-full bg-[#18181B]">
                                <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-400">Pilot Car & Escort</h3>
                                <p className="text-xs text-gray-400">Official PEVO terms</p>
                            </div>
                        </Link>
                        
                        <Link aria-label="Navigation Link" href="#equipment" className="group bg-[#121214] border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col items-center">
                            <div className="h-32 w-full bg-gradient-to-tr from-orange-900/30 to-black relative">
                                <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-80 group-hover:scale-110 transition-transform">🏗️</span>
                            </div>
                            <div className="p-4 text-center w-full bg-[#18181B]">
                                <h3 className="text-base font-bold text-white mb-1 group-hover:text-orange-400">Heavy Equipment</h3>
                                <p className="text-xs text-gray-400">Machinery terms</p>
                            </div>
                        </Link>

                        <Link aria-label="Navigation Link" href="#regulations" className="group bg-[#121214] border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col items-center">
                            <div className="h-32 w-full bg-gradient-to-tr from-emerald-900/30 to-black relative">
                                <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-80 group-hover:scale-110 transition-transform">⚖️</span>
                            </div>
                            <div className="p-4 text-center w-full bg-[#18181B]">
                                <h3 className="text-base font-bold text-white mb-1 group-hover:text-emerald-400">Compliance & Law</h3>
                                <p className="text-xs text-gray-400">Frost, Chains, Permits</p>
                            </div>
                        </Link>

                        <Link aria-label="Navigation Link" href="#lingo" className="group bg-[#121214] border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col items-center">
                            <div className="h-32 w-full bg-gradient-to-tr from-purple-900/30 to-black relative">
                                <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-80 group-hover:scale-110 transition-transform">🎙️</span>
                            </div>
                            <div className="p-4 text-center w-full bg-[#18181B]">
                                <h3 className="text-base font-bold text-white mb-1 group-hover:text-purple-400">Radio Lingo</h3>
                                <p className="text-xs text-gray-400">Gators to Wiggle Wagons</p>
                            </div>
                        </Link>

                    </div>
                </div>

                {/* BANNER CTA (Inspired by the WLS "Get Your Shipping Estimate" banner) */}
                <div className="mb-16 rounded-xl overflow-hidden relative border border-white/10">
                    <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center brightness-50 opacity-40"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-black/90"></div>
                    <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Need a Pilot Car That Goes The Distance?</h2>
                            <p className="text-gray-300">Find verified, professional escort vehicles exactly where your load needs them.</p>
                        </div>
                        <Link aria-label="Navigation Link" href="/directory" className="whitespace-nowrap bg-white text-black font-bold uppercase tracking-wider text-sm px-8 py-4 rounded-xl hover:bg-gray-200 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            Search Network
                        </Link>
                    </div>
                </div>

                {/* TERMS GRID */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">Top Searched Terms</h2>
                    {terms && terms.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {terms.map((t) => (
                                <Link aria-label="Navigation Link" key={t.slug} href={`/glossary/${t.slug}`} className="block group">
                                    <div className="bg-[#18181B] border border-white/5 rounded-lg p-5 h-full transition-all group-hover:bg-[#1f1f23] group-hover:border-blue-500/30">
                                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 flex items-center justify-between">
                                            {t.term}
                                            <span className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                        </h3>
                                        {t.category && <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider text-gray-500">{t.category}</span>}
                                        <p className="text-gray-400 text-sm mt-3 line-clamp-3">
                                            {t.short_definition}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center py-12 border border-dashed border-white/10 rounded-xl">
                            Loading glossary database...
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
