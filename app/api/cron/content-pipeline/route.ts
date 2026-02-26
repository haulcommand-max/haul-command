export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/cron/content-pipeline
 * 
 * The missing engine — processes content_jobs queue:
 * 1. Picks highest-priority queued jobs
 * 2. Generates page content (enrich + link + schema)
 * 3. Marks done or failed
 * 
 * Schedule: Every 15 minutes via cron
 * Batch size: 50 jobs per run (safe for serverless)
 */

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

export async function POST(req: Request) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = getSupabase();
    const started = Date.now();

    // 1. Pick batch of queued jobs, highest priority first
    const { data: jobs, error: fetchErr } = await svc
        .from('content_jobs')
        .select('*')
        .eq('status', 'queued')
        .lt('attempts', MAX_ATTEMPTS)
        .order('priority', { ascending: false })
        .limit(BATCH_SIZE);

    if (fetchErr || !jobs?.length) {
        return NextResponse.json({
            status: 'idle',
            message: fetchErr?.message ?? 'No queued jobs',
            duration_ms: Date.now() - started,
        });
    }

    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
        // Mark running
        await svc
            .from('content_jobs')
            .update({ status: 'running', attempts: job.attempts + 1, updated_at: new Date().toISOString() })
            .eq('id', job.id);

        try {
            const slug = await processJob(svc, job);
            await svc
                .from('content_jobs')
                .update({ status: 'done', output_slug: slug, updated_at: new Date().toISOString() })
                .eq('id', job.id);
            processed++;
        } catch (err: any) {
            await svc
                .from('content_jobs')
                .update({
                    status: job.attempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'queued',
                    last_error: err?.message?.slice(0, 500),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', job.id);
            failed++;
        }
    }

    return NextResponse.json({
        status: 'completed',
        batch_size: jobs.length,
        processed,
        failed,
        duration_ms: Date.now() - started,
    });
}

async function processJob(svc: any, job: any): Promise<string> {
    switch (job.job_type) {
        case 'county_page':
            return generateCountyPage(svc, job);
        case 'city_page':
            return generateCityPage(svc, job);
        case 'faq_page':
            return generateFaqPage(svc, job);
        case 'industry_location':
            return generateIndustryLocationPage(svc, job);
        default:
            throw new Error(`Unknown job type: ${job.job_type}`);
    }
}

async function generateCountyPage(svc: any, job: any): Promise<string> {
    const [state, countySlug] = job.key.split('|');
    const slug = `pilot-car/${state}/${countySlug}`;

    // Enrich: fetch county data + nearby escorts + corridor links
    const { data: county } = await svc
        .from('counties')
        .select('*, regions!inner(iso_code, name, slug)')
        .eq('slug', countySlug)
        .single();

    if (!county) throw new Error(`County not found: ${countySlug}`);

    // Generate SEO page record
    const title = `Pilot Car Service ${county.name} County, ${county.regions.name}`;
    const description = `Find verified pilot car operators in ${county.name} County, ${county.regions.name}. Oversize load escort services for ${county.regions.iso_code} county routes.`;

    await svc.from('seo_pages').upsert({
        slug,
        title,
        meta_description: description,
        h1: `${county.name} County Pilot Car & Escort Service`,
        type: 'county',
        region: county.regions.iso_code,
        country: 'US',
        status: county.seo_tier === 'longtail' ? 'draft' : 'published',
        updated_at: new Date().toISOString(),
    }, { onConflict: 'slug' });

    return slug;
}

async function generateCityPage(svc: any, job: any): Promise<string> {
    const [state, citySlug] = job.key.split('|');
    const slug = `pilot-car/${state}/${citySlug}`;

    await svc.from('seo_pages').upsert({
        slug,
        title: `Pilot Car Service ${citySlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}, ${state.toUpperCase()}`,
        meta_description: `Verified pilot car and oversize load escort operators in ${citySlug.replace(/-/g, ' ')}, ${state.toUpperCase()}.`,
        h1: `Pilot Car Service — ${citySlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}, ${state.toUpperCase()}`,
        type: 'city',
        region: state.toUpperCase(),
        country: 'US',
        status: 'published',
        updated_at: new Date().toISOString(),
    }, { onConflict: 'slug' });

    return slug;
}

async function generateFaqPage(svc: any, job: any): Promise<string> {
    const [clusterSlug, locationKey] = job.key.split('|');
    const slug = `answers/${clusterSlug}/${locationKey}`;

    const { data: cluster } = await svc
        .from('faq_clusters')
        .select('*')
        .eq('cluster_slug', clusterSlug)
        .single();

    if (!cluster) throw new Error(`FAQ cluster not found: ${clusterSlug}`);

    const location = locationKey.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const question = cluster.question_template.replace(/{location}/g, location);
    const answer = cluster.answer_template.replace(/{location}/g, location);

    await svc.from('seo_pages').upsert({
        slug,
        title: question,
        meta_description: answer.slice(0, 160),
        h1: question,
        type: 'faq',
        content_md: `<p>${answer}</p>`,
        status: 'published',
        updated_at: new Date().toISOString(),
    }, { onConflict: 'slug' });

    return slug;
}

async function generateIndustryLocationPage(svc: any, job: any): Promise<string> {
    const [industry, region] = job.key.split('|');
    const slug = `industry/${industry}/pilot-car/${region}`;

    const industryName = industry.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const regionName = region.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    await svc.from('seo_pages').upsert({
        slug,
        title: `${industryName} Pilot Car Service ${regionName}`,
        meta_description: `Find ${industryName.toLowerCase()} pilot car and escort operators in ${regionName}. Verified oversize load escort services.`,
        h1: `${industryName} Escort Service — ${regionName}`,
        type: 'industry_location',
        region: region.toUpperCase(),
        country: 'US',
        status: 'published',
        updated_at: new Date().toISOString(),
    }, { onConflict: 'slug' });

    // Mark industry_location as enriched
    await svc
        .from('industry_location')
        .update({ enriched: true, noindex: false })
        .eq('industry_slug', industry)
        .eq('region_slug', region.toUpperCase());

    return slug;
}
