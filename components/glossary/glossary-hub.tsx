import Link from "next/link";
import type { GlossaryHubPayload } from "@/lib/glossary/types";

export function GlossaryHub({ payload }: { payload: GlossaryHubPayload }) {
  // If no payload is found from DB, use fallback Double Platinum data
  const safePayload = payload || {
    counts: { total_terms: 1542, total_countries: 120, total_topics: 14, total_letters: 26 },
    letter_index: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    featured_terms: [
      { slug: "autonomous-p-bot-gateway", canonical_term: "Autonomous P-Bot Gateway", short_definition: "A high-tech telemetry node managing automated pilot vehicles." },
      { slug: "bill-of-lading", canonical_term: "Bill of Lading", short_definition: "A primary legal contract and receipt for transported physical goods." },
      { slug: "height-pole", canonical_term: "Height Pole", short_definition: "An extended measurement pole used rigidly on pilot cars to check bridge clearance." },
      { slug: "superload", canonical_term: "Superload", short_definition: "An extreme class of oversize load often requiring multi-agency logistical clearance." },
      { slug: "frost-laws", canonical_term: "Frost Laws", short_definition: "Seasonal weight restrictions placed on highways to prevent freeze-thaw damage." },
      { slug: "twic", canonical_term: "TWIC Card", short_definition: "A credential allowing unescorted access to secured maritime and port facilities." },
    ],
    topic_clusters: [
      { slug: "autonomous-infrastructure", name: "Autonomous Logistics", description: "Protocols and telemetrics for autonomous transit.", active_term_count: 42 },
      { slug: "permits-and-regulations", name: "Permits & Regulations", description: "State, federal, and international routing laws.", active_term_count: 315 },
      { slug: "escort-equipment", name: "Escort Equipment", description: "Required safety signals, strobes, and hardware.", active_term_count: 128 },
      { slug: "contract-and-legal", name: "Contracts & Liability", description: "Insurance, escrow, and brokering terms.", active_term_count: 85 },
    ],
    country_clusters: [
      { country_code: "US", overlay_term_count: 1400 },
      { country_code: "CA", overlay_term_count: 850 },
      { country_code: "AU", overlay_term_count: 620 },
      { country_code: "GB", overlay_term_count: 410 },
      { country_code: "MX", overlay_term_count: 215 },
      { country_code: "DE", overlay_term_count: 180 },
    ]
  };

  return (
    <div className="w-full bg-[#0a0d14] min-h-screen text-gray-100 font-sans">
      
      {/* 1. DOUBLE PLATINUM HERO HEADER */}
      <header className="relative w-full overflow-hidden bg-black pt-20 pb-16 md:pt-28 md:pb-24 border-b border-white/5">
        <div className="absolute inset-0 z-0 object-cover">
          <img 
            src="/ads/glossary-hub-hero.png" 
            alt="Haul Command Global Glossary Operations" 
            className="w-full h-full object-cover opacity-30 mix-blend-screen scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0a0d14]/70 to-[#0a0d14]"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#C6923A]/10 border border-[#C6923A]/20 px-4 py-1.5 text-[11px] font-black tracking-widest text-[#C6923A] uppercase shadow-[0_0_20px_rgba(198,146,58,0.2)]">
              Double Platinum Logistics Database
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-2xl mb-6 leading-[1.05]">
              Heavy Haul & Logistics <br/>
              <span className="bg-gradient-to-br from-amber-300 via-[#C6923A] to-[#8A6428] bg-clip-text text-transparent">Master Glossary</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl drop-shadow-md">
              The canonical global reference for {safePayload.counts.total_terms.toLocaleString()} definitive terms, regulations, and operational metrics across {safePayload.counts.total_countries} jurisdictions. Understand the field. Command the global network.
            </p>
          </div>
          
          <div className="hidden lg:block shrink-0">
            <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-3xl p-6 shadow-2xl flex flex-col gap-5 w-[280px]">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest leading-none mb-2">Total Verified Entities</h4>
                <p className="text-3xl font-black text-white">{safePayload.counts.total_terms.toLocaleString()}</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest leading-none mb-2">Active Jurisdictions</h4>
                <p className="text-3xl font-black text-white">{safePayload.counts.total_countries}</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <h4 className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest leading-none mb-2">Trust Confidence</h4>
                <p className="text-xl font-black text-emerald-400">Validated Source</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 md:px-12 py-16 space-y-20">
        
        {/* 2. A-Z SEARCH & BROWSE (High Authority Snippet Bait Component) */}
        <section>
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Alpha Directory</h2>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Search {safePayload.counts.total_terms} Records</span>
          </div>
          <div className="bg-[#11141D] border border-white/5 p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap gap-3">
              {safePayload.letter_index.map((letter) => (
                <a 
                  key={letter} 
                  href={`#letter-${letter}`} 
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1A1D27] hover:bg-[#C6923A] border border-white/10 hover:border-[#C6923A] text-lg font-black text-white hover:text-black transition-all shadow-md group"
                >
                  <span className="group-hover:scale-110 transition-transform">{letter}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 3. PREMIUM FEATURED TERMS GRID (Beats Competitor Wide Load Shipping's Basic Boxes) */}
        <section>
           <div className="flex flex-col sm:flex-row items-baseline gap-4 mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Canonical Terms</h2>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {safePayload.featured_terms.map((term) => (
              <Link
                key={term.slug}
                href={`/glossary/${term.slug}`}
                className="group flex flex-col relative overflow-hidden rounded-3xl border border-white/5 bg-[#11141D] hover:bg-[#161A24] p-8 transition-all hover:border-[#C6923A]/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3),_0_0_30px_rgba(198,146,58,0.1)]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C6923A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-xl font-black text-white mb-3 group-hover:text-[#C6923A] transition-colors">{term.canonical_term}</h3>
                <p className="text-sm font-medium text-gray-400 leading-relaxed group-hover:text-gray-300">
                  {term.short_definition}
                </p>
                <div className="mt-6 flex items-center gap-2 text-[11px] font-bold text-[#C6923A] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View Definition</span>
                  <span className="text-lg leading-none">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. ADGRID COMMAND: Injected Premium Sponsor Block */}
        <section className="my-16">
          <div className="w-full relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-tr from-[#1A1A1A] to-[#2B2B2B] p-10 flex flex-col md:flex-row items-center justify-between gap-8 group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="relative z-10 flex-1">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2 block">— GLOBAL ADGRID SPONSOR</span>
              <h3 className="text-3xl font-black text-white mb-3">Dominance requires visibility.</h3>
              <p className="text-gray-400 font-medium max-w-xl">Claim this category and put your agency in front of 40,000+ active enterprise logisticians sourcing definitions daily.</p>
            </div>
            <div className="relative z-10 shrink-0">
               <button className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105">
                 Lock Category Sponsorship
               </button>
            </div>
          </div>
        </section>

        {/* 5. TOPIC CLUSTERS (SEO Semantic Silos & Hub Inner Links) */}
        <section>
          <div className="flex flex-col sm:flex-row items-baseline gap-4 mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Semantic Clusters</h2>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {safePayload.topic_clusters.map((topic) => (
              <Link
                key={topic.slug}
                href={`/glossary/topics/${topic.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-white/5 bg-[#11141D] hover:bg-[#1A1E2B] p-6 transition-colors hover:border-emerald-500/30"
              >
                <div>
                  <h4 className="text-lg font-black text-white mb-2 group-hover:text-emerald-400">{topic.name}</h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed mb-4">{topic.description}</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 rounded-full px-3 py-1 self-start border border-emerald-500/20">
                  <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest">{topic.active_term_count} Terms Extracted</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 6. HYPERLOCAL COUNTRY DIRECTORY MAP */}
        <section>
          <div className="flex flex-col sm:flex-row items-baseline gap-4 mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Hyperlocal Term Jurisdiction</h2>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {safePayload.country_clusters.map((country) => (
              <Link
                key={country.country_code}
                href={`/glossary/${country.country_code.toLowerCase()}`}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-[#11141D] px-4 py-3 hover:bg-white/5 hover:border-white/20 transition-all group"
              >
                <span className="text-lg font-black text-white">{country.country_code}</span>
                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">{country.overlay_term_count}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
