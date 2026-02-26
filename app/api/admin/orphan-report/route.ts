import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/orphan-report
 *
 * Scans glossary concepts and geo pages for orphan risk.
 * An orphan = a page with fewer than 2 internal links pointing to it.
 *
 * Auth: CRON_SECRET or service_role
 */

export async function GET(req: Request) {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret') || req.headers.get('x-ops-secret');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Check glossary concepts without any term variants
    const { data: conceptsWithoutVariants } = await supabase
        .from('glossary_concepts')
        .select('concept_slug, concept_name')
        .not('concept_slug', 'in', (
            await supabase
                .from('glossary_term_variants')
                .select('concept_slug')
                .eq('noindex', false)
        ).data?.map(v => v.concept_slug).join(',') || '___none___');

    // Check country variant coverage
    const { data: variantCounts } = await supabase
        .rpc('get_variant_coverage_summary')
        .select('*');

    // Direct query fallback if RPC doesn't exist
    const { data: allVariants } = await supabase
        .from('glossary_term_variants')
        .select('concept_slug, country_code, noindex');

    // Build coverage matrix
    const coverageMap: Record<string, { total: number; indexed: number; countries: string[] }> = {};

    for (const v of allVariants || []) {
        if (!coverageMap[v.concept_slug]) {
            coverageMap[v.concept_slug] = { total: 0, indexed: 0, countries: [] };
        }
        coverageMap[v.concept_slug].total++;
        if (!v.noindex) coverageMap[v.concept_slug].indexed++;
        if (!coverageMap[v.concept_slug].countries.includes(v.country_code)) {
            coverageMap[v.concept_slug].countries.push(v.country_code);
        }
    }

    // Identify orphan risks
    const { data: allConcepts } = await supabase
        .from('glossary_concepts')
        .select('concept_slug, concept_name, category');

    const orphanRisk: { slug: string; name: string; reason: string }[] = [];
    const wellLinked: string[] = [];

    for (const concept of allConcepts || []) {
        const coverage = coverageMap[concept.concept_slug];
        if (!coverage) {
            orphanRisk.push({
                slug: concept.concept_slug,
                name: concept.concept_name,
                reason: 'No term variants at all',
            });
        } else if (coverage.indexed === 0) {
            orphanRisk.push({
                slug: concept.concept_slug,
                name: concept.concept_name,
                reason: `${coverage.total} variants but all noindex`,
            });
        } else if (coverage.countries.length < 2) {
            orphanRisk.push({
                slug: concept.concept_slug,
                name: concept.concept_name,
                reason: `Only in ${coverage.countries.join(', ')} — low cross-linking`,
            });
        } else {
            wellLinked.push(concept.concept_slug);
        }
    }

    // Country coverage summary
    const countryCounts: Record<string, { total: number; indexed: number }> = {};
    for (const v of allVariants || []) {
        if (!countryCounts[v.country_code]) {
            countryCounts[v.country_code] = { total: 0, indexed: 0 };
        }
        countryCounts[v.country_code].total++;
        if (!v.noindex) countryCounts[v.country_code].indexed++;
    }

    return NextResponse.json({
        generated_at: new Date().toISOString(),
        total_concepts: allConcepts?.length || 0,
        orphan_risk_count: orphanRisk.length,
        well_linked_count: wellLinked.length,
        orphan_risks: orphanRisk,
        country_coverage: countryCounts,
        recommendations: [
            orphanRisk.length > 10 ? 'HIGH: Over 10 concepts at orphan risk — seed more term variants' : null,
            Object.values(countryCounts).some(c => c.indexed < 5) ? 'MEDIUM: Some countries have fewer than 5 indexed terms' : null,
        ].filter(Boolean),
    });
}
