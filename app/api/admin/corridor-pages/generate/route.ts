import { NextRequest, NextResponse } from 'next/server';
import { generateCorridorPages, recordCorridorDemandSignal } from '@/lib/corridors/corridor-page-generator';

/**
 * POST /api/admin/corridor-pages/generate
 *
 * Generates hc_corridor_pages stubs for all active corridors that are missing pages.
 * Protected by ADMIN_API_KEY header.
 *
 * Body (optional): { dryRun?: boolean; limit?: number; scoreAfter?: boolean }
 * Returns: { total, created, skipped, errors, durationMs }
 */

const ADMIN_KEY = process.env.ADMIN_API_KEY;

export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get('x-admin-key');
  if (!ADMIN_KEY || authHeader !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    dryRun?: boolean;
    limit?: number;
    scoreAfter?: boolean;
  };

  const { dryRun = false, limit = 500, scoreAfter = true } = body;

  const start = Date.now();

  try {
    const result = await generateCorridorPages({ dryRun, limit });

    // Optionally trigger scoring pass
    if (scoreAfter && !dryRun) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.rpc('hc_score_all_corridors');
    }

    return NextResponse.json({
      ...result,
      dryRun,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    console.error('[corridor-page-generator API]', err);
    return NextResponse.json(
      { error: 'Generation failed', detail: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/corridor-pages/generate
 * Returns stats on current page generation coverage.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-key');
  if (!ADMIN_KEY || authHeader !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [{ count: totalCorridors }, { count: totalPages }, { count: publishedPages }, { count: missingPages }] =
      await Promise.all([
        supabase.from('hc_corridors').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('hc_corridor_pages').select('*', { count: 'exact', head: true }),
        supabase.from('hc_corridor_pages').select('*', { count: 'exact', head: true }).eq('publish_status', 'published'),
        supabase.from('hc_corridor_seo_queue_v1').select('*', { count: 'exact', head: true }).eq('generation_status', 'missing'),
      ]);

    return NextResponse.json({
      totalCorridors,
      totalPages,
      publishedPages,
      missingPages,
      coveragePercent: totalCorridors
        ? Math.round(((totalPages ?? 0) / (totalCorridors * 5)) * 100)
        : 0,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
