import React from "react";
import Link from "next/link";
import { TrustStrip, AnswerBlock, ActionBlock, IntentRouter, MarketSurface, IntentMonetizationSurface, MasterIntent } from "@/components/ui/intent-blocks";
import type { Metadata } from 'next';
import { ArrowLeft, Clock, MapPin, Share2, Facebook, Twitter, Linkedin, Building2 } from "lucide-react";
import { BlogAnalyticsTrigger } from "@/components/analytics/BlogAnalyticsTrigger";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import { HCContentPageShell, HCContentReadingContainer, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { HCEditorialHero } from "@/components/content-system/heroes/HCEditorialHero";
import { HCContentCard } from "@/components/content-system/cards/HCContentCard";

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
      images: [{ url: article.hero_image_url || '/images/blog_hero_bg.png', width: 1200, height: 630 }],
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
      article.hero_image_url || "https://www.haulcommand.com/images/blog_hero_bg.png"
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
    <HCContentPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <HCEditorialHero
        eyebrow="Corridor Intel"
        title={displayTitle}
        imageUrl={article.hero_image_url || "/images/blog_hero_bg.png"}
        overlayOpacity="heavy"
        metaRow={
            <div className="flex flex-wrap items-center gap-4 text-[#9CA3AF] text-sm font-medium mt-4">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> 6 min read</span>
                <span className="w-1 h-1 rounded-full bg-[#4B5563]"></span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> US Context</span>
                <span className="w-1 h-1 rounded-full bg-[#4B5563]"></span>
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4"/> Haul Command Intel Desk</span>
            </div>
        }
      >
        <TrustStrip
          confidenceLevel="verified_current"
          lastVerifiedAt={new Date().toISOString().split('T')[0]}
          officialSourceName="Haul Command Intelligence Desk"
        />
      </HCEditorialHero>

      <HCContentSection pad="section_compact_pad">
        <HCContentReadingContainer>
          <div className="mb-10 text-sm font-bold uppercase tracking-widest text-[#B0B8C4] flex items-center space-x-2">
            <Link href="/" className="hover:text-white transition">OS</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition">Blog</Link>
            <span>/</span>
            <span className="text-[#C6923A] truncate max-w-[150px]">{displayTitle}</span>
          </div>

          <BlogAnalyticsTrigger eventName="article_view" properties={{ slug: params.slug }}>
          <article className="prose prose-invert prose-lg max-w-none text-[#B0B8C4] font-medium leading-relaxed mb-16 prose-a:text-[#C6923A] prose-a:no-underline hover:prose-a:text-[#8A6428]">
            {/* Answer Block (Quick Answer for UI & Scraping) */}
            {article.quick_answer_block && (
              <div className="not-prose mb-12">
                <AnswerBlock
                  queryTitle="Executive Summary"
                  quickSummaryMarkdown={JSON.parse(article.quick_answer_block).answer || article.excerpt}
                  detailedContentMarkdown={JSON.parse(article.quick_answer_block).question || "Key takeaways from this report."}
                />
              </div>
            )}
            
            <div dangerouslySetInnerHTML={{ __html: article.content_html || "<p>No content available.</p>" }} />
          </article>
          </BlogAnalyticsTrigger>

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
          <div className="mb-16 bg-[#111214] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#E0B05C] mb-6">Explore Haul Command Hubs</h3>
            <IntentRouter availableIntents={sidebarIntents} />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-[rgba(255,255,255,0.05)]">
              <Link href="/rates" className="text-[#9CA3AF] hover:text-white transition-colors text-sm font-medium">💵 Live Rate Data</Link>
              <Link href="/tools/permit-calculator" className="text-[#9CA3AF] hover:text-white transition-colors text-sm font-medium">🧮 Permit Tools</Link>
              <Link href="/glossary" className="text-[#9CA3AF] hover:text-white transition-colors text-sm font-medium">📖 Term Glossary</Link>
              <Link href="/loads" className="text-[#9CA3AF] hover:text-white transition-colors text-sm font-medium">📋 Load Board</Link>
            </div>
          </div>

          {/* Share & Related Intel */}
          <footer className="border-t border-[rgba(255,255,255,0.05)] pt-10 flex flex-col md:flex-row gap-12 justify-between">
            <div className="flex-1">
              <h3 className="text-[13px] font-bold text-[#B0B8C4] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4"/> Share Insight
              </h3>
              <div className="flex gap-3">
                <button className="p-2.5 rounded-xl bg-[#16181B] border border-[#23262B] hover:border-[rgba(255,255,255,0.18)] text-[#9CA3AF] hover:text-white transition-colors"><Twitter className="w-4 h-4"/></button>
                <button className="p-2.5 rounded-xl bg-[#16181B] border border-[#23262B] hover:border-[rgba(255,255,255,0.18)] text-[#9CA3AF] hover:text-white transition-colors"><Linkedin className="w-4 h-4"/></button>
                <button className="p-2.5 rounded-xl bg-[#16181B] border border-[#23262B] hover:border-[rgba(255,255,255,0.18)] text-[#9CA3AF] hover:text-white transition-colors"><Facebook className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="flex-[2]">
              <h3 className="text-[13px] font-bold text-[#B0B8C4] uppercase tracking-widest mb-4">Related Intelligence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["2026-escort-requirements", "heavy-haul-rate-index"].map(slug => (
                  <Link key={slug} href={`/blog/${slug}`} className="bg-[#16181B] hover:bg-[#1E2028] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 transition-all hover:-translate-y-0.5 group">
                    <h4 className="text-sm font-bold text-[#F3F4F6] group-hover:text-[#E0B05C] transition-colors leading-tight capitalize">
                      {slug.replace(/-/g, " ")}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          </footer>

        </HCContentReadingContainer>
      </HCContentSection>
    </HCContentPageShell>
  );
}
