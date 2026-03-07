import Link from 'next/link';

export const metadata = {
    title: 'Rate Limits & Quotas | Haul Command API',
    description: 'Understand rate limits, monthly quotas, overage billing, and how to stay within your plan.',
};

export default function RateLimitsPage() {
    return (
        <main className="min-h-screen bg-gray-950 text-gray-100">
            <div className="mx-auto max-w-3xl py-20 px-6">
                <Link href="/developers" className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block">← Back to Developers</Link>
                <h1 className="text-4xl font-bold text-white mb-6">Rate Limits & Quotas</h1>

                <section className="space-y-12">
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Plan Limits</h2>
                        <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-800 text-gray-400">
                                    <tr>
                                        <th className="text-left p-4">Plan</th>
                                        <th className="text-left p-4">RPM</th>
                                        <th className="text-left p-4">Monthly Rows</th>
                                        <th className="text-left p-4">Max Keys</th>
                                        <th className="text-left p-4">Support</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    <tr className="border-t border-gray-800">
                                        <td className="p-4 font-medium">Starter API</td>
                                        <td className="p-4">60</td>
                                        <td className="p-4">500,000</td>
                                        <td className="p-4">3</td>
                                        <td className="p-4">Community</td>
                                    </tr>
                                    <tr className="border-t border-gray-800">
                                        <td className="p-4 font-medium">Growth API</td>
                                        <td className="p-4">240</td>
                                        <td className="p-4">5,000,000</td>
                                        <td className="p-4">10</td>
                                        <td className="p-4">Priority</td>
                                    </tr>
                                    <tr className="border-t border-gray-800">
                                        <td className="p-4 font-medium">Enterprise API</td>
                                        <td className="p-4">Dynamic</td>
                                        <td className="p-4">Unlimited (metered)</td>
                                        <td className="p-4">50</td>
                                        <td className="p-4">SLA</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Rate Limit Headers</h2>
                        <p className="text-gray-400 mb-4">Every enterprise response includes rate limit headers:</p>
                        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 space-y-3">
                            <HeaderRow name="X-RateLimit-Limit" description="Requests allowed per minute" example="60" />
                            <HeaderRow name="X-RateLimit-Remaining" description="Requests remaining in current window" example="47" />
                            <HeaderRow name="X-RateLimit-Reset" description="UTC epoch seconds when window resets" example="1740614460" />
                            <HeaderRow name="X-Quota-Used" description="Rows consumed this billing period" example="125000" />
                            <HeaderRow name="X-Quota-Remaining" description="Rows remaining this billing period" example="375000" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Quota Enforcement</h2>
                        <div className="space-y-4">
                            <AlertBlock level="80%" color="amber" action="Warning header added to responses. Email notification sent." />
                            <AlertBlock level="90%" color="orange" action="Critical warning. Dashboard alert triggered." />
                            <AlertBlock level="100%" color="red" action="Overage billing begins at your plan's overage rate." />
                            <AlertBlock level="150%" color="red" action="Hard block. Requests return 402. Contact sales to lift." />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Overage Billing</h2>
                        <p className="text-gray-400 mb-4">
                            When you exceed your monthly row quota, overage charges apply automatically:
                        </p>
                        <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-800 text-gray-400">
                                    <tr>
                                        <th className="text-left p-4">Plan</th>
                                        <th className="text-left p-4">Overage Rate</th>
                                        <th className="text-left p-4">Per</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    <tr className="border-t border-gray-800"><td className="p-4">Starter</td><td className="p-4">$0.50</td><td className="p-4">1,000 rows</td></tr>
                                    <tr className="border-t border-gray-800"><td className="p-4">Growth</td><td className="p-4">$0.30</td><td className="p-4">1,000 rows</td></tr>
                                    <tr className="border-t border-gray-800"><td className="p-4">Enterprise</td><td className="p-4">$0.15</td><td className="p-4">1,000 rows</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Handling Rate Limits</h2>
                        <pre className="rounded-lg bg-gray-950 border border-gray-800 p-4 text-sm text-green-400 overflow-x-auto">
                            {`// TypeScript retry with exponential backoff
async function fetchWithRetry(url: string, apiKey: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, {
      headers: { 'X-API-Key': apiKey }
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const waitMs = retryAfter
        ? (new Date(retryAfter).getTime() - Date.now())
        : Math.pow(2, i) * 1000;
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    return res.json();
  }
  throw new Error('Rate limit exceeded after retries');
}`}
                        </pre>
                    </div>
                </section>
            </div>
        </main>
    );
}

function HeaderRow({ name, description, example }: { name: string; description: string; example: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <code className="text-blue-400 text-sm font-mono min-w-[220px]">{name}</code>
            <span className="text-gray-400 text-sm flex-1">{description}</span>
            <span className="text-gray-500 text-xs font-mono">{example}</span>
        </div>
    );
}

function AlertBlock({ level, color, action }: { level: string; color: string; action: string }) {
    const colors: Record<string, string> = {
        amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
        orange: 'border-orange-500/30 bg-orange-500/5 text-orange-400',
        red: 'border-red-500/30 bg-red-500/5 text-red-400',
    };
    return (
        <div className={`rounded-lg border p-4 ${colors[color]}`}>
            <span className="font-semibold">{level} quota used:</span> <span className="text-gray-300">{action}</span>
        </div>
    );
}
