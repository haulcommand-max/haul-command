import Link from 'next/link';

export const metadata = {
    title: 'Authentication | Haul Command API',
    description: 'API key management, security best practices, and authentication methods.',
};

export default function AuthenticationPage() {
    return (
        <main className="min-h-screen bg-gray-950 text-gray-100">
            <div className="mx-auto max-w-3xl py-20 px-6">
                <Link href="/developers" className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block">← Back to Developers</Link>
                <h1 className="text-4xl font-bold text-white mb-6">Authentication</h1>

                <section className="space-y-12">
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">API Key Authentication</h2>
                        <p className="text-gray-400 mb-4">
                            All enterprise endpoints require an API key. Keys are prefixed with <code className="text-blue-400">hc_</code>.
                        </p>
                        <p className="text-gray-400 mb-4">Send your key via any of these methods (in priority order):</p>
                        <div className="space-y-3">
                            <Pre title="X-API-Key Header (recommended)">{`X-API-Key: hc_your_api_key_here`}</Pre>
                            <Pre title="Authorization Header">{`Authorization: Bearer hc_your_api_key_here`}</Pre>
                            <Pre title="Query Parameter (least secure)">{`?api_key=hc_your_api_key_here`}</Pre>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Key Management</h2>
                        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 space-y-4">
                            <div>
                                <h3 className="font-semibold text-white mb-2">Create a Key</h3>
                                <pre className="rounded-lg bg-gray-950 p-3 text-sm text-green-400 overflow-x-auto">
                                    {`POST /api/enterprise/keys
{"label": "My Integration"}`}
                                </pre>
                                <p className="text-sm text-gray-400 mt-2">Requires active session. Returns the raw key (shown once).</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-2">List Keys</h3>
                                <pre className="rounded-lg bg-gray-950 p-3 text-sm text-green-400 overflow-x-auto">
                                    {`GET /api/enterprise/keys`}
                                </pre>
                                <p className="text-sm text-gray-400 mt-2">Returns key IDs, prefixes, and usage stats. Never returns full keys.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-2">Revoke a Key</h3>
                                <pre className="rounded-lg bg-gray-950 p-3 text-sm text-green-400 overflow-x-auto">
                                    {`POST /api/enterprise/keys/revoke
{"key_id": "uuid"}`}
                                </pre>
                                <p className="text-sm text-gray-400 mt-2">Permanently revokes a key. Immediate effect. Cannot be undone.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Security Best Practices</h2>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex gap-3"><span className="text-green-400">✓</span> Store API keys in environment variables, never in code.</li>
                            <li className="flex gap-3"><span className="text-green-400">✓</span> Use separate keys for development and production.</li>
                            <li className="flex gap-3"><span className="text-green-400">✓</span> Rotate keys regularly. Revoke unused keys immediately.</li>
                            <li className="flex gap-3"><span className="text-green-400">✓</span> Monitor the usage dashboard for anomalies.</li>
                            <li className="flex gap-3"><span className="text-red-400">✗</span> Never share keys between applications or team members.</li>
                            <li className="flex gap-3"><span className="text-red-400">✗</span> Never expose keys in client-side code or URLs.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Error Responses</h2>
                        <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-800 text-gray-400">
                                    <tr>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">Reason</th>
                                        <th className="text-left p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    <tr className="border-t border-gray-800"><td className="p-3 font-mono">401</td><td className="p-3">Missing or invalid key</td><td className="p-3">Check key format and header</td></tr>
                                    <tr className="border-t border-gray-800"><td className="p-3 font-mono">403</td><td className="p-3">Insufficient tier</td><td className="p-3">Upgrade plan or remove product requirement</td></tr>
                                    <tr className="border-t border-gray-800"><td className="p-3 font-mono">429</td><td className="p-3">Rate limited</td><td className="p-3">Wait for retry_after, reduce request frequency</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function Pre({ title, children }: { title: string; children: string }) {
    return (
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-2">{title}</p>
            <code className="text-sm text-green-400">{children}</code>
        </div>
    );
}
