import { NextResponse } from 'next/server';
import { runEnrichmentAgent } from '@/lib/engines/enrichment-agent';

/**
 * POST /api/ai/enrich
 * Triggers the enrichment agent to process unenriched operators.
 * Assigns HC Trust Numbers, generates descriptions, scores risk.
 * Secured by CRON_SECRET.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit ?? 50), 500);

    const result = await runEnrichmentAgent(limit);

    return NextResponse.json({
      success: true,
      ...result,
      message: `Enriched ${result.enriched} operators. Skipped ${result.skipped}.`,
    });
  } catch (err: any) {
    console.error('[/api/ai/enrich]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
