export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/bootstrap/enqueue?limit=500
 *
 * Manual bootstrap endpoint — enqueues content jobs without waiting for
 * Vercel cron to fire. Idempotent (unique constraint prevents duplicates).
 *
 * Auth: CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY
 * Use from: curl, admin panel, or first-deploy ignition script
 */

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

export async function POST(req: NextRequest) {
    // Auth: accept CRON_SECRET or service-role key
    const authHeader = req.headers.get('authorization');
    const cronOk = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const serviceOk = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

    if (!cronOk && !serviceOk) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = Math.min(
        parseInt(new URL(req.url).searchParams.get('limit') ?? '500'),
        5000
    );

    const svc = getSupabase();
    const stats = { counties: 0, cities: 0, places: 0, total: 0, errors: [] as string[] };

    // 1. Enqueue county pages
    try {
        const { data: counties } = await svc
            .from('counties')
            .select('slug, seo_tier, regions!inner(iso_code)')
            .limit(limit);

        if (counties?.length) {
            const jobs = counties.map((c: any) => ({
                job_type: 'county_page',
                key: `${c.regions.iso_code.toLowerCase()}|${c.slug}`,
                priority: c.seo_tier === 'primary' ? 100 : c.seo_tier === 'secondary' ? 80 : 50,
                status: 'queued',
            }));

            for (let i = 0; i < jobs.length; i += 500) {
                const batch = jobs.slice(i, i + 500);
                const { error } = await svc.from('content_jobs').upsert(batch, {
                    onConflict: 'job_type,key',
                    ignoreDuplicates: true,
                });
                if (error) stats.errors.push(`counties: ${error.message}`);
                else stats.counties += batch.length;
            }
        }
    } catch (e: any) { stats.errors.push(`counties: ${e.message}`); }

    // 2. Enqueue city pages from cities table (our seeded data)
    try {
        const { data: cities } = await svc
            .from('cities')
            .select('slug, seo_tier, regions!inner(iso_code)')
            .eq('is_active', true)
            .limit(limit);

        if (cities?.length) {
            const jobs = cities.map((c: any) => ({
                job_type: 'city_page',
                key: `${c.regions.iso_code.toLowerCase()}|${c.slug}`,
                priority: c.seo_tier === 'primary' ? 100 : 80,
                status: 'queued',
            }));

            for (let i = 0; i < jobs.length; i += 500) {
                const batch = jobs.slice(i, i + 500);
                const { error } = await svc.from('content_jobs').upsert(batch, {
                    onConflict: 'job_type,key',
                    ignoreDuplicates: true,
                });
                if (error) stats.errors.push(`cities: ${error.message}`);
                else stats.cities += batch.length;
            }
        }
    } catch (e: any) { stats.errors.push(`cities: ${e.message}`); }

    // 3. Enqueue from places table (if separate)
    try {
        const { data: places } = await svc
            .from('places')
            .select('slug, seo_tier, population, regions!inner(iso_code)')
            .limit(limit);

        if (places?.length) {
            const jobs = places.map((p: any) => ({
                job_type: 'city_page',
                key: `${p.regions.iso_code.toLowerCase()}|${p.slug}`,
                priority: p.seo_tier === 'primary' ? 100 : p.seo_tier === 'secondary' ? 80 : 60,
                status: 'queued',
            }));

            for (let i = 0; i < jobs.length; i += 500) {
                const batch = jobs.slice(i, i + 500);
                const { error } = await svc.from('content_jobs').upsert(batch, {
                    onConflict: 'job_type,key',
                    ignoreDuplicates: true,
                });
                if (error) stats.errors.push(`places: ${error.message}`);
                else stats.places += batch.length;
            }
        }
    } catch (e: any) { stats.errors.push(`places: ${e.message}`); }

    stats.total = stats.counties + stats.cities + stats.places;

    // Log to cron_runs for visibility
    await svc.from('cron_runs').insert({
        job_name: 'bootstrap-enqueue',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        status: stats.errors.length > 0 ? 'partial' : 'success',
        items_enqueued: stats.total,
        metadata: stats,
    });

    return NextResponse.json({
        ok: true,
        stats,
        message: `Enqueued ${stats.total} content jobs (${stats.counties} county + ${stats.cities} city + ${stats.places} places)`,
    });
}
