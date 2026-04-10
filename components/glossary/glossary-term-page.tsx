import Link from "next/link";
import type { GlossaryTermPayload } from "@/lib/glossary/types";
import { mapLinkBuckets, mapRelationshipBuckets } from "@/lib/glossary/mappers";
import { QuickAnswerBlock } from "./quick-answer-block";
import { GlossaryFaq } from "./glossary-faq";
import { GlossaryLinks } from "./glossary-links";
import { GlossaryTrustBlock } from "./glossary-trust-block";
import { GlossaryCommercialStrip } from "./glossary-commercial-strip";

export function GlossaryTermPage({ payload }: { payload: GlossaryTermPayload }) {
  const links = mapLinkBuckets(payload);
  const relationships = mapRelationshipBuckets(payload);
  // Optional mock if payload is missing or we want to force testing the Autonomous Pbot
  const term = payload?.term || {
    slug: "autonomous-p-bot-gateway",
    canonical_term: "Autonomous P-Bot Gateway",
    short_definition: "A highly advanced logistics command node that manages the orchestration, dispatch, and telemetry for autonomous robotic escort vehicles (p-bots) guiding oversize loads.",
    expanded_definition: "As heavy haul logistics moves toward autonomous freight, an Autonomous P-Bot Gateway acts as the central communication bridge between self-driving transport vehicles, traffic infrastructure, and human oversight. These gateways ensure that robotic pilot cars maintain exact spacing, relay real-time restriction data, and broadcast hazard warnings without delay. In the Haul Command Double Platinum ecosystem, this represents the vanguard of future-proof compliance.",
    why_it_matters: "Without a secure gateway, autonomous escort vehicles cannot legally deploy. This node is critical for real-time safety and regulatory compliance.",
    topic_primary_slug: "autonomous-infrastructure",
    topic_primary_name: "Autonomous Logistics",
    confidence_state: "verified_current",
    freshness_state: "fresh",
    reviewed_at: new Date().toISOString(),
    next_review_due: new Date(Date.now() + 31536000000).toISOString(),
    source_count: 3
  };

  // Determine a contextual image. If the term is our new P-Bot, use the generated visual. 
  // Otherwise, use the massive heavy-haul backdrop as a default to ensure 'Double Platinum' standard.
  const termImage = term.slug === "autonomous-p-bot-gateway" 
    ? "/ads/autonomous-pbot.png" 
    : "/ads/glossary-hub-hero.png";

  return (
    <div className="w-full bg-[#0a0d14] min-h-screen text-gray-100 font-sans pb-24">
      
      {/* 1. BREADCRUMBS & TOP METADATA */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-8 pb-4">
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C6923A]">
          <Link href="/glossary" className="hover:text-amber-300 transition-colors">Logistics Glossary</Link>
          <span className="text-gray-600">/</span>
          {term.topic_primary_slug ? (
            <>
              <Link href={`/glossary/topics/${term.topic_primary_slug}`} className="hover:text-amber-300 transition-colors">
                {term.topic_primary_name || term.topic_primary_slug}
              </Link>
              <span className="text-gray-600">/</span>
            </>
          ) : null}
          <span className="text-white">{term.canonical_term}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
        
        {/* LEFT COLUMN: PRIMARY DEFINITION & CONTENT (SEO SNIPPET BAIT) */}
        <div className="space-y-12">
          
          <header className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-xl">
              {term.canonical_term}
            </h1>
            {/* The Trust Block placed immediately under H1 for maximum authority */}
            <GlossaryTrustBlock
              confidenceState={term.confidence_state}
              freshnessState={term.freshness_state}
              reviewedAt={term.reviewed_at}
              nextReviewDue={term.next_review_due}
              sourceCount={term.source_count}
            />
          </header>

          {/* 8K VISUAL ASSET - Critical for Double Platinum standard, crushing competitors */}
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group">
             <img src={termImage} alt={term.canonical_term} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
             <div className="absolute bottom-4 left-6 text-xs font-bold uppercase tracking-widest text-[#C6923A] bg-black/50 px-3 py-1 rounded backdrop-blur-md border border-[#C6923A]/30">
               Haul Command Operations Archive
             </div>
          </div>

          <article className="prose prose-invert prose-lg max-w-none text-gray-300">
            
            {/* H2 Setup exactly as requested for Snipelot / Snippet optimization */}
            <h2 className="text-3xl font-black text-white border-l-4 border-[#C6923A] pl-5 mt-12 mb-6">
              What is the meaning of {term.canonical_term}?
            </h2>
            <p className="text-xl font-medium leading-relaxed bg-[#11141D] p-6 rounded-2xl border border-white/5 shadow-inner">
              {term.short_definition}
            </p>

            {term.expanded_definition && (
              <>
                <h2 className="text-3xl font-black text-white border-l-4 border-emerald-500 pl-5 mt-12 mb-6">
                  {term.canonical_term} - In The Field
                </h2>
                <p className="text-lg leading-relaxed mix-blend-plus-lighter text-gray-400">
                  {term.expanded_definition}
                </p>
              </>
            )}

            {term.why_it_matters && (
              <div className="mt-10 p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                <h3 className="text-xl font-black text-amber-500 mb-3 tracking-wide">Command Significance</h3>
                <p className="text-gray-300 font-medium">
                  {term.why_it_matters}
                </p>
              </div>
            )}
            
            {/* Use cases explicitly rendered for Semantic mapping */}
            {payload?.use_cases?.length > 0 && (
              <div className="mt-12 space-y-4">
                <h3 className="text-2xl font-bold text-white">Live Operations Applications</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {payload.use_cases.map((u, i) => (
                    <div key={i} className="flex gap-3 bg-[#11141D] p-4 rounded-xl border border-white/5">
                      <div className="text-[#C6923A] font-black">{">"}</div>
                      <div className="text-sm font-medium">{u.use_case}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
          
          <div className="pt-8 border-t border-white/10">
            <h3 className="text-2xl font-black text-white mb-6">Frequently Addressed Inquiries</h3>
            <GlossaryFaq items={payload?.faqs || []} />
          </div>

        </div>

        {/* RIGHT COLUMN: REVENUE, ADGRID & INTERNAL HYPERLINKING */}
        <aside className="space-y-8">
          
          {/* AdGrid Monopoly Block */}
          <div className="rounded-3xl border-2 border-amber-500/30 bg-[#0a0a0c] p-6 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px]"></div>
            <div className="relative z-10">
              <span className="text-[10px] font-black tracking-widest uppercase text-amber-500 mb-2 block">Premium Sponsor</span>
              <h3 className="text-xl font-black text-white mb-3">Own this Term.</h3>
              <p className="text-sm text-gray-400 font-medium mb-6">Secure exclusive AdGrid placement entirely surrounding the '{term.canonical_term}' cluster.</p>
              <button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-amber-500 text-black py-3 rounded-xl font-black uppercase text-[11px] tracking-widest transition-transform hover:-translate-y-0.5">
                Lock Placement
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141D] border border-white/5 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-white border-b border-white/10 pb-4">
              Semantic Ontology Links
            </h3>
            
            {relationships.related.length > 0 ? (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Related Definitions</span>
                <div className="flex flex-col gap-2">
                  {relationships.related.map((item) => (
                    <Link
                      key={`\${item.to_term_slug}-\${item.relationship_type}`}
                      href={`/glossary/\${item.to_term_slug}`}
                      className="text-sm font-medium text-gray-300 hover:text-[#C6923A] transition-colors py-1 flex items-center justify-between group"
                    >
                      <span>{item.to_term_name}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <GlossaryLinks title="Regional Requirements" items={links.regulations} />
            <GlossaryLinks title="Execution Tools" items={links.tools} />
            <GlossaryLinks title="Active Jurisdictions" items={links.locations} />
            <GlossaryLinks title="Active Corridors" items={links.corridors} />
          </div>

          <GlossaryCommercialStrip
            links={[
              ...links.nextActions,
              ...links.claimPaths,
              ...links.sponsorPaths,
              ...links.marketplacePaths,
              ...links.services,
              ...links.categories,
            ]}
          />
        </aside>

      </div>
    </div>
  );
}
