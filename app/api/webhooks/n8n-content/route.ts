import { NextRequest, NextResponse } from 'next/server';

// POST /api/webhooks/n8n-content
// n8n webhook → triggers content generation
// n8n workflow should POST to this URL with secret header
// Equivalent to hitting /api/cron/content-engine but from n8n

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-n8n-secret');
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Forward to the content engine
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.haulcommand.com';
  const response = await fetch(`${base}/api/cron/content-engine`, {
    method: 'GET',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
  });

  const data = await response.json().catch(() => ({ error: 'Parse failed' }));
  return NextResponse.json({ triggered: true, result: data });
}

// GET for n8n webhook registration check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'haul-command-content-pipeline' });
}
