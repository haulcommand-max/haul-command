import React from "react";
import Link from "next/link";
import Image from "next/image";
import { TrustStrip, IntentMonetizationSurface } from "@/components/ui/intent-blocks";
import { Button } from "@/components/ui/Button";
import { Search, Filter, ArrowRight, ChevronRight, BarChart3, ShieldCheck, MapPin, Clock } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Heavy Haul Intelligence & Escort Regulations | Haul Command',
  description: 'The authoritative source for oversize load logistics. Live corridor intelligence, escort vehicle regulations, rate benchmarks, and operational newsroom.',
  alternates: {
    canonical: 'https://www.haulcommand.com/blog',
  },
  openGraph: {
    title: 'Heavy Haul Intelligence & Escort Regulations',
    description: 'The authoritative source for oversize load logistics. Live corridor intelligence and escort vehicle regulations.',
    url: 'https://www.haulcommand.com/blog',
    images: [{ url: '/images/blog/heavy_haul_hero.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heavy Haul Intelligence | Haul Command',
    description: 'The authoritative source for oversize load logistics. Live corridor intelligence and escort vehicle regulations.',
    images: ['/images/blog/heavy_haul_hero.png'],
  }
};

const getSeedArticles = () => [
  {
    slug: "2026-escort-requirements-by-state",
    title: "2026 Escort Requirements by State — What Changed",
    deck: "Side-by-side regulatory changes across all 50 states including new curfew exceptions and equipment mandates.",
    article_type: "Regulation Update",
    type_color: "text-red-500 bg-red-500/10 border-red-500/20",
    country_code: "US",
    published_at: "Apr 07, 2026",
    read_time: "8 min read",
    thumbnail: "/images/blog/featured_article_thumb.png",
  },
  {
    slug: "i-10-corridor-intelligence-q2-2026",
    title: "I-10 Corridor Intelligence Report — Q2 2026",
    deck: "Live rate benchmarks, escort supply density, and regulatory choke points across America's most trafficked heavy haul corridor.",
    article_type: "Corridor Intel",
    type_color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    country_code: "US",
    published_at: "Apr 05, 2026",
    read_time: "5 min read",
    thumbnail: "/images/blog/heavy_haul_hero.png",
  },
  {
    slug: "how-to-start-pilot-car-business-2026",
    title: "How to Start a Pilot Car Business in 2026",
    deck: "Complete operational playbook. Equipment, certifications, insurance, Haul Command listing, and first-job acquisition strategy.",
    article_type: "Operations Guide",
    type_color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    country_code: "US",
    published_at: "Apr 03, 2026",
    read_time: "12 min read",
    thumbnail: "/images/blog/featured_article_thumb.png",
  },
  {
    slug: "heavy-haul-rate-index-live-benchmark",
    title: "Heavy Haul Rate Index — Live Benchmark Data",
    deck: "Per-mile escort rates by state, corridor, and role type. Updated weekly from platform transaction data.",
    article_type: "Market Data",
    type_color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    country_code: "US",
    published_at: "Apr 01, 2026",
    read_time: "4 min read",
    thumbnail: "/images/blog/heavy_haul_hero.png",
  },
  {
    slug: "autonomous-freight-escort-requirements",
    title: "Autonomous Freight Escort Requirements",
    deck: "Federal and state-level requirements for escorting autonomous and remote-assist freight vehicles.",
    article_type: "Emerging Sector",
    type_color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    country_code: "US",
    published_at: "Mar 28, 2026",
    read_time: "6 min read",
    thumbnail: "/images/blog/featured_article_thumb.png",
  },
  {
    slug: "bridge-collapse-supply-chain-impact",
    title: "Bridge Reroutes & Heavy Haul Delays Analysis",
    deck: "Detailed analysis on how recent infrastructure collapses are impacting regional superload routing and escort availability.",
    article_type: "Corridor Intel",
    type_color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    country_code: "US",
    published_at: "Mar 25, 2026",
    read_time: "7 min read",
    thumbnail: "/images/blog/heavy_haul_hero.png",
  }
];

export default function BlogHub() {
  const articles = getSeedArticles();
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);
  const gridArticles = articles.slice(3);

  // Generate structured data
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
    <div className="flex flex-col min-h-[100dvh] bg-[#030303] text-gray-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Premium Hero Section */}
      <section className="relative w-full overflow-hidden min-h-[60vh] flex items-center pt-24 pb-16">
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/images/blog/heavy_haul_hero.png"
            alt="Heavy Haul Command Center Background"
            fill
            priority
            className="object-cover object-center opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">OS</Link>
            <span>/</span>
            <span className="text-yellow-500">Intelligence Hub</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Market Intelligence</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6" data-speakable="true">
              The Heavy Haul <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200">Intelligence Hub.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl font-medium" data-speakable="true">
              Real-time regulation updates, live corridor pricing analysis, and operational guides for oversize load professionals. Built for the route, not the noise.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="primary">
                Browse Latest Reports
              </Button>
              <Link href="/tools/rate-advisor" className="inline-flex items-center justify-center font-semibold transition-all duration-200 tracking-wide bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 shadow-[0_4px_14px_0_rgba(255,255,255,0.05)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] h-14 rounded-2xl px-10 text-base">
                View Live Corridor Rates <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Stats Strip */}
      <section className="relative z-20 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-16">
        <TrustStrip
          confidenceLevel="verified_current"
          lastVerifiedAt={new Date().toISOString().split('T')[0]}
          metrics={{ verifiedCount: 5214, activeLoads: 312 }}
        />
      </section>

      {/* Featured Zone */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feature */}
          <Link href={`/blog/${featuredArticle.slug}`} className="group relative block w-full lg:w-2/3 h-[500px] lg:h-[600px] overflow-hidden rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 transform md:hover:-translate-y-1 bg-[#0a0a0a]">
            <Image
              src={featuredArticle.thumbnail}
              alt={featuredArticle.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${featuredArticle.type_color}`}>
                  {featuredArticle.article_type}
                </span>
                <span className="text-gray-300 text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3 h-3"/> {featuredArticle.read_time}</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors leading-tight">
                {featuredArticle.title}
              </h2>
              <p className="text-gray-300 text-base md:text-lg mb-6 max-w-3xl line-clamp-2">
                {featuredArticle.deck}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {featuredArticle.country_code} Context</span>
                <span>{featuredArticle.published_at}</span>
              </div>
            </div>
          </Link>

          {/* Secondary Features */}
          <div className="flex flex-col gap-6 w-full lg:w-1/3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Trending Briefs</h3>
            </div>
            {secondaryArticles.map((article) => (
              <Link key={article.slug} href={`/blog/${article.slug}`} className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-[#080808] border border-white/5 hover:border-white/10 transition-all p-5 hover:bg-[#0c0c0c]">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${article.type_color}`}>
                    {article.article_type}
                  </span>
                  <span className="text-gray-500 text-[10px] uppercase font-bold">{article.published_at}</span>
                </div>
                <h4 className="text-lg font-bold text-gray-100 mb-2 group-hover:text-yellow-400 transition-colors leading-snug">
                  {article.title}
                </h4>
                <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                  {article.deck}
                </p>
                <div className="mt-auto flex items-center text-xs font-semibold text-gray-500">
                  <Clock className="w-3.5 h-3.5 mr-1.5"/> {article.read_time}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Discovery / Filters */}
      <section className="border-y border-white/5 bg-[#050505] py-6 sticky top-[52px] md:top-[64px] z-30 backdrop-blur-xl mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search regulations, markets, guides..." 
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
            />
          </div>
          <div className="w-full sm:w-auto flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {['All', 'Regulations', 'Market Intel', 'Guides'].map((label, idx) => (
              <button key={label} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${idx === 0 ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-[#0a0a0a] text-gray-400 border-white/10 hover:bg-white/5 hover:text-white'}`}>
                {label}
              </button>
            ))}
            <button className="whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#0a0a0a] text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white flex items-center gap-2 ml-auto">
              <Filter className="w-3.5 h-3.5" /> Regions
            </button>
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-24">
        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          Latest Intelligence <span className="bg-yellow-500 text-black text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">New</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {gridArticles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="group flex flex-col bg-[#050505] rounded-2xl border border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#0c0c0c]">
                <Image
                  src={article.thumbnail}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest border backdrop-blur-md bg-black/60 ${article.type_color.replace('bg-', 'dummy-')}`}>
                    {article.article_type}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">{article.published_at}</span>
                  <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> {article.read_time}</span>
                </div>
                <h4 className="text-xl font-bold text-gray-100 mb-3 group-hover:text-yellow-400 transition-colors leading-snug">
                  {article.title}
                </h4>
                <p className="text-sm text-gray-400 line-clamp-3 mb-6 flex-1">
                  {article.deck}
                </p>
                <div className="flex items-center text-yellow-500 text-xs font-bold uppercase tracking-wider mt-auto group-hover:translate-x-1 transition-transform">
                  Read Report <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Internal Link Clustering Module */}
      <section className="bg-[#050505] py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-2">Explore Haul Command Systems</h2>
            <p className="text-gray-400 font-medium max-w-2xl mx-auto">Connect intelligence directly to tools and operators in your immediate coverage area.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center sm:text-left">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Compliance</h4>
              <ul className="space-y-3">
                <li><Link href="/regulations" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">State Regulations</Link></li>
                <li><Link href="/resources/certification/state-pilot-car-certifications" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Certification Hub</Link></li>
                <li><Link href="/tools/permit-calculator" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Permit Calculator</Link></li>
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Network</h4>
              <ul className="space-y-3">
                <li><Link href="/directory" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Pilot Car Directory</Link></li>
                <li><Link href="/loads" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Oversize Load Board</Link></li>
                <li><Link href="/corridor" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Corridor Network</Link></li>
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Tools</h4>
              <ul className="space-y-3">
                <li><Link href="/rates" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Rate Benchmarks</Link></li>
                <li><Link href="/map" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Live Map</Link></li>
                <li><Link href="/estimate" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Instant Quote Tool</Link></li>
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Growth</h4>
              <ul className="space-y-3">
                <li><Link href="/claim" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Claim Your Business</Link></li>
                <li><Link href="/advertise" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Advertise Operations</Link></li>
                <li><Link href="/data" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors block">Data Products</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Monetization / CTA Band */}
      <section className="py-10 bg-gradient-to-r from-yellow-900/20 via-yellow-600/10 to-yellow-900/20 border-t border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Build Your Authority in Heavy Haul</h3>
            <p className="text-gray-400 text-sm max-w-xl">Claim your firm's profile to appear on route searches, or sponsor our intelligence hub to reach 10,000+ active operators and brokers daily.</p>
          </div>
          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
            <Link href="/claim" className="inline-flex items-center justify-center font-semibold transition-all duration-200 tracking-wide border-2 border-slate-700 bg-transparent text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 h-12 px-6 rounded-xl text-[15px] w-full sm:w-auto">
              Claim Business Page
            </Link>
            <Link href="/advertise" className="inline-flex items-center justify-center font-semibold transition-all duration-200 tracking-wide bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-[0_4px_14px_0_rgba(234,179,8,0.39)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.23)] hover:scale-[1.02] border border-yellow-400/50 h-12 px-6 rounded-xl text-[15px] w-full sm:w-auto truncate">
              Sponsor Reports
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
