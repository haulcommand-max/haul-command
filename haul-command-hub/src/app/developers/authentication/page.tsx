import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication — Haul Command API',
  description: 'Learn how to authenticate with the Haul Command API using Bearer tokens, manage API keys, and follow security best practices.',
};

export default function AuthenticationPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/developers" className="hover:text-accent">Developers</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Authentication</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-4">
          <span className="text-accent">Authentication</span>
        </h1>
        <p className="text-gray-400 text-sm mb-10 max-w-2xl">
          All API requests require authentication via Bearer token in the Authorization header.
        </p>

        <div className="space-y-8">
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Bearer Token</h2>
            <p className="text-gray-400 text-sm mb-4">
              Include your API key in every request as a Bearer token:
            </p>
            <div className="bg-black/40 rounded-xl p-4">
              <pre className="text-gray-300 text-xs font-mono">{`Authorization: Bearer hc_live_abc123...`}</pre>
            </div>
          </section>

          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">API Key Types</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">●</span>
                <div>
                  <p className="text-white font-semibold text-sm">Live Keys <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">hc_live_</code></p>
                  <p className="text-gray-500 text-xs mt-0.5">Production keys with real data. Count toward your rate limit.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400 mt-0.5">●</span>
                <div>
                  <p className="text-white font-semibold text-sm">Test Keys <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">hc_test_</code></p>
                  <p className="text-gray-500 text-xs mt-0.5">Sandbox keys with mock data. Do not count toward limits.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Security Best Practices</h2>
            <ul className="space-y-2">
              {[
                'Never expose API keys in client-side code or public repositories',
                'Use environment variables to store keys',
                'Rotate keys periodically — you can generate new keys from your dashboard',
                'Use the minimum permission scope required for your integration',
                'Monitor your usage dashboard for unexpected spikes',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-accent mt-0.5">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Error Responses</h2>
            <div className="bg-black/40 rounded-xl p-4">
              <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{`// 401 Unauthorized — Missing or invalid key
{
  "error": "invalid_api_key",
  "message": "The API key provided is invalid or expired.",
  "status": 401
}

// 403 Forbidden — Key lacks permission
{
  "error": "insufficient_scope",
  "message": "This key does not have access to the Compliance API.",
  "status": 403
}`}</pre>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
