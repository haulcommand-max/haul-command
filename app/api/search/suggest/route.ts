import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/search/suggest?q=tex&country=us&language=en
// Canonical autocomplete route for operators, corridors, places, rates, and localized role terminology.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const country = searchParams.get('country') ?? null;
  const language = searchParams.get('language') ?? searchParams.get('lang') ?? null;

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const supabase = createClient();
  const term = `%${q}%`;
  const countryCode = country?.trim().toUpperCase() || null;
  const languageCode = language?.trim().toLowerCase() || null;

  const operatorQuery = supabase
    .from('hc_global_operators')
    .select('id, name, city, admin1_code, country_code, slug')
    .or(`name.ilike.${term},city.ilike.${term}`)
    .order('confidence_score', { ascending: false })
    .limit(5);

  const placeQuery = supabase
    .from('hc_places')
    .select('id, name, city, state_code, country_code, slug')
    .or(`name.ilike.${term},city.ilike.${term}`)
    .limit(4);

  const rateQuery = supabase
    .from('hc_rates_public')
    .select('surface_key, jurisdiction_slug, country_slug')
    .ilike('jurisdiction_slug', term)
    .limit(3);

  const roleAliasQuery = supabase
    .from('hc_role_aliases')
    .select('role_key, alias_text, country_code, language_code, alias_type')
    .ilike('alias_text', term)
    .order('sort_order', { ascending: true })
    .limit(5);

  const roleVocabQuery = supabase
    .from('hc_role_country_vocab')
    .select('role_key, country_code, language_code, local_title, local_aliases, commercial_title, legal_title')
    .or(`local_title.ilike.${term},commercial_title.ilike.${term},legal_title.ilike.${term}`)
    .limit(5);

  if (countryCode) {
    operatorQuery.eq('country_code', countryCode);
    placeQuery.eq('country_code', countryCode);
    rateQuery.eq('country_slug', countryCode.toLowerCase());
    roleAliasQuery.eq('country_code', countryCode);
    roleVocabQuery.eq('country_code', countryCode);
  } else {
    operatorQuery.gte('confidence_score', 0);
  }

  if (languageCode) {
    roleAliasQuery.eq('language_code', languageCode);
    roleVocabQuery.eq('language_code', languageCode);
  }

  const [operators, corridors, places, rates, roleAliases, roleVocab] = await Promise.allSettled([
    // Operators matching name or city
    operatorQuery,

    // Corridors matching name
    supabase
      .from('hc_corridors')
      .select('id, corridor_key, start_state, end_state')
      .ilike('corridor_key', term)
      .limit(3),

    // Places matching name or city
    placeQuery,

    // Rate pages matching jurisdiction
    rateQuery,

    // Localized role aliases from the canonical role catalog
    roleAliasQuery,

    // Country-specific role vocabulary from the role/entity spine
    roleVocabQuery,
  ]);

  const suggestions: Array<{ type: string; label: string; href: string; sub?: string }> = [];

  // Operators
  if (operators.status === 'fulfilled' && operators.value.data) {
    for (const op of operators.value.data) {
      suggestions.push({
        type: 'operator',
        label: op.name,
        sub: [op.city, op.admin1_code, op.country_code].filter(Boolean).join(', '),
        href: `/directory/dossier/${op.slug || op.id}`,
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
        sub: `${c.start_state} -> ${c.end_state}`,
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

  const seenRoleKeys = new Set<string>();
  if (roleAliases.status === 'fulfilled' && roleAliases.value.data) {
    for (const role of roleAliases.value.data) {
      if (seenRoleKeys.has(role.role_key)) continue;
      seenRoleKeys.add(role.role_key);
      suggestions.push({
        type: 'role',
        label: role.alias_text,
        sub: [role.country_code, role.language_code, role.alias_type].filter(Boolean).join(' · '),
        href: `/directory?role=${encodeURIComponent(role.role_key)}${role.country_code ? `&country=${encodeURIComponent(role.country_code)}` : ''}`,
      });
    }
  }

  if (roleVocab.status === 'fulfilled' && roleVocab.value.data) {
    for (const role of roleVocab.value.data) {
      if (seenRoleKeys.has(role.role_key)) continue;
      seenRoleKeys.add(role.role_key);
      suggestions.push({
        type: 'role',
        label: role.local_title || role.commercial_title || role.legal_title,
        sub: [role.country_code, role.language_code, ...(role.local_aliases ?? []).slice(0, 2)].filter(Boolean).join(' · '),
        href: `/directory?role=${encodeURIComponent(role.role_key)}&country=${encodeURIComponent(role.country_code)}`,
      });
    }
  }

  return NextResponse.json({
    suggestions: suggestions.slice(0, 8),
    query: q,
  });
}
