import React from "react";
import Link from "next/link";
import { TrustStrip } from "@/components/ui/intent-blocks";
import { Search, Filter, ShieldCheck, Clock, MapPin, ChevronRight, ArrowRight } from "lucide-react";
import type { Metadata } from 'next';
import { BlogAnalyticsTrigger } from "@/components/analytics/BlogAnalyticsTrigger";
import { createClient } from "@/lib/supabase/server";

import { HCContentPageShell, HCContentContainer, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { HCEditorialHero } from "@/components/content-system/heroes/HCEditorialHero";
import { HCContentCard } from "@/components/content-system/cards/HCContentCard";
import { HCTopicChip } from "@/components/content-system/chips/HCTopicChip";
import { HCButton } from "@/components/content-system/callouts/HCButton";
import { HCContentEmptyState } from "@/components/content-system/states/HCContentEmptyState";

export const metadata: Metadata = {
  title: 'Heavy Haul Intelligence & Escort Regulations | Haul Command',
  description: 'Verified heavy haul routing intelligence, escort vehicle compliance data, and operational deep-dives across 50 US states and 120 countries.',
  alternates: {
    canonical: 'https://www.haulcommand.com/blog',
  },
  openGraph: {
    title: 'Heavy Haul Intelligence & Escort Regulations',
    description: 'The authoritative source for oversize load logistics. Live corridor intelligence and escort vehicle regulations.',
    url: 'https://www.haulcommand.com/blog',
    images: [{ url: '/images/blog_hero_bg.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heavy Haul Intelligence | Haul Command',
    description: 'The authoritative source for oversize load logistics. Live corridor intelligence and escort vehicle regulations.',
    images: ['/images/blog_hero_bg.png'],
  }
};

async function getArticles() {
  const supabase = createClient();
  const { data: articles, error } = await supabase
    .from('hc_blog_articles')
    .select('slug, title, excerpt, hero_image_url, published_at, schema_markup, visual_assets')
    .order('published_at', { ascending: false });

  if (error || !articles || articles.length === 0) {
    return [
      {
        slug: "texas-superload-strategy-2026",
        title: "Texas Superload Blueprint: Navigating I-10 and I-35 Escort Thresholds in 2026",
        deck: "Analyzing the newly adopted TxDMV routing procedures and how they impact civilian police escort availability and total load economics across the Texas Triangle.",
        article_type: "Corridor Intel",
        thumbnail: "/images/blog_hero_bg.png",
        read_time: "5 min",
        country_code: "US",
        published_at: "Apr 07, 2026",
      },
      {
        slug: "escort-reciprocity-guide",
        title: "Cross-Border Escort Reciprocity: The Pilot Car Certification Matrix",
        deck: "A comprehensive map of which states accept out-of-state pilot car certifications, focusing on the critical Washington-Oregon-California corridor.",
        article_type: "Regulation Monitor",
        thumbnail: "/images/training_hero_bg.png",
        read_time: "8 min",
        country_code: "US",
        published_at: "Apr 06, 2026",
      },
      {
        slug: "q3-rate-report-escorts",
        title: "Q3 2026 Escort Rate Analytics: Surge Pricing on Wind Energy Routes",
        deck: "Real-time pricing data from the Haul Command Terminal showing a 22% rate surge for high-pole escorts on key midwestern wind energy supply chains.",
        article_type: "Market Data",
        thumbnail: "/images/blog_hero_bg.png",
        read_time: "6 min",
        country_code: "US",
        published_at: "Apr 05, 2026",
      },
      {
         slug: "emergency-escort-retention",
         title: "Dispatch Psychology: Retaining Top Escort Vendors in Heat States",
         deck: "When standard loads pivot, high-tier escort operators evaporate. How top brokers use Haul Command Trust Scores to lock in verified capacity.",
         article_type: "Strategic Ops",
         thumbnail: "/images/training_hero_bg.png",
         read_time: "4 min",
         country_code: "US",
         published_at: "Apr 04, 2026",
      }
    ];
  }

  return articles.map((article: any, index: number) => ({
    slug: article.slug,
    title: article.title,
    deck: article.excerpt || "Heavy haul operational intelligence.",
    article_type: index === 0 ? "Corridor Intel" : (index % 2 === 0 ? "Strategic Ops" : "Market Data"),
    thumbnail: article.hero_image_url || "/images/blog_hero_bg.png",
    read_time: "5 min",
    country_code: "US",
    published_at: new Date(article.published_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
  }));
}

export default async function BlogHub() {
  const articles = await getArticles();
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const secondaryArticles = articles.slice(1, 3);
  const gridArticles = articles.slice(3) || [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Haul Command Intelligence",
    "url": "https://www.haulcommand.com/blog",
    "description": "Live corridor intelligence, escort vehicle regulations, rate benchmarks, and operational newsroom.",
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
      }
    ]
  };

  return (
    <HCContentPageShell>
      <BlogAnalyticsTrigger eventName="blog_index_view" properties={{ source: 'public_layout' }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <HCEditorialHero
        eyebrow="Verified Market Intelligence"
        title="The Heavy Haul Intelligence Hub."
        description="Real-time regulation updates, live corridor pricing analysis, and operational guides for oversize load professionals. Built for the route, not the noise."
        imageUrl="/images/blog_hero_bg.png"
        metaRow={
            <div className="flex gap-4">
                <HCButton href="#latest" variant="primary">Browse Reports</HCButton>
                <HCButton href="/tools/rate-advisor" variant="ghost">Live Rates <ArrowRight className="w-4 h-4 ml-2" /></HCButton>
            </div>
        }
      />

      {/* Trust Strip */}
      <div className="relative z-20 -mt-10 px-4 max-w-7xl mx-auto mb-16">
        <TrustStrip
          confidenceLevel="verified_current"
          lastVerifiedAt={new Date().toISOString().split('T')[0]}
          metrics={{ verifiedCount: 5214, activeLoads: 312 }}
        />
      </div>

      <HCContentSection className="mb-16">
        <HCContentContainer>
        {featuredArticle ? (
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/3">
                    <HCContentCard
                        variant="featured"
                        href={`/blog/${featuredArticle.slug}`}
                        title={featuredArticle.title}
                        excerpt={featuredArticle.deck}
                        imageUrl={featuredArticle.thumbnail}
                        topicLabel={featuredArticle.article_type}
                        date={featuredArticle.published_at}
                        readTime={featuredArticle.read_time}
                    />
                </div>
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                        <h3 className="text-[13px] font-bold uppercase tracking-widest text-[#F3F4F6]">Trending Briefs</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                        {secondaryArticles.map((article: any) => (
                            <HCContentCard
                                key={article.slug}
                                variant="rail"
                                href={`/blog/${article.slug}`}
                                title={article.title}
                                topicLabel={article.article_type}
                                date={article.published_at}
                                readTime={article.read_time}
                                excerpt={article.deck}
                            />
                        ))}
                    </div>
                </div>
            </div>
        ) : (
             <HCContentEmptyState />
        )}
        </HCContentContainer>
      </HCContentSection>

      {/* Filter / Search Bar */}
      <div className="sticky top-[64px] z-30 bg-[#0B0B0C]/90 backdrop-blur-xl border-y border-[rgba(255,255,255,0.08)] py-4 mb-20">
        <HCContentContainer>
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input 
                        type="text" 
                        placeholder="Search intelligence..." 
                        className="w-full bg-[#111214] border border-[rgba(255,255,255,0.1)] rounded-full py-3 pl-12 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C6923A]"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    <HCTopicChip label="All Topics" active />
                    <HCTopicChip label="Regulations" />
                    <HCTopicChip label="Corridors" />
                    <HCTopicChip label="Market Data" />
                    <HCTopicChip label="Regions" semanticType="market" />
                </div>
            </div>
        </HCContentContainer>
      </div>

      <HCContentSection id="latest" className="mb-24">
        <HCContentContainer>
            <h3 className="text-2xl font-bold text-[#F3F4F6] mb-8 flex items-center gap-3">
                Latest Publications
            </h3>
            {gridArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gridArticles.map((article: any) => (
                        <HCContentCard
                            key={article.slug}
                            variant="standard"
                            href={`/blog/${article.slug}`}
                            title={article.title}
                            excerpt={article.deck}
                            imageUrl={article.thumbnail}
                            topicLabel={article.article_type}
                            date={article.published_at}
                            readTime={article.read_time}
                        />
                    ))}
                </div>
            ) : (
                <HCContentEmptyState />
            )}
        </HCContentContainer>
      </HCContentSection>

      <HCContentSection className="bg-[#111214] py-20 border-t border-[rgba(255,255,255,0.05)]">
         <HCContentContainer>
            <div className="text-center mb-16">
                 <h2 className="text-2xl lg:text-3xl font-bold text-[#F3F4F6] mb-4">Explore Haul Command Systems</h2>
                 <p className="text-[#9CA3AF] max-w-2xl mx-auto text-lg">Connect intelligence directly to tools and operators in your immediate coverage area.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                     { title: "Compliance", links: [ { t: "State Regulations", u: "/regulations" }, { t: "Certification Hub", u: "/resources" }, { t: "Permit Calc", u: "/tools" } ] },
                     { title: "Network", links: [ { t: "Pilot Car Directory", u: "/directory" }, { t: "Oversize Load Board", u: "/loads" }, { t: "Corridor Maps", u: "/corridors" } ] },
                     { title: "Tools", links: [ { t: "Rate Benchmarks", u: "/rates" }, { t: "Live Map", u: "/map" }, { t: "Quote Tool", u: "/estimate" } ] },
                     { title: "Growth", links: [ { t: "Claim Business", u: "/claim" }, { t: "Advertise", u: "/advertise" }, { t: "Data Products", u: "/data" } ] }
                 ].map(col => (
                     <div key={col.title} className="p-8 rounded-[24px] bg-[#16181B] border border-[rgba(255,255,255,0.05)]">
                         <h4 className="font-bold text-[#F3F4F6] text-[13px] uppercase tracking-widest mb-6">{col.title}</h4>
                         <ul className="space-y-4">
                             {col.links.map(l => (
                                 <li key={l.t}><Link href={l.u} className="text-[#9CA3AF] hover:text-[#C6923A] transition-colors font-medium">{l.t}</Link></li>
                             ))}
                         </ul>
                     </div>
                 ))}
            </div>
         </HCContentContainer>
      </HCContentSection>
    </HCContentPageShell>
  );
}
