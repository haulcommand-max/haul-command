import Link from 'next/link';

export const metadata = {
    title: 'Developers | Haul Command Enterprise Data API',
    description:
        'Access enterprise-grade corridor intelligence, fill probability predictions, pricing benchmarks, ' +
        'and risk analytics via the Haul Command Data API. Build integrations with our REST API.',
};

export default function DevelopersPage() {
    return (
        <main className="min-h-screen bg-gray-950 text-gray-100">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-950 to-gray-950 py-24 px-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_70%)]" />
                <div className="relative mx-auto max-w-4xl text-center">
                    <span className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-400 mb-6">
                        Enterprise API
                    </span>
                    <h1 className="text-5xl font-bold tracking-tight text-white mb-6">
                        Haul Command Data API
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Enterprise-grade corridor intelligence, fill probability predictions,
                        pricing benchmarks, and risk analytics for the oversize load ecosystem.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link aria-label="Navigation Link"
                            href="/developers/getting-started"
                            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition"
                        >
                            Get Started →
                        </Link>
                        <Link aria-label="Navigation Link"
                            href="/api/enterprise/openapi.json"
                            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-500 transition"
                        >
                            OpenAPI Spec
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Start */}
            <section className="py-20 px-6 border-t border-gray-800">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-3xl font-bold text-white mb-8">Quick Start</h2>
                    <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 mb-8">
                        <p className="text-sm text-gray-400 mb-4">Get corridor liquidity with a single request:</p>
                        <pre className="bg-gray-950 rounded-lg p-4 text-sm text-green-400 overflow-x-auto">
                            {`curl -H "X-API-Key: hc_your_api_key_here" \\
     "https://haulcommand.com/api/enterprise/corridors/liquidity?limit=10"`}
                        </pre>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <QuickLink
                            title="Authentication"
                            href="/developers/authentication"
                            description="API key management, rotation, and security best practices."
                        />
                        <QuickLink
                            title="Rate Limits"
                            href="/developers/rate-limits"
                            description="RPM limits, quota tracking, and overage billing."
                        />
                        <QuickLink
                            title="Examples"
                            href="/developers/examples"
                            description="TypeScript, Python, and cURL integration examples."
                        />
                    </div>
                </div>
            </section>

            {/* Endpoints */}
            <section className="py-20 px-6 border-t border-gray-800">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-3xl font-bold text-white mb-8">Available Endpoints</h2>
                    <div className="space-y-4">
                        <EndpointCard
                            method="GET"
                            path="/api/enterprise/corridors/liquidity"
                            description="Aggregated corridor liquidity scores, fill rates, response rates, and pricing volatility."
                            tier="pro_intelligence"
                            tags={['Corridor Intelligence', 'Hourly Updates']}
                        />
                        <EndpointCard
                            method="POST"
                            path="/api/enterprise/fill/probability"
                            description="ML-scored fill probability prediction for escort requests."
                            tier="pro_intelligence"
                            tags={['Predictive Analytics', 'Real-time']}
                        />
                        <EndpointCard
                            method="GET"
                            path="/api/enterprise/status"
                            description="Public API status, uptime, and incident history."
                            tier="public"
                            tags={['No Auth Required']}
                        />
                        <EndpointCard
                            method="GET"
                            path="/api/enterprise/coverage"
                            description="Data coverage map with geo credibility scores and readiness bands."
                            tier="public"
                            tags={['No Auth Required', 'Trust Surface']}
                        />
                    </div>
                </div>
            </section>

            {/* Trust & Confidence */}
            <section className="py-20 px-6 border-t border-gray-800">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-3xl font-bold text-white mb-4">Data Confidence</h2>
                    <p className="text-gray-400 mb-8">
                        Every enterprise response includes machine-readable confidence metadata
                        so you can automate decisions with measurable trust.
                    </p>
                    <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                        <pre className="text-sm text-gray-300 overflow-x-auto">
                            {`{
  "corridor_id": "US-TX-I10-W",
  "liquidity_score": 72.5,
  "_confidence": {
    "confidence_score": 0.82,
    "confidence_band": "high",
    "data_freshness_seconds": 1847,
    "source_blend_vector": {
      "cron_enrichment": 0.4,
      "user_report": 0.3,
      "api_feed": 0.3
    },
    "geo_precision_level": "corridor",
    "last_verified_at": "2026-02-27T00:05:00Z"
  }
}`}
                        </pre>
                    </div>
                </div>
            </section>

            {/* Links */}
            <section className="py-20 px-6 border-t border-gray-800">
                <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
                    <TrustLink
                        title="API Status"
                        href="/api/enterprise/status"
                        description="Real-time uptime, latency, and incident tracking."
                        icon="🟢"
                    />
                    <TrustLink
                        title="Coverage Map"
                        href="/api/enterprise/coverage"
                        description="Geo credibility scores and readiness bands."
                        icon="🗺️"
                    />
                    <TrustLink
                        title="Data Methodology"
                        href="/developers/getting-started"
                        description="How we compute confidence scores and quality signals."
                        icon="📊"
                    />
                    <TrustLink
                        title="Plans & Pricing"
                        href="/api/enterprise/plans"
                        description="See available plans, limits, and features."
                        icon="💰"
                    />
                </div>
            </section>
        </main>
    );
}

function QuickLink({ title, href, description }: { title: string; href: string; description: string }) {
    return (
        <Link aria-label="Navigation Link" href={href} className="block rounded-xl bg-gray-900 border border-gray-800 p-5 hover:border-blue-500/50 transition group">
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
        </Link>
    );
}

function EndpointCard({ method, path, description, tier, tags }: {
    method: string; path: string; description: string; tier: string; tags: string[];
}) {
    const methodColors: Record<string, string> = {
        GET: 'text-green-400 bg-green-500/10',
        POST: 'text-blue-400 bg-blue-500/10',
        PUT: 'text-orange-400 bg-orange-500/10',
        DELETE: 'text-red-400 bg-red-500/10',
    };
    return (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 hover:border-gray-700 transition">
            <div className="flex items-start gap-3 mb-2">
                <span className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${methodColors[method] ?? 'text-gray-400'}`}>
                    {method}
                </span>
                <code className="text-sm text-gray-200 font-mono">{path}</code>
            </div>
            <p className="text-sm text-gray-400 mb-3">{description}</p>
            <div className="flex gap-2 flex-wrap">
                {tags.map(t => (
                    <span key={t} className="rounded-full bg-gray-800 px-3 py-0.5 text-xs text-gray-400">{t}</span>
                ))}
                {tier !== 'public' && (
                    <span className="rounded-full bg-purple-500/10 px-3 py-0.5 text-xs text-purple-400">{tier}</span>
                )}
            </div>
        </div>
    );
}

function TrustLink({ title, href, description, icon }: {
    title: string; href: string; description: string; icon: string;
}) {
    return (
        <Link aria-label="Navigation Link" href={href} className="flex gap-4 rounded-xl bg-gray-900 border border-gray-800 p-5 hover:border-gray-700 transition group">
            <span className="text-2xl">{icon}</span>
            <div>
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition mb-1">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </Link>
    );
}
