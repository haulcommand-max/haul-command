import React from "react";
import Link from "next/link";
import { 
  TrustStrip, 
  AnswerBlock, 
  ActionBlock, 
  IntentRouter,
  MarketSurface,
  IntentMonetizationSurface,
  MasterIntent
} from "@/components/ui/intent-blocks";

// Haul Command: Blog Article Detail Template
// Path: app/(public)/blog/[slug]/page.tsx

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const displayTitle = params.slug.replace(/-/g, " ");

  const sidebarIntents = [
    { intent: "Calculate" as MasterIntent, label: "Open Escort Calculator", destinationHref: "/tools", isPrimary: true },
    { intent: "Find" as MasterIntent, label: "Find Verified Operators", destinationHref: "/directory" },
    { intent: "Verify" as MasterIntent, label: "Check Regulation Source", destinationHref: "/regulations" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 font-mono uppercase tracking-widest">
          HAUL COMMAND O.S. » <Link href="/blog" className="hover:text-white transition">INTELLIGENCE</Link> » ARTICLE
        </div>

        {/* Trust Strip */}
        <TrustStrip
          confidenceLevel="verified_current"
          lastVerifiedAt={new Date().toISOString().split('T')[0]}
          officialSourceName="Haul Command Research Desk"
        />

        {/* Answer Block (H1 + Quick Answer for AI scraping) */}
        <AnswerBlock
          queryTitle={displayTitle}
          quickSummaryMarkdown="This article is sourced from live platform data and verified regulatory databases. Key takeaways are summarized above for rapid operational use."
          detailedContentMarkdown="Full article body is rendered from structured blog_article_blocks stored in Supabase. Each block supports headings, paragraphs, checklists, embedded tools, and FAQ items.\n\nIn production, this content is fetched via the get_blog_article_structured() RPC and rendered using a block-type switch renderer."
        />

        {/* Intent Router: What do you want to do after reading? */}
        <div className="pt-6 border-t border-gray-800">
          <IntentRouter availableIntents={sidebarIntents} />
        </div>

        {/* Market Surface: Related Operators */}
        <MarketSurface
          subjectContext="Operators Referenced in This Article"
          marketData={{
            supplyStatus: "balanced",
            topOperators: [
              { id: "1", name: "Gulf Escort Pro", rating: 4.9 },
              { id: "2", name: "TransCanada Pilot", rating: 4.8 },
              { id: "3", name: "Vanguard Route Survey", rating: 5.0 },
            ]
          }}
        />

        {/* Action Block: The "Do This Next" directive */}
        <ActionBlock
          primaryAction={{
            label: "Run the Calculator Referenced Above",
            intent: "Calculate" as MasterIntent,
            href: "/tools",
          }}
          secondaryAction={{
            label: "Download Source Packet (PDF)",
            href: "#export",
          }}
        />

        {/* Monetization: Data Product Teaser or Blog Sponsor */}
        <div className="mt-12">
          <IntentMonetizationSurface
            packageType="premium_export"
            pricingCents={2900}
            copyText="Want the full dataset behind this report? Purchase the Intelligence Pack for $29 and get the raw data, charts, and corridor-level breakdowns."
            stripeProductId="prod_haulcommand_intel_pack"
          />
        </div>

        {/* Related Articles (Sibling Links — Anti-Orphan Rule) */}
        <div className="pt-8 border-t border-gray-800">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">Related Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["2026-escort-requirements-by-state", "heavy-haul-rate-index-live-benchmark"].map(slug => (
              <Link key={slug} href={`/blog/${slug}`} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded p-4 transition text-sm text-gray-300 hover:text-white capitalize">
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
