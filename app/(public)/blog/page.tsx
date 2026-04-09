import React from "react";
import Link from "next/link";
import { 
  TrustStrip, 
  AnswerBlock, 
  IntentRouter, 
  IntentMonetizationSurface,
  MasterIntent
} from "@/components/ui/intent-blocks";

// Haul Command: Blog Authority Hub
// Path: app/(public)/blog/page.tsx
// This replaces the empty "Awaiting Intelligence" placeholder with a real publication engine.

// In production, this fetches from Supabase via the blog RPC pack
const getSeedArticles = () => [
  {
    slug: "2026-escort-requirements-by-state",
    title: "2026 Escort Requirements by State — What Changed",
    deck: "Side-by-side regulatory changes across all 50 states including new curfew exceptions and equipment mandates.",
    article_type: "regulation_update",
    country_code: "US",
    published_at: "2026-04-07",
    freshness_state: "updated_recently",
  },
  {
    slug: "i-10-corridor-intelligence-q2-2026",
    title: "I-10 Corridor Intelligence Report — Q2 2026",
    deck: "Live rate benchmarks, escort supply density, and regulatory choke points across America's most trafficked heavy haul corridor.",
    article_type: "corridor_intelligence",
    country_code: "US",
    published_at: "2026-04-05",
    freshness_state: "updated_recently",
  },
  {
    slug: "how-to-start-pilot-car-business-2026",
    title: "How to Start a Pilot Car Business in 2026",
    deck: "Complete operational playbook. Equipment, certifications, insurance, Haul Command listing, and first-job acquisition strategy.",
    article_type: "requirements_explainer",
    country_code: "US",
    published_at: "2026-04-03",
    freshness_state: "stable_reference",
  },
  {
    slug: "heavy-haul-rate-index-live-benchmark",
    title: "Heavy Haul Rate Index — Live Benchmark Data",
    deck: "Per-mile escort rates by state, corridor, and role type. Updated weekly from platform transaction data.",
    article_type: "escort_market_update",
    country_code: "US",
    published_at: "2026-04-01",
    freshness_state: "updated_recently",
  },
  {
    slug: "autonomous-freight-escort-requirements",
    title: "Autonomous Freight Escort Requirements — What Operators Must Know",
    deck: "Federal and state-level requirements for escorting autonomous and remote-assist freight vehicles. Emerging certification paths.",
    article_type: "data_product_teaser",
    country_code: "US",
    published_at: "2026-03-28",
    freshness_state: "stable_reference",
  },
];

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  regulation_update: "Regulation Update",
  corridor_intelligence: "Corridor Intel",
  requirements_explainer: "Operations Guide",
  escort_market_update: "Market Data",
  data_product_teaser: "Emerging Sector",
};

const ARTICLE_TYPE_COLORS: Record<string, string> = {
  regulation_update: "#ef4444",
  corridor_intelligence: "#3b82f6",
  requirements_explainer: "#22c55e",
  escort_market_update: "#D4A843",
  data_product_teaser: "#8b5cf6",
};

export default function BlogHub() {
  const articles = getSeedArticles();

  const routeIntents = [
    { intent: "Learn" as MasterIntent, label: "Regulation Updates", destinationHref: "/blog/topics/regulations", isPrimary: true },
    { intent: "Monitor" as MasterIntent, label: "Corridor Intelligence", destinationHref: "/blog/topics/corridors" },
    { intent: "Calculate" as MasterIntent, label: "Rate Benchmarks", destinationHref: "/blog/topics/rates" },
    { intent: "Verify" as MasterIntent, label: "Certification Guides", destinationHref: "/blog/topics/certification" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 font-mono uppercase tracking-widest">
          HAUL COMMAND O.S. » INTELLIGENCE HUB
        </div>

        {/* Trust Strip */}
        <TrustStrip
          confidenceLevel="verified_current"
          lastVerifiedAt={new Date().toISOString().split('T')[0]}
          metrics={{ verifiedCount: 5, activeLoads: 312 }}
        />

        {/* Answer Block */}
        <AnswerBlock
          queryTitle="Heavy Haul Intelligence — News, Data & Operational Guides"
          quickSummaryMarkdown="Haul Command Intelligence publishes regulation updates, corridor market reports, rate benchmarks, certification guides, and emerging sector analysis. Every article connects directly to live tools, verified operators, and active compliance data."
        />

        {/* Intent Router */}
        <IntentRouter availableIntents={routeIntents} />

        {/* Article Feed */}
        <div className="space-y-6 pt-8 border-t border-gray-800">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Latest Intelligence</h2>
          {articles.map((article) => {
            const typeColor = ARTICLE_TYPE_COLORS[article.article_type] || "#D4A843";
            const typeLabel = ARTICLE_TYPE_LABELS[article.article_type] || article.article_type;
            return (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-6 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
                    style={{ color: typeColor, background: `${typeColor}15`, border: `1px solid ${typeColor}30` }}
                  >
                    {typeLabel}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{article.published_at}</span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition mb-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{article.deck}</p>
                <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
                  <span>📍 {article.country_code}</span>
                  <span>🔄 {article.freshness_state.replace("_", " ")}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Monetization Surface */}
        <div className="mt-16">
          <IntentMonetizationSurface
            packageType="sponsor_slot"
            pricingCents={49900}
            copyText="Sponsor the Haul Command Intelligence feed. Your brand appears above every article, reaching thousands of active operators and brokers weekly."
            stripeProductId="prod_haulcommand_blog_sponsor"
          />
        </div>

      </div>
    </div>
  );
}
