import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rate Limits — Haul Command API',
  description: 'Understand Haul Command API rate limits by tier — Free (100/day), Starter (10k/day), Pro (100k/day), Enterprise (unlimited).',
};

export default function RateLimitsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/developers" className="hover:text-accent">Developers</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Rate Limits</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-4">
          Rate <span className="text-accent">Limits</span>
        </h1>
        <p className="text-gray-400 text-sm mb-10 max-w-2xl">
          Rate limits are enforced per API key on a rolling 24-hour window.
        </p>

        <div className="space-y-8">
          {/* Tier Table */}
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left text-gray-400 font-medium py-4 px-5">Tier</th>
                  <th className="text-left text-gray-400 font-medium py-4 px-5">Daily Limit</th>
                  <th className="text-left text-gray-400 font-medium py-4 px-5">Burst Rate</th>
                  <th className="text-left text-gray-400 font-medium py-4 px-5">Price</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tier: 'Free', daily: '100 requests', burst: '10 req/min', price: '$0', color: 'text-gray-400' },
                  { tier: 'Starter', daily: '10,000 requests', burst: '100 req/min', price: 'From $149/mo', color: 'text-blue-400' },
                  { tier: 'Pro', daily: '100,000 requests', burst: '500 req/min', price: 'From $299/mo', color: 'text-accent' },
                  { tier: 'Enterprise', daily: 'Unlimited', burst: 'Unlimited', price: 'Custom', color: 'text-green-400' },
                ].map((row) => (
                  <tr key={row.tier} className="border-b border-white/[0.04] last:border-0">
                    <td className={`py-3.5 px-5 font-bold ${row.color}`}>{row.tier}</td>
                    <td className="py-3.5 px-5 text-white">{row.daily}</td>
                    <td className="py-3.5 px-5 text-gray-400">{row.burst}</td>
                    <td className="py-3.5 px-5 text-gray-300">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rate Limit Headers */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Response Headers</h2>
            <p className="text-gray-400 text-sm mb-4">
              Every API response includes rate limit headers:
            </p>
            <div className="bg-black/40 rounded-xl p-4">
              <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{`X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9847
X-RateLimit-Reset: 1711008000
Retry-After: 3600   # Only sent with 429 responses`}</pre>
            </div>
          </section>

          {/* 429 Handling */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Handling 429 Responses</h2>
            <p className="text-gray-400 text-sm mb-4">
              When you exceed your rate limit, the API returns a <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">429 Too Many Requests</code> response:
            </p>
            <div className="bg-black/40 rounded-xl p-4">
              <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{`{
  "error": "rate_limit_exceeded",
  "message": "Daily request limit reached. Resets at 2026-03-21T00:00:00Z.",
  "retry_after": 3600,
  "upgrade_url": "https://haulcommand.com/developers"
}`}</pre>
            </div>
            <p className="text-gray-500 text-xs mt-3">
              Best practice: Implement exponential backoff with jitter. Cache responses when possible.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
