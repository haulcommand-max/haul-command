import Link from 'next/link';

export const metadata = {
    title: 'Getting Started | Haul Command API',
    description: 'Learn how to integrate with the Haul Command Enterprise Data API in 5 minutes.',
};

export default function GettingStartedPage() {
    return (
        <main className="min-h-screen bg-gray-950 text-gray-100">
            <div className="mx-auto max-w-3xl py-20 px-6">
                <Link aria-label="Navigation Link" href="/developers" className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block">← Back to Developers</Link>
                <h1 className="text-4xl font-bold text-white mb-6">Getting Started</h1>
                <p className="text-lg text-gray-400 mb-12">Integrate with the Haul Command Data API in 5 minutes.</p>

                <section className="space-y-12">
                    <Step number={1} title="Create an Account">
                        <p>Sign up at <Link aria-label="Navigation Link" href="/signup" className="text-blue-400 hover:underline">haulcommand.com/signup</Link> and subscribe to a data plan.</p>
                    </Step>

                    <Step number={2} title="Generate an API Key">
                        <p className="mb-4">From your dashboard, or via the API:</p>
                        <Pre>{`curl -X POST https://haulcommand.com/api/enterprise/keys \\
     -H "Content-Type: application/json" \\
     -H "Cookie: your_session_cookie" \\
     -d '{"label": "Production Key"}'`}</Pre>
                        <p className="mt-3 text-sm text-amber-400">⚠ The API key is shown only once. Store it securely.</p>
                    </Step>

                    <Step number={3} title="Make Your First Request">
                        <Pre>{`curl -H "X-API-Key: hc_your_key_here" \\
     "https://haulcommand.com/api/enterprise/corridors/liquidity?limit=5"`}</Pre>
                    </Step>

                    <Step number={4} title="Read Confidence Metadata">
                        <p className="mb-4">Every response includes a <code className="text-blue-400">_confidence</code> object with machine-readable trust signals:</p>
                        <Pre>{`{
  "confidence_score": 0.82,     // 0–1 float
  "confidence_band": "high",    // verified | high | medium | low
  "data_freshness_seconds": 1847,
  "geo_precision_level": "corridor",
  "source_blend_vector": { ... }
}`}</Pre>
                        <p className="mt-3 text-sm text-gray-400">
                            Use confidence_band to gate automation decisions. We recommend requiring &quot;high&quot; or &quot;verified&quot; for production routing decisions.
                        </p>
                    </Step>

                    <Step number={5} title="Monitor Your Usage">
                        <Pre>{`curl -H "Cookie: your_session_cookie" \\
     "https://haulcommand.com/api/enterprise/usage"`}</Pre>
                        <p className="mt-3 text-sm text-gray-400">
                            Track quota usage, daily rollups, and anomaly alerts.
                        </p>
                    </Step>
                </section>

                <div className="mt-16 rounded-xl bg-gray-900 border border-gray-800 p-6">
                    <h3 className="font-semibold text-white mb-2">Next Steps</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li>→ <Link aria-label="Navigation Link" href="/developers/authentication" className="text-blue-400 hover:underline">Authentication deep dive</Link></li>
                        <li>→ <Link aria-label="Navigation Link" href="/developers/rate-limits" className="text-blue-400 hover:underline">Rate limits & quotas</Link></li>
                        <li>→ <Link aria-label="Navigation Link" href="/developers/examples" className="text-blue-400 hover:underline">Code examples (TS, Python, cURL)</Link></li>
                        <li>→ <Link aria-label="Navigation Link" href="/api/enterprise/openapi.json" className="text-blue-400 hover:underline">Full OpenAPI specification</Link></li>
                    </ul>
                </div>
            </div>
        </main>
    );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                {number}
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
                <div className="text-gray-300">{children}</div>
            </div>
        </div>
    );
}

function Pre({ children }: { children: string }) {
    return (
        <pre className="rounded-lg bg-gray-950 border border-gray-800 p-4 text-sm text-green-400 overflow-x-auto">
            {children}
        </pre>
    );
}
