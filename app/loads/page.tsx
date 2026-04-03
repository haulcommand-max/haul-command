import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PaywallGateBanner } from '@/components/monetization/PaywallBanner';

export const metadata = {
  title: 'Oversize Load Board — Post & Find Heavy Haul Loads | Haul Command',
  description:
    'Post oversize loads and find pilot car jobs on the #1 heavy haul load board. Real-time matching between carriers, brokers, and escort vehicle operators.',
  keywords: [
    'oversize load board',
    'heavy haul load board',
    'pilot car jobs',
    'escort vehicle jobs',
    'oversize load dispatch',
    'heavy haul freight',
    'superload board',
    'oversize freight board',
  ],
  openGraph: {
    title: 'Oversize Load Board | Haul Command',
    description: 'Post oversize loads and find pilot car jobs. Real-time matching for heavy haul.',
    url: 'https://haulcommand.com/loads',
  },
  alternates: {
    canonical: 'https://haulcommand.com/loads',
  },
};

export const dynamic = 'force-dynamic';

export const LOADS_JSONLD = `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Oversize Load Board",
  "url": "https://haulcommand.com/loads",
  "description": "Post oversize loads and find pilot car jobs on the #1 heavy haul load board.",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://haulcommand.com" },
      { "@type": "ListItem", "position": 2, "name": "Oversize Load Board", "item": "https://haulcommand.com/loads" }
    ]
  }
}`;

const COUNTRY_FLAGS: Record<string, string> = {
  us: '🇺🇸', ca: '🇨🇦', au: '🇦🇺', gb: '🇬🇧', nz: '🇳🇿', za: '🇿🇦',
  de: '🇩🇪', nl: '🇳🇱', ae: '🇦🇪', br: '🇧🇷', ie: '🇮🇪', se: '🇸🇪',
  no: '🇳🇴', dk: '🇩🇰', fi: '🇫🇮', be: '🇧🇪', at: '🇦🇹', ch: '🇨🇭',
  es: '🇪🇸', fr: '🇫🇷', it: '🇮🇹', pt: '🇵🇹', mx: '🇲🇽', in: '🇮🇳',
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function getRecentLoads() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('loads')
      .select('id, origin, destination, load_type, rate_per_day, country_code, created_at, status, corridor')
      .in('status', ['open', 'active', 'posted'])
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  } catch {
    return [];
  }
}

export default async function LoadBoardPage() {
  const loads = await getRecentLoads();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LOADS_JSONLD }} />
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Heavy Haul Load Board — Open Escort Jobs Across 120 countries
          </h1>
          <p className="text-lg text-gray-400 mb-8">
            Find pilot car and escort vehicle opportunities. Respond to loads, accept offers, and get paid through escrow.
          </p>
          
          {/* Signup banner */}
          <div className="max-w-2xl mx-auto p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-8">
            <p className="text-amber-400 font-medium">
              🔒 Sign up free to respond to loads and see full details
            </p>
            <Link aria-label="Navigation Link"
              href="/auth/register"
              className="inline-block mt-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Paywall gate — between hero CTA and load cards: escort free user lead limit hook */}
      <section className="max-w-5xl mx-auto px-4 pb-2">
        <PaywallGateBanner
          surfaceName="Load Board"
          tier="Pro"
          description="Unlock unlimited load responses and early access to new jobs across 120 countries."
        />
      </section>

      {/* Load Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Loads</h2>
          <span className="text-sm text-gray-500">{loads.length} loads shown (sign up to see all)</span>
        </div>
        
        {loads.length > 0 ? (
          <div className="space-y-4">
            {loads.map((load: any) => (
              <div
                key={load.id}
                className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {COUNTRY_FLAGS[(load.country_code || 'us').toLowerCase()] || '🌍'}
                      </span>
                      <h3 className="font-semibold text-white text-lg">
                        {load.origin || 'Origin'} → {load.destination || 'Destination'}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                      {load.load_type && (
                        <span className="px-2 py-0.5 bg-white/5 rounded">{load.load_type}</span>
                      )}
                      {load.corridor && (
                        <span className="px-2 py-0.5 bg-white/5 rounded">{load.corridor}</span>
                      )}
                      <span className="text-gray-500">{timeAgo(load.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {load.rate_per_day ? (
                      <div className="text-2xl font-bold text-amber-400">
                        ${load.rate_per_day}<span className="text-sm text-gray-500">/day</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Rate negotiable</div>
                    )}
                  </div>
                </div>
                
                {/* Gated action */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="blur-sm text-xs text-gray-500 select-none">
                    Broker: ABC Logistics · Contact: broker@example.com
                  </div>
                  <Link aria-label="Navigation Link"
                    href="/auth/register"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors"
                  >
                    Sign up to respond
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No loads posted yet. Check back soon!</p>
            <Link aria-label="Navigation Link"
              href="/auth/register"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
            >
              Sign Up to Post a Load
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Looking to post a load? Reach verified operators across 120 countries.
          </p>
          <div className="flex justify-center gap-4">
            <Link aria-label="Navigation Link"
              href="/auth/register"
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
            >
              Post a Load — Free
            </Link>
            <Link aria-label="Navigation Link"
              href="/directory"
              className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Operators
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
