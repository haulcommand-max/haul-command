import Link from 'next/link';

export const metadata = {
    title: 'Code Examples | Haul Command API',
    description: 'Integration examples in TypeScript, Python, and cURL for the Haul Command Enterprise Data API.',
};

export default function ExamplesPage() {
    return (
        <main className="min-h-screen bg-gray-950 text-gray-100">
            <div className="mx-auto max-w-3xl py-20 px-6">
                <Link aria-label="Navigation Link" href="/developers" className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block">← Back to Developers</Link>
                <h1 className="text-4xl font-bold text-white mb-6">Code Examples</h1>
                <p className="text-lg text-gray-400 mb-12">Ready-to-use integration patterns in TypeScript, Python, and cURL.</p>

                <section className="space-y-16">
                    {/* TypeScript */}
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono text-blue-400">TypeScript</span>
                            Corridor Liquidity Client
                        </h2>
                        <Pre lang="typescript">{`import type { CorridorLiquidity } from './types';

const HC_API_KEY = process.env.HC_API_KEY!;
const BASE_URL = 'https://haulcommand.com/api/enterprise';

interface LiquidityResponse {
  corridors: (CorridorLiquidity & {
    _confidence: {
      confidence_score: number;
      confidence_band: 'verified' | 'high' | 'medium' | 'low';
      data_freshness_seconds: number;
    };
  })[];
  count: number;
  meta: { tier: string; product: string };
}

export async function getCorridorLiquidity(
  corridorId?: string,
  limit = 50
): Promise<LiquidityResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (corridorId) params.set('corridor_id', corridorId);

  const res = await fetch(
    \`\${BASE_URL}/corridors/liquidity?\${params}\`,
    {
      headers: { 'X-API-Key': HC_API_KEY },
      next: { revalidate: 300 }, // Cache for 5 minutes
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(\`HC API Error \${res.status}: \${err.error}\`);
  }

  return res.json();
}

// Usage:
const data = await getCorridorLiquidity('US-TX-I10-W');
for (const c of data.corridors) {
  if (c._confidence.confidence_band === 'low') {
    console.warn(\`Low confidence for \${c.corridor_id}\`);
    continue;
  }
  console.log(\`\${c.corridor_id}: liquidity=\${c.liquidity_score}\`);
}`}</Pre>
                    </div>

                    {/* Python */}
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono text-green-400">Python</span>
                            Fill Probability Predictor
                        </h2>
                        <Pre lang="python">{`import os
import requests
from dataclasses import dataclass

HC_API_KEY = os.environ["HC_API_KEY"]
BASE_URL = "https://haulcommand.com/api/enterprise"

@dataclass
class FillPrediction:
    p_fill_60m: float
    p_fill_120m: float
    confidence: str
    recommended_lead_time_hours: float

def predict_fill(
    corridor_id: str,
    escorts: int = 1,
    urgency: int = 0,
    hours_to_start: float = 48,
    miles: float = 100,
) -> FillPrediction:
    """Predict escort fill probability for a corridor."""
    resp = requests.post(
        f"{BASE_URL}/fill/probability",
        headers={"X-API-Key": HC_API_KEY},
        json={
            "corridor_id": corridor_id,
            "escorts_required": escorts,
            "urgency_level": urgency,
            "time_to_start_hours": hours_to_start,
            "miles": miles,
        },
    )
    resp.raise_for_status()
    data = resp.json()
    return FillPrediction(**{
        k: data[k] for k in FillPrediction.__dataclass_fields__
    })

# Usage:
pred = predict_fill("US-TX-I10-W", escorts=2, hours_to_start=6)
print(f"60m fill probability: {pred.p_fill_60m:.0%}")
print(f"Recommended lead time: {pred.recommended_lead_time_hours}h")`}</Pre>
                    </div>

                    {/* cURL */}
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="rounded bg-[#1A1A1A]0/10 px-2 py-0.5 text-xs font-mono text-gray-400">cURL</span>
                            Common Operations
                        </h2>
                        <div className="space-y-6">
                            <Pre lang="bash" title="Create an API key">{`curl -X POST https://haulcommand.com/api/enterprise/keys \\
     -H "Content-Type: application/json" \\
     -H "Cookie: sb-access-token=YOUR_SESSION" \\
     -d '{"label": "Production"}'`}</Pre>

                            <Pre lang="bash" title="Get corridor liquidity">{`curl -H "X-API-Key: hc_your_key" \\
     "https://haulcommand.com/api/enterprise/corridors/liquidity?limit=10"`}</Pre>

                            <Pre lang="bash" title="Check usage">{`curl -H "Cookie: sb-access-token=YOUR_SESSION" \\
     "https://haulcommand.com/api/enterprise/usage"`}</Pre>

                            <Pre lang="bash" title="Check API status (no auth)">{`curl "https://haulcommand.com/api/enterprise/status"`}</Pre>

                            <Pre lang="bash" title="Get data coverage (no auth)">{`curl "https://haulcommand.com/api/enterprise/coverage"`}</Pre>

                            <Pre lang="bash" title="Revoke a key">{`curl -X POST https://haulcommand.com/api/enterprise/keys/revoke \\
     -H "Content-Type: application/json" \\
     -H "Cookie: sb-access-token=YOUR_SESSION" \\
     -d '{"key_id": "uuid-of-key-to-revoke"}'`}</Pre>
                        </div>
                    </div>

                    {/* SDK Generation */}
                    <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                        <h3 className="text-lg font-semibold text-white mb-3">SDK Generation</h3>
                        <p className="text-gray-400 mb-4">
                            Generate a typed client from our OpenAPI spec using any code generator:
                        </p>
                        <Pre lang="bash">{`# TypeScript (openapi-typescript-codegen)
npx openapi-typescript-codegen \\
  --input https://haulcommand.com/api/enterprise/openapi.json \\
  --output ./src/haulcommand --client fetch

# Python (openapi-python-client)
pip install openapi-python-client
openapi-python-client generate \\
  --url https://haulcommand.com/api/enterprise/openapi.json`}</Pre>
                    </div>
                </section>
            </div>
        </main>
    );
}

function Pre({ children, lang, title }: { children: string; lang?: string; title?: string }) {
    return (
        <div className="rounded-xl bg-gray-950 border border-gray-800 overflow-hidden">
            {title && (
                <div className="border-b border-gray-800 px-4 py-2 text-xs text-gray-400">{title}</div>
            )}
            <pre className="p-4 text-sm text-green-400 overflow-x-auto">
                <code>{children}</code>
            </pre>
        </div>
    );
}
