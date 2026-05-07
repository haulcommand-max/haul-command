import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/search/suggest?q=tex&country=us
// Returns fast autocomplete suggestions from operators, corridors, places, and pages
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const country = searchParams.get('country') ?? null;

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const supabase = createClient();
  const term = `%${q}%`;

  // Run 4 queries in parallel
  const [operators, corridors, places, rates] = await Promise.allSettled([
    // Operators matching name or city
    supabase
      .from('hc_global_operators')
      .select('id, name, city, admin1_code, country_code, slug')
      .or(`name.ilike.${term},city.ilike.${term}`)
      .eq(...(country ? ['country_code', country.toUpperCase()] : ['confidence_score', 'gte.0']))
      .order('confidence_score', { ascending: false })
      .limit(5),

    // Corridors matching name
    supabase
      .from('hc_corridors')
      .select('id, corridor_key, start_state, end_state')
      .ilike('corridor_key', term)
      .limit(3),

    // Places matching name or city
    supabase
      .from('hc_places')
      .select('id, name, city, state_code, country_code, slug')
      .or(`name.ilike.${term},city.ilike.${term}`)
      .limit(4),

    // Rate pages matching jurisdiction
    supabase
      .from('hc_rates_public')
      .select('surface_key, jurisdiction_slug, country_slug')
      .ilike('jurisdiction_slug', term)
      .limit(3),
  ]);

  const suggestions: Array<{ type: string; label: string; href: string; sub?: string }> = [];

  // Operators
  if (operators.status === 'fulfilled' && operators.value.data) {
    for (const op of operators.value.data) {
      suggestions.push({
        type: 'operator',
        label: op.name,
        sub: [op.city, op.admin1_code, op.country_code].filter(Boolean).join(', '),
        href: `/directory/${(op.country_code ?? 'us').toLowerCase()}/${op.slug}`,
      });
    }
  }

  // Corridors
  if (corridors.status === 'fulfilled' && corridors.value.data) {
    for (const c of corridors.value.data) {
      const label = c.corridor_key.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      suggestions.push({
        type: 'corridor',
        label,
        sub: `${c.start_state} → ${c.end_state}`,
        href: `/corridors/${c.corridor_key}`,
      });
    }
  }

  // Places
  if (places.status === 'fulfilled' && places.value.data) {
    for (const p of places.value.data) {
      suggestions.push({
        type: 'place',
        label: p.name ?? p.city,
        sub: [p.city, p.state_code, p.country_code].filter(Boolean).join(', '),
        href: `/trucker-services/${p.slug}`,
      });
    }
  }

  // Rates
  if (rates.status === 'fulfilled' && rates.value.data) {
    for (const r of rates.value.data) {
      suggestions.push({
        type: 'rate',
        label: `${r.jurisdiction_slug.toUpperCase()} Pilot Car Rates`,
        sub: 'Rate intelligence',
        href: `/rates/${r.country_slug}`,
      });
    }
  }

  return NextResponse.json({
    suggestions: suggestions.slice(0, 8),
    query: q,
  });
}
