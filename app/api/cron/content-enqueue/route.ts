export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/cron/content-enqueue
 * 
 * Scans geo tables and enqueues content generation jobs.
 * Runs hourly — idempotent (unique constraint prevents duplicates).
 * Logs to cron_runs for health monitoring.
 */

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = getSupabase();
    const startedAt = new Date().toISOString();
    const stats = { county_jobs: 0, city_jobs: 0, faq_jobs: 0, industry_jobs: 0, errors: 0 };

    // Log cron start
    const { data: cronRun } = await svc.from('cron_runs').insert({
        job_name: 'content-enqueue',
        started_at: startedAt,
        status: 'running',
    }).select('id').single();

    try {
        // ── 1. Enqueue county pages ─────────────────────────────────────
        try {
            const { data: counties } = await svc
                .from('counties')
                .select('slug, seo_tier, regions!inner(iso_code)')
                .limit(5000);

            if (counties?.length) {
                const jobs = counties.map((c: any) => ({
                    job_type: 'county_page',
                    key: `${c.regions.iso_code.toLowerCase()}|${c.slug}`,
                    priority: c.seo_tier === 'primary' ? 100 : c.seo_tier === 'secondary' ? 80 : 50,
                }));

                for (let i = 0; i < jobs.length; i += 500) {
                    const batch = jobs.slice(i, i + 500);
                    const { error } = await svc.from('content_jobs').upsert(batch, {
                        onConflict: 'job_type,key',
                        ignoreDuplicates: true
                    });
                    if (!error) stats.county_jobs += batch.length;
                }
            }
        } catch { stats.errors++; }

        // ── 2. Enqueue city pages (places table) ────────────────────────
        try {
            const { data: places } = await svc
                .from('places')
                .select('slug, seo_tier, population, regions!inner(iso_code)')
                .limit(5000);

            if (places?.length) {
                const jobs = places.map((p: any) => ({
                    job_type: 'city_page',
                    key: `${p.regions.iso_code.toLowerCase()}|${p.slug}`,
                    priority: p.seo_tier === 'primary' ? 100 : p.seo_tier === 'secondary' ? 80 : p.seo_tier === 'tertiary' ? 60 : 40,
                }));

                for (let i = 0; i < jobs.length; i += 500) {
                    const batch = jobs.slice(i, i + 500);
                    const { error } = await svc.from('content_jobs').upsert(batch, {
                        onConflict: 'job_type,key',
                        ignoreDuplicates: true
                    });
                    if (!error) stats.city_jobs += batch.length;
                }
            }
        } catch { stats.errors++; }

        // ── 3. Enqueue FAQ pages (clusters × states) ────────────────────
        try {
            const { data: clusters } = await svc
                .from('faq_clusters')
                .select('cluster_slug, priority');
            const { data: regions } = await svc
                .from('regions')
                .select('slug, iso_code')
                .eq('type', 'state');

            if (clusters?.length && regions?.length) {
                const jobs: any[] = [];
                for (const cluster of clusters) {
                    for (const region of regions) {
                        jobs.push({
                            job_type: 'faq_page',
                            key: `${cluster.cluster_slug}|${region.slug}`,
                            priority: cluster.priority,
                        });
                    }
                }
                for (let i = 0; i < jobs.length; i += 500) {
                    const batch = jobs.slice(i, i + 500);
                    const { error } = await svc.from('content_jobs').upsert(batch, {
                        onConflict: 'job_type,key',
                        ignoreDuplicates: true
                    });
                    if (!error) stats.faq_jobs += batch.length;
                }
            }
        } catch { stats.errors++; }

        // ── 4. Enqueue industry × location pages ────────────────────────
        try {
            const { data: matrix } = await svc
                .from('industry_location')
                .select('industry_slug, region_slug, search_priority')
                .eq('enriched', false)
                .limit(5000);

            if (matrix?.length) {
                const jobs = matrix.map((m: any) => ({
                    job_type: 'industry_location',
                    key: `${m.industry_slug}|${m.region_slug.toLowerCase()}`,
                    priority: m.search_priority,
                }));
                for (let i = 0; i < jobs.length; i += 500) {
                    const batch = jobs.slice(i, i + 500);
                    const { error } = await svc.from('content_jobs').upsert(batch, {
                        onConflict: 'job_type,key',
                        ignoreDuplicates: true
                    });
                    if (!error) stats.industry_jobs += batch.length;
                }
            }
        } catch { stats.errors++; }

        // Log success
        const totalEnqueued = stats.county_jobs + stats.city_jobs + stats.faq_jobs + stats.industry_jobs;
        if (cronRun?.id) {
            await svc.from('cron_runs').update({
                finished_at: new Date().toISOString(),
                status: 'success',
                items_enqueued: totalEnqueued,
                metadata: stats,
            }).eq('id', cronRun.id);
        }

        return NextResponse.json({ status: 'enqueued', stats, timestamp: new Date().toISOString() });
    } catch (err: any) {
        if (cronRun?.id) {
            await svc.from('cron_runs').update({
                finished_at: new Date().toISOString(),
                status: 'failed',
                error_sample: err?.message?.slice(0, 500),
            }).eq('id', cronRun.id);
        }
        return NextResponse.json({ status: 'error', error: err?.message }, { status: 500 });
    }
}
