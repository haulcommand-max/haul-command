import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Getting Started — Haul Command API',
  description: 'Get started with the Haul Command API. Make your first corridor intelligence request in under 5 minutes.',
};

export default function GettingStartedPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/developers" className="hover:text-accent">Developers</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Getting Started</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-4">
          Getting <span className="text-accent">Started</span>
        </h1>
        <p className="text-gray-400 text-sm mb-10 max-w-2xl">
          Make your first Haul Command API request in under 5 minutes.
        </p>

        <div className="space-y-8">
          {/* Step 1 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">1</span>
              <h2 className="text-white font-bold text-lg">Get Your API Key</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to any API product to receive your API key. Free tier includes 100 requests per day.
            </p>
            <Link
              href="/api/stripe/checkout?plan=api_starter&interval=month"
              className="inline-flex bg-accent text-black px-5 py-2 rounded-lg font-bold text-sm hover:bg-yellow-500 transition-colors"
            >
              Get API Key →
            </Link>
          </section>

          {/* Step 2 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">2</span>
              <h2 className="text-white font-bold text-lg">Make Your First Request</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Set your API key in the <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">Authorization</code> header:
            </p>
            <div className="bg-black/40 rounded-xl p-4">
              <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.haulcommand.com/v1/corridors/i95-east-coast/density`}</pre>
            </div>
          </section>

          {/* Step 3 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">3</span>
              <h2 className="text-white font-bold text-lg">Parse the Response</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              All responses are JSON. Status codes follow REST conventions (200, 400, 401, 429, 500).
            </p>
            <div className="bg-black/40 rounded-xl p-4">
              <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{`{
  "corridor_id": "i95-east-coast",
  "operators_available": 247,
  "utilization_pct": 0.60,
  "updated_at": "2026-03-20T08:00:00Z"
}`}</pre>
            </div>
          </section>

          {/* Step 4 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">4</span>
              <h2 className="text-white font-bold text-lg">Explore More Endpoints</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/developers" className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-accent/20 transition-all group">
                <span className="text-lg">🛤️</span>
                <p className="text-white text-sm font-semibold mt-1 group-hover:text-accent transition-colors">Corridor Density</p>
              </Link>
              <Link href="/developers" className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-accent/20 transition-all group">
                <span className="text-lg">💰</span>
                <p className="text-white text-sm font-semibold mt-1 group-hover:text-accent transition-colors">Rate Benchmarks</p>
              </Link>
              <Link href="/developers" className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-accent/20 transition-all group">
                <span className="text-lg">📋</span>
                <p className="text-white text-sm font-semibold mt-1 group-hover:text-accent transition-colors">Compliance</p>
              </Link>
              <Link href="/developers" className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-accent/20 transition-all group">
                <span className="text-lg">🚗</span>
                <p className="text-white text-sm font-semibold mt-1 group-hover:text-accent transition-colors">Operator Availability</p>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
