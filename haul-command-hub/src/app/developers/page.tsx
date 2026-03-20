import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API & Developer Portal — Haul Command',
  description: 'Corridor intelligence APIs for logistics platforms. Access real-time operator availability, rate benchmarks, compliance data, and corridor density for 57 countries.',
};

/* ══════════════════════════════════════════════════════
   DEVELOPERS — API Product Page
   4 API products with pricing, code samples, rate limits
   ══════════════════════════════════════════════════════ */

const API_PRODUCTS = [
  {
    id: 'corridor_density',
    icon: '🛤️',
    name: 'Corridor Density API',
    desc: 'Operator availability by corridor, real-time. Know which corridors have capacity and which are saturated.',
    price: '$299/mo',
    priceValue: 299,
    endpoint: '/v1/corridors/{corridor_id}/density',
    curlExample: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.haulcommand.com/v1/corridors/i95-east-coast/density`,
    jsExample: `const res = await fetch(
  'https://api.haulcommand.com/v1/corridors/i95-east-coast/density',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);
const data = await res.json();
console.log(data.operators_available, data.utilization_pct);`,
    responseExample: `{
  "corridor_id": "i95-east-coast",
  "operators_available": 247,
  "total_operators": 412,
  "utilization_pct": 0.60,
  "avg_response_minutes": 14,
  "updated_at": "2026-03-20T08:00:00Z"
}`,
  },
  {
    id: 'rate_benchmark',
    icon: '💰',
    name: 'Rate Benchmark API',
    desc: 'Average escort rates by state/country, updated daily. Price your loads correctly with market data.',
    price: '$199/mo',
    priceValue: 199,
    endpoint: '/v1/rates/{jurisdiction}',
    curlExample: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.haulcommand.com/v1/rates/us-fl`,
    jsExample: `const res = await fetch(
  'https://api.haulcommand.com/v1/rates/us-fl',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);
const data = await res.json();
console.log(data.avg_rate_per_mile, data.median_daily_rate);`,
    responseExample: `{
  "jurisdiction": "us-fl",
  "avg_rate_per_mile": 1.85,
  "median_daily_rate": 650,
  "rate_range": { "low": 1.40, "high": 2.50 },
  "sample_size": 1247,
  "period": "2026-03-13 to 2026-03-20"
}`,
  },
  {
    id: 'compliance',
    icon: '📋',
    name: 'Compliance API',
    desc: 'Escort requirements by jurisdiction, 57 countries. Get dimension-based escort triggers for any route.',
    price: '$149/mo',
    priceValue: 149,
    endpoint: '/v1/compliance/{jurisdiction}',
    curlExample: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://api.haulcommand.com/v1/compliance/us-tx?width=14&height=16"`,
    jsExample: `const res = await fetch(
  'https://api.haulcommand.com/v1/compliance/us-tx?width=14&height=16',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);
const data = await res.json();
console.log(data.escorts_required, data.police_escort);`,
    responseExample: `{
  "jurisdiction": "us-tx",
  "escorts_required": 2,
  "police_escort": true,
  "height_pole_required": true,
  "permits_needed": ["superload", "state_dot"],
  "travel_restrictions": "Daylight only, no weekends",
  "source": "TxDOT Manual on Uniform Traffic Control"
}`,
  },
  {
    id: 'operator_availability',
    icon: '🚗',
    name: 'Operator Availability API',
    desc: 'Real-time operator availability by corridor/county. Find available escort vehicles instantly.',
    price: '$399/mo',
    priceValue: 399,
    endpoint: '/v1/operators/available',
    curlExample: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://api.haulcommand.com/v1/operators/available?corridor=i10-gulf&service=chase"`,
    jsExample: `const res = await fetch(
  'https://api.haulcommand.com/v1/operators/available?corridor=i10-gulf&service=chase',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);
const data = await res.json();
console.log(data.results.length, 'operators available');`,
    responseExample: `{
  "corridor": "i10-gulf",
  "service": "chase",
  "results": [
    {
      "operator_id": "op_123",
      "name": "Gulf Coast Escorts LLC",
      "distance_miles": 12,
      "available": true,
      "avg_response_min": 8,
      "verified": true
    }
  ],
  "total": 34
}`,
  },
];

const RATE_LIMITS = [
  { tier: 'Free', requests: '100 req/day', color: 'text-gray-400' },
  { tier: 'Starter', requests: '10,000 req/day', color: 'text-blue-400' },
  { tier: 'Pro', requests: '100,000 req/day', color: 'text-accent' },
  { tier: 'Enterprise', requests: 'Unlimited', color: 'text-green-400' },
];

export default function DevelopersPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow overflow-x-hidden">
        {/* Hero */}
        <section className="py-16 sm:py-24 px-4 text-center border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-accent text-xs font-semibold">API v1 — Live</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
              Haul Command <span className="text-accent">API</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              Corridor intelligence for logistics platforms. Real-time escort availability,
              rate benchmarks, and compliance data across 57 countries.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/api/stripe/checkout?plan=api_starter&interval=month"
                className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
              >
                Get API Key →
              </Link>
              <Link
                href="#products"
                className="text-gray-400 hover:text-white px-6 py-3 text-sm font-medium transition-colors"
              >
                View Products ↓
              </Link>
            </div>
          </div>
        </section>

        {/* API Products */}
        <section id="products" className="py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter text-center mb-10">
              4 API <span className="text-accent">Products</span>
            </h2>
            <div className="space-y-6">
              {API_PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 hover:border-accent/15 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{product.icon}</span>
                      <div>
                        <h3 className="text-white font-bold text-lg">{product.name}</h3>
                        <p className="text-gray-400 text-sm mt-1">{product.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-accent font-black text-xl">{product.price}</span>
                      <Link
                        href={`/api/stripe/checkout?plan=api_${product.id}&interval=month`}
                        className="bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/20 transition-colors"
                      >
                        Subscribe
                      </Link>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-4 mb-3">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Endpoint</div>
                    <code className="text-green-400 text-sm font-mono">{product.endpoint}</code>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-black/40 rounded-xl p-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">cURL</div>
                      <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap overflow-x-auto">{product.curlExample}</pre>
                    </div>
                    <div className="bg-black/40 rounded-xl p-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">JavaScript</div>
                      <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap overflow-x-auto">{product.jsExample}</pre>
                    </div>
                  </div>

                  <details className="mt-3">
                    <summary className="text-gray-500 text-xs cursor-pointer hover:text-accent transition-colors">
                      View Response Example ↓
                    </summary>
                    <div className="bg-black/40 rounded-xl p-4 mt-2">
                      <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{product.responseExample}</pre>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="py-12 px-4 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-white tracking-tighter text-center mb-8">
              Rate <span className="text-accent">Limits</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RATE_LIMITS.map((tier) => (
                <div key={tier.tier} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 text-center">
                  <div className={`font-bold text-sm mb-1 ${tier.color}`}>{tier.tier}</div>
                  <div className="text-white font-black text-lg">{tier.requests}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Documentation Links */}
        <section className="py-12 px-4 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-white tracking-tighter text-center mb-8">
              Documentation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: '/developers/getting-started', icon: '🚀', title: 'Getting Started', desc: 'Quickstart guide with your first API call in 5 minutes' },
                { href: '/developers/authentication', icon: '🔑', title: 'Authentication', desc: 'API key management, scopes, and security best practices' },
                { href: '/developers/rate-limits', icon: '⚡', title: 'Rate Limits', desc: 'Tier-based rate limits, burst handling, and 429 responses' },
              ].map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 hover:bg-accent/[0.02] transition-all group"
                >
                  <div className="text-2xl mb-3">{doc.icon}</div>
                  <h3 className="text-white font-bold text-sm group-hover:text-accent transition-colors mb-1">{doc.title}</h3>
                  <p className="text-gray-500 text-xs">{doc.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 px-4 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-white tracking-tighter mb-3">
              Ready to Integrate?
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Get your API key now and start making requests in minutes.
              Free tier includes 100 requests per day.
            </p>
            <Link
              href="/api/stripe/checkout?plan=api_starter&interval=month"
              className="inline-flex bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
            >
              Get API Key — Start Free →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
