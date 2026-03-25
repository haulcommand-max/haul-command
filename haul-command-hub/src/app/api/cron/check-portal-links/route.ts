import { NextResponse } from 'next/server';
import { STATE_PORTALS } from '@/lib/data/state-portals';

export const runtime = 'edge';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, { ok: boolean; status?: number }> = {};

  await Promise.allSettled(
    Object.entries(STATE_PORTALS).map(async ([state, portal]) => {
      try {
        const res = await fetch(portal.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        results[state] = { ok: res.ok, status: res.status };
      } catch {
        results[state] = { ok: false };
      }
    })
  );

  const broken = Object.entries(results)
    .filter(([, r]) => !r.ok)
    .map(([s]) => s);

  if (broken.length > 0) {
    console.warn('[Portal Link Check] Broken links:', broken.join(', '));
  }

  return NextResponse.json({
    results,
    broken,
    total: Object.keys(results).length,
    healthy: Object.keys(results).length - broken.length,
    checkedAt: new Date().toISOString(),
  });
}
