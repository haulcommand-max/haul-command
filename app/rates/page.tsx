import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PaywallGateBanner } from '@/components/monetization/PaywallBanner';


const COUNTRIES = [
  { code: 'us', name: 'United States', flag: '\ud83c\uddfa\ud83c\uddf8', currency: 'USD', symbol: '$', avgRate: '450-650' },
  { code: 'ca', name: 'Canada', flag: '\ud83c\udde8\ud83c\udde6', currency: 'CAD', symbol: 'C$', avgRate: '500-700' },
  { code: 'au', name: 'Australia', flag: '\ud83c\udde6\ud83c\uddfa', currency: 'AUD', symbol: 'A$', avgRate: '600-900' },
  { code: 'gb', name: 'United Kingdom', flag: '\ud83c\uddec\ud83c\udde7', currency: 'GBP', symbol: '\u00a3', avgRate: '350-550' },
  { code: 'nz', name: 'New Zealand', flag: '\ud83c\uddf3\ud83c\uddff', currency: 'NZD', symbol: 'NZ$', avgRate: '500-750' },
  { code: 'za', name: 'South Africa', flag: '\ud83c\uddff\ud83c\udde6', currency: 'ZAR', symbol: 'R', avgRate: '3,000-5,000' },
  { code: 'de', name: 'Germany', flag: '\ud83c\udde9\ud83c\uddea', currency: 'EUR', symbol: '\u20ac', avgRate: '400-650' },
  { code: 'nl', name: 'Netherlands', flag: '\ud83c\uddf3\ud83c\uddf1', currency: 'EUR', symbol: '\u20ac', avgRate: '380-550' },
  { code: 'ae', name: 'UAE', flag: '\ud83c\udde6\ud83c\uddea', currency: 'AED', symbol: 'AED', avgRate: '1,500-2,500' },
  { code: 'br', name: 'Brazil', flag: '\ud83c\udde7\ud83c\uddf7', currency: 'BRL', symbol: 'R$', avgRate: '1,200-2,000' },
];

export const metadata = {
  title: 'Pilot Car Rates & Escort Vehicle Pricing | Haul Command',
  description:
    'Real-time pilot car rates and escort vehicle pricing across all 50 states. Cost per mile, day rates, and market intelligence for heavy haul transport.',
  keywords: [
    'pilot car rates',
    'escort vehicle cost per mile',
    'pilot car pricing',
    'how much does a pilot car cost',
    'escort vehicle rates by state',
    'heavy haul rates',
    'oversize load escort cost',
  ],
  openGraph: {
    title: 'Pilot Car Rates & Escort Vehicle Pricing | Haul Command',
    description: 'Real-time pilot car rates and market intelligence for heavy haul transport.',
    url: 'https://haulcommand.com/rates',
  },
  alternates: {
    canonical: 'https://haulcommand.com/rates',
  },
};

export const RATES_JSONLD = `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Pilot Car Rates & Escort Vehicle Pricing",
  "url": "https://haulcommand.com/rates",
  "description": "Real-time pilot car rates and escort vehicle pricing across all 50 US states.",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://haulcommand.com" },
      { "@type": "ListItem", "position": 2, "name": "Pilot Car Rates", "item": "https://haulcommand.com/rates" }
    ]
  }
}`;

export default async function RatesPage() {
  return (
    <div className=" bg-[#0a0a0a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: RATES_JSONLD }} />
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Pilot Car & Escort Vehicle Rates \u2014 2026
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Current day rates across active markets. Data sourced from Haul Command\u2019s global heavy haul intelligence network.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-4 pt-0">
        <PaywallGateBanner
          surfaceName="Rates Intelligence"
          tier="Pro"
          description="Unlock full corridor rate intelligence and per-mile benchmarks across active markets."
        />
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {COUNTRIES.map((country) => (
            <Link aria-label="Navigation Link"
              key={country.code}
              href={`/rates/${country.code}`}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{country.flag}</span>
                <div>
                  <h2 className="text-lg font-bold group-hover:text-amber-400 transition-colors">{country.name}</h2>
                  <span className="text-xs text-gray-500">{country.currency}</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-500">Average Day Rate</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {country.symbol}{country.avgRate}
                  </p>
                </div>
                <span className="text-gray-500 group-hover:text-amber-400 transition-colors">View details \u2192</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Rates vary by corridor, load type, and season.</p>
          <Link aria-label="Navigation Link"
            href="/loads"
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-colors"
          >
            See Current Loads & Rates
          </Link>
        </div>
      </section>
    </div>
  );
}