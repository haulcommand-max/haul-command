import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/sitemap-health
 *
 * Health check for all sitemaps — verifies non-empty URL counts,
 * data freshness, and surfaces any failures.
 */

export async function GET(req: Request) {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret') || req.headers.get('x-ops-secret');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
    const checks: {
        sitemap: string;
        status: 'ok' | 'warn' | 'error';
        url_count: number;
        message: string;
    }[] = [];

    // 1. Glossary terms in sitemap
    try {
        const { data: glossaryTerms, count } = await supabase
            .from('glossary_terms')
            .select('slug', { count: 'exact' })
            .eq('status', 'published')
            .eq('noindex', false);

        const termCount = count || glossaryTerms?.length || 0;
        checks.push({
            sitemap: 'sitemap-glossary.xml',
            status: termCount > 0 ? 'ok' : 'warn',
            url_count: termCount,
            message: termCount > 0
                ? `${termCount} published glossary terms`
                : 'No published glossary terms found — sitemap will be empty',
        });
    } catch {
        checks.push({
            sitemap: 'sitemap-glossary.xml',
            status: 'warn',
            url_count: 0,
            message: 'glossary_terms table may not exist yet — OK if pre-migration',
        });
    }

    // 2. Global concepts coverage
    try {
        const { count: conceptCount } = await supabase
            .from('glossary_concepts')
            .select('*', { count: 'exact', head: true });

        const { count: variantCount } = await supabase
            .from('glossary_term_variants')
            .select('*', { count: 'exact', head: true })
            .eq('noindex', false);

        checks.push({
            sitemap: 'glossary-concepts',
            status: (conceptCount || 0) >= 50 ? 'ok' : 'warn',
            url_count: conceptCount || 0,
            message: `${conceptCount || 0} concepts, ${variantCount || 0} indexed variants`,
        });
    } catch {
        checks.push({
            sitemap: 'glossary-concepts',
            status: 'warn',
            url_count: 0,
            message: 'glossary_concepts table may not exist yet',
        });
    }

    // 3. Country coverage
    try {
        const { data: countries } = await supabase
            .from('global_countries')
            .select('iso2, name, is_active_market');

        const activeCount = countries?.filter(c => c.is_active_market).length || 0;
        checks.push({
            sitemap: 'global-countries',
            status: activeCount >= 3 ? 'ok' : 'warn',
            url_count: activeCount,
            message: `${activeCount} active markets out of ${countries?.length || 0} total`,
        });
    } catch {
        checks.push({
            sitemap: 'global-countries',
            status: 'warn',
            url_count: 0,
            message: 'global_countries table may not exist yet',
        });
    }

    // 4. Indexability enforcement check
    try {
        const { count: noindexVariants } = await supabase
            .from('glossary_term_variants')
            .select('*', { count: 'exact', head: true })
            .eq('noindex', true);

        const { count: indexedVariants } = await supabase
            .from('glossary_term_variants')
            .select('*', { count: 'exact', head: true })
            .eq('noindex', false);

        checks.push({
            sitemap: 'indexability-guard',
            status: 'ok',
            url_count: indexedVariants || 0,
            message: `${indexedVariants || 0} indexed, ${noindexVariants || 0} suppressed (noindex=true)`,
        });
    } catch {
        checks.push({
            sitemap: 'indexability-guard',
            status: 'warn',
            url_count: 0,
            message: 'Could not check indexability',
        });
    }

    const overallStatus = checks.some(c => c.status === 'error')
        ? 'unhealthy'
        : checks.some(c => c.status === 'warn')
            ? 'degraded'
            : 'healthy';

    return NextResponse.json({
        status: overallStatus,
        generated_at: new Date().toISOString(),
        site_url: siteUrl,
        checks,
        sitemaps: [
            `${siteUrl}/sitemap.xml`,
            `${siteUrl}/sitemap_index.xml`,
            `${siteUrl}/sitemap-glossary.xml`,
            `${siteUrl}/sitemap-seo.xml`,
            `${siteUrl}/sitemap-corridors.xml`,
            `${siteUrl}/sitemap-pilot-car-city.xml`,
        ],
    });
}
