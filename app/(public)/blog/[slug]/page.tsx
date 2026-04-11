import React from "react";
import Link from "next/link";
import { TrustStrip, AnswerBlock, ActionBlock, IntentRouter, MarketSurface, IntentMonetizationSurface, MasterIntent } from "@/components/ui/intent-blocks";
import type { Metadata } from 'next';
import { ArrowLeft, Clock, MapPin, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { BlogAnalyticsTrigger } from "@/components/analytics/BlogAnalyticsTrigger";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: article } = await supabase.from('hc_blog_articles').select('title, excerpt, hero_image_url').eq('slug', params.slug).single();
  
  if (!article) return { title: 'Not Found' };

  return {
    title: `${article.title} | Haul Command Intelligence`,
    description: article.excerpt || `Heavy haul intelligence report. Sourced from platform data and verified regulations.`,
    alternates: {
      canonical: `https://www.haulcommand.com/blog/${params.slug}`,
    },
    openGraph: {
      title: `${article.title} | Haul Command`,
      description: article.excerpt || `Heavy haul intelligence report.`,
      images: [{ url: article.hero_image_url || '/images/blog/heavy_haul_hero.png', width: 1200, height: 630 }],
    },
  };
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: article } = await supabase.from('hc_blog_articles').select('*').eq('slug', params.slug).single();

  if (!article) {
    notFound();
  }

  const displayTitle = article.title;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": displayTitle,
    "image": [
      article.hero_image_url || "https://www.haulcommand.com/images/blog/heavy_haul_hero.png"
    ],
    "datePublished": article.published_at || new Date().toISOString().split('T')[0],
    "dateModified": new Date().toISOString().split('T')[0],
    "author": [{
      "@type": "Organization",
      "name": "Haul Command Intelligence",
      "url": "https://www.haulcommand.com"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "Haul Command",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.haulcommand.com/logo.png"
      }
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.haulcommand.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Intelligence Hub",
        "item": "https://www.haulcommand.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": displayTitle,
        "item": `https://www.haulcommand.com/blog/${params.slug}`
      }
    ]
  };

  const sidebarIntents = [
    { intent: "Calculate" as MasterIntent, label: "Open Escort Calculator", destinationHref: "/tools", isPrimary: true },
    { intent: "Find" as MasterIntent, label: "Search Pilot Car Directory", destinationHref: "/directory" },
    { intent: "Verify" as MasterIntent, label: "View Regulation Changes", destinationHref: "/regulations" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#030303] text-gray-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
          <Link href="/blog" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-yellow-500 transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Intelligence Hub
          </Link>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center space-x-2">
            <Link href="/" className="hover:text-white transition">OS</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition">Blog</Link>
            <span>/</span>
            <span className="text-yellow-600 truncate max-w-[150px]">{displayTitle}</span>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-12 border-b border-white/10 pb-10">
          <div className="flex flex-wrap items-center gap-3 w-full mb-6">
             <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md text-blue-500 bg-blue-500/10 border-blue-500/20">
                Corridor Intel
             </span>
             <span className="text-gray-400 text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> 6 min read</span>
             <span className="text-gray-400 text-xs font-semibold flex items-center gap-1.5 ml-auto"><MapPin className="w-3.5 h-3.5"/> US Content</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            {displayTitle}
          </h1>

          {/* Trust Strip */}
          <TrustStrip
            confidenceLevel="verified_current"
            lastVerifiedAt={new Date().toISOString().split('T')[0]}
            officialSourceName="Haul Command Intelligence Desk"
          />
        </header>

        {/* Content Area */}
        <article className="prose prose-invert prose-lg max-w-none text-gray-300 font-medium leading-relaxed mb-16">
          {/* Answer Block (Quick Answer for UI & Scraping) */}
          {article.quick_answer_block && (
            <div className="not-prose mb-8">
              <AnswerBlock
                queryTitle="Executive Summary"
                quickSummaryMarkdown={JSON.parse(article.quick_answer_block).answer || article.excerpt}
                detailedContentMarkdown={JSON.parse(article.quick_answer_block).question || "Key takeaways from this report."}
              />
            </div>
          )}
          
          <div dangerouslySetInnerHTML={{ __html: article.content_html || "<p>No content available.</p>" }} />
        </article>

        {/* Action Block */}
        <div className="mb-12">
          <ActionBlock
            primaryAction={{
              label: "Check State Regulations Pivot",
              intent: "Verify" as MasterIntent,
              href: "/regulations",
            }}
            secondaryAction={{
              label: "Explore Operator Directory",
              href: "/directory",
            }}
          />
        </div>

        {/* Market Surface: Related Operators */}
        <div className="mb-12">
          <MarketSurface
            subjectContext="Active Operators in Affected Corridors"
            marketData={{
              supplyStatus: "balanced",
              topOperators: [
                { id: "1", name: "Apex Heavy Haul Escorts", rating: 4.9 },
                { id: "2", name: "Trans-Continental Pilot", rating: 4.8 },
                { id: "3", name: "Vanguard Route Surveys", rating: 5.0 },
              ]
            }}
          />
        </div>

        {/* Monetization: Data Product Teaser */}
        <div className="mb-16">
          <IntentMonetizationSurface
            packageType="premium_export"
            pricingCents={24900}
            copyText="Access the complete corridor intelligence dataset. Includes raw per-mile escort rate benchmarks, seasonal demand trends, and full regulatory matrices."
            stripeProductId="prod_haulcommand_intel_pack"
          />
        </div>

        {/* Internal Link Explorer */}
        <div className="mb-16 bg-[#0a0a0a] rounded-2xl border border-white/10 p-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500 mb-6">Explore Haul Command Hubs</h3>
          <IntentRouter availableIntents={sidebarIntents} />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <Link href="/rates" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">💵 Live Rate Data</Link>
            <Link href="/tools/permit-calculator" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">🧮 Permit Tools</Link>
            <Link href="/glossary" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">📖 Term Glossary</Link>
            <Link href="/loads" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">📋 Load Board</Link>
          </div>
        </div>

        {/* Share & Related Intel */}
        <footer className="border-t border-white/10 pt-10 flex flex-col md:flex-row gap-12 justify-between">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4"/> Share Insight
            </h3>
            <div className="flex gap-3">
              <button className="p-2.5 rounded-lg bg-[#0a0a0a] border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Twitter className="w-4 h-4"/></button>
              <button className="p-2.5 rounded-lg bg-[#0a0a0a] border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Linkedin className="w-4 h-4"/></button>
              <button className="p-2.5 rounded-lg bg-[#0a0a0a] border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Facebook className="w-4 h-4"/></button>
            </div>
          </div>
          <div className="flex-[2]">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Related Intelligence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["2026-escort-requirements", "heavy-haul-rate-index"].map(slug => (
                <Link key={slug} href={`/blog/${slug}`} className="bg-[#0a0a0a] hover:bg-[#111111] border border-white/10 rounded-xl p-4 transition-all hover:-translate-y-0.5 group">
                  <h4 className="text-sm font-bold text-gray-200 group-hover:text-yellow-400 transition-colors leading-tight capitalize">
                    {slug.replace(/-/g, " ")}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
