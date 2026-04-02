export const dynamic = "force-dynamic";
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
        <div className="min-h-[100dvh] bg-[#0B0B0C] text-white">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
                
                {/* HERO SECTION + SEARCH */}
                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4A844] to-orange-400">
                            Heavy Haul
                        </span>{' '}
                        Glossary
                    </h1>
                    <p className="text-base md:text-lg text-white/50 max-w-2xl mx-auto mb-8 font-medium">
                        The ultimate dictionary of terms, slang, regulations, and acronyms for the pilot car and oversize load industry.
                    </p>
                    
                    {/* PROMINENT SEARCH-FIRST UI */}
                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-white/40 group-focus-within:text-[#D4A844] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input 
                            type="search" 
                            placeholder="Search for terms, acronyms, or states..." 
                            className="w-full bg-[#121214] border-2 border-white/10 rounded-2xl py-4 pl-14 pr-24 text-white placeholder-white/40 focus:outline-none focus:border-[#D4A844]/50 focus:ring-4 focus:ring-[#D4A844]/10 transition-all text-base shadow-2xl"
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <button className="bg-[#D4A844] text-black uppercase tracking-widest text-[11px] font-black px-5 py-2.5 rounded-xl hover:bg-[#E5B54A] active:scale-95 transition-all">
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* STICKY A-Z HORIZONTAL BAR */}
                <div className="sticky top-0 z-50 bg-[#0B0B0C]/80 backdrop-blur-xl border-y border-white/5 py-4 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {['#', ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')].map((letter) => (
                            <Link aria-label={`Go to letter ${letter}`} key={letter} href={`#${letter}`} className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-lg hover:bg-[#D4A844]/10 hover:border-[#D4A844]/30 hover:text-[#D4A844] hover:shadow-[0_0_15px_rgba(212,168,68,0.15)] active:scale-95 transition-all uppercase">
                                {letter}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* VISUAL CATEGORY DIRECTORY */}
                <div className="mb-12">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-4 px-1">Browse by Category</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        
                        <Link aria-label="Navigation Link" href="#pilot-car" className="group bg-[#121214] border border-white/5 rounded-2xl overflow-hidden hover:border-[#D4A844]/30 transition-all flex flex-col items-center shadow-lg hover:shadow-[0_0_20px_rgba(212,168,68,0.1)]">
                            <div className="h-24 md:h-32 w-full bg-gradient-to-tr from-blue-900/20 to-black relative">
                                <span className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🚔</span>
                            </div>
                            <div className="p-3 md:p-4 text-center w-full bg-[#15151A]">
                                <h3 className="text-sm md:text-base font-bold text-white mb-0.5 group-hover:text-blue-400 transition-colors">Pilot Car</h3>
                                <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-widest font-semibold">Official Terms</p>
                            </div>
                        </Link>
                        
                        <Link aria-label="Navigation Link" href="#equipment" className="group bg-[#121214] border border-white/5 rounded-2xl overflow-hidden hover:border-[#D4A844]/30 transition-all flex flex-col items-center shadow-lg hover:shadow-[0_0_20px_rgba(212,168,68,0.1)]">
                            <div className="h-24 md:h-32 w-full bg-gradient-to-tr from-orange-900/20 to-black relative">
                                <span className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🏗️</span>
                            </div>
                            <div className="p-3 md:p-4 text-center w-full bg-[#15151A]">
                                <h3 className="text-sm md:text-base font-bold text-white mb-0.5 group-hover:text-orange-400 transition-colors">Equipment</h3>
                                <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-widest font-semibold">Machinery</p>
                            </div>
                        </Link>

                        <Link aria-label="Navigation Link" href="#regulations" className="group bg-[#121214] border border-white/5 rounded-2xl overflow-hidden hover:border-[#D4A844]/30 transition-all flex flex-col items-center shadow-lg hover:shadow-[0_0_20px_rgba(212,168,68,0.1)]">
                            <div className="h-24 md:h-32 w-full bg-gradient-to-tr from-emerald-900/20 to-black relative">
                                <span className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">⚖️</span>
                            </div>
                            <div className="p-3 md:p-4 text-center w-full bg-[#15151A]">
                                <h3 className="text-sm md:text-base font-bold text-white mb-0.5 group-hover:text-emerald-400 transition-colors">Compliance</h3>
                                <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-widest font-semibold">Frost & Permits</p>
                            </div>
                        </Link>

                        <Link aria-label="Navigation Link" href="#lingo" className="group bg-[#121214] border border-white/5 rounded-2xl overflow-hidden hover:border-[#D4A844]/30 transition-all flex flex-col items-center shadow-lg hover:shadow-[0_0_20px_rgba(212,168,68,0.1)]">
                            <div className="h-24 md:h-32 w-full bg-gradient-to-tr from-purple-900/20 to-black relative">
                                <span className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🎙️</span>
                            </div>
                            <div className="p-3 md:p-4 text-center w-full bg-[#15151A]">
                                <h3 className="text-sm md:text-base font-bold text-white mb-0.5 group-hover:text-purple-400 transition-colors">Radio Lingo</h3>
                                <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-widest font-semibold">Slang Terms</p>
                            </div>
                        </Link>

                    </div>
                </div>

                {/* TERMS GRID */}
                <div>
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-4 px-1">Top Searched Terms</h2>
                    {terms && terms.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                            {terms.map((t) => (
                                <Link aria-label="Navigation Link" key={t.slug} href={`/glossary/${t.slug}`} className="block group">
                                    <div className="bg-[#121214] border border-white/5 rounded-2xl p-5 h-full transition-all group-hover:bg-[#1A1A1E] group-hover:border-[#D4A844]/30 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-white/5 group-hover:bg-[#D4A844] transition-colors" />
                                        <h3 className="text-base font-bold text-white group-hover:text-[#D4A844] transition-colors flex items-center justify-between">
                                            {t.term}
                                            <span className="text-white/20 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300">→</span>
                                        </h3>
                                        {t.category && <span className="inline-block mt-2 text-[9px] uppercase font-black tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/5 group-hover:border-[#D4A844]/20 group-hover:text-[#D4A844]/60 transition-colors">{t.category}</span>}
                                        <p className="text-white/50 text-sm mt-3 line-clamp-3 leading-relaxed">
                                            {t.short_definition}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-white/40 text-center py-16 border-2 border-dashed border-white/5 rounded-3xl bg-[#121214] font-medium text-lg">
                            Loading glossary database...
                        </div>
                    )}
                </div>

                {/* BANNER CTA */}
                <div className="mt-16 rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl">
                    <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center brightness-50 opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-black/90"></div>
                    <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Need a Pilot Car That Goes The Distance?</h2>
                            <p className="text-white/70 font-medium text-sm md:text-base">Find verified, professional escort vehicles exactly where your load needs them.</p>
                        </div>
                        <Link aria-label="Navigation Link" href="/directory" className="whitespace-nowrap bg-[#D4A844] text-black font-black uppercase tracking-widest text-xs md:text-sm px-8 py-4 rounded-xl hover:bg-[#E5B54A] transition-all hover:scale-105 shadow-[0_0_30px_rgba(212,168,68,0.3)]">
                            Search Network
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}

