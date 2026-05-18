import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';

// Haul Command OS
// Task 36: Provide a search endpoint for the training school marketplace.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (q.length < 2) {
    return NextResponse.json({
      query: q,
      results_found: 0,
      providers: [],
      source: 'query_too_short',
    });
  }

  const safeQuery = q.replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (safeQuery.length < 2) {
    return NextResponse.json({
      query: q,
      results_found: 0,
      providers: [],
      source: 'query_too_short',
    });
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('hc_provider_search_index')
    .select('provider_id, provider_slug, title, subtitle, location_label, badges_json, organic_rank_score, quality_guardrail_pass, last_updated_at')
    .or(`title.ilike.%${safeQuery}%,location_label.ilike.%${safeQuery}%`)
    .eq('quality_guardrail_pass', true)
    .order('organic_rank_score', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({
      query: q,
      results_found: 0,
      providers: [],
      source: 'hc_provider_search_index_unavailable',
      error: 'provider_search_not_configured',
    });
  }

  const providers = (data ?? []).map((provider) => ({
    id: provider.provider_id,
    slug: provider.provider_slug,
    name: provider.title,
    region: provider.location_label,
    subtitle: provider.subtitle,
    badges: provider.badges_json,
    quality_guardrail_pass: provider.quality_guardrail_pass,
    last_updated_at: provider.last_updated_at,
  }));

  return NextResponse.json({
    query: q,
    results_found: providers.length,
    providers,
    source: 'hc_provider_search_index',
  });
}
