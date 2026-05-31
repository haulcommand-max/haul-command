import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { buildAdgridEventInsert } from '@/lib/monetization/adgrid-serving';

type AdGridSlotRow = {
  id: string;
  surface: string;
  country_code: string | null;
  region_code: string | null;
  corridor_slug: string | null;
  headline: string;
  subline: string | null;
  cta_label: string | null;
  cta_href: string | null;
  badge_label: string | null;
  image_url: string | null;
  advertiser_name: string | null;
  priority_score: number | null;
  impressions: number | null;
};

function normalizeSurface(slotType: string | null, pageFamily: string | null) {
  const raw = (slotType || pageFamily || 'empty_market').toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  const known = new Set(['corridor', 'country', 'region', 'city', 'tool', 'glossary', 'regulations', 'leaderboard', 'empty_market', 'claim_listing', 'data_product']);
  return known.has(raw) ? raw : 'empty_market';
}

function sponsorFromRow(row: AdGridSlotRow) {
  return {
    id: row.id,
    sponsor_name: row.advertiser_name ?? row.badge_label ?? 'Haul Command sponsor',
    sponsor_logo_url: row.image_url,
    headline: row.headline,
    body: row.subline,
    cta_text: row.cta_label ?? 'Learn More',
    cta_url: row.cta_href ?? '/advertise',
    accent_color: '#D4A844',
    surface: row.surface,
    market: row.corridor_slug ?? row.region_code ?? row.country_code ?? 'global',
    priority_score: row.priority_score ?? 50,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slotType = searchParams.get('slotType');
  const market = (searchParams.get('market') || '').toLowerCase();
  const pageFamily = searchParams.get('pageFamily');
  const surface = normalizeSurface(slotType, pageFamily);
  const now = new Date().toISOString();

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('hc_adgrid_slots')
      .select('id, surface, country_code, region_code, corridor_slug, headline, subline, cta_label, cta_href, badge_label, image_url, advertiser_name, priority_score, impressions')
      .eq('surface', surface)
      .eq('status', 'active')
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('priority_score', { ascending: false })
      .limit(25);

    const rows = (data ?? []) as AdGridSlotRow[];
    const matched = rows.find((row) => {
      const keys = [row.corridor_slug, row.region_code, row.country_code, 'global']
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return !market || keys.includes(market) || keys.some((key) => market.includes(key));
    }) ?? rows[0] ?? null;

    if (matched) {
      await supabase
        .from('hc_adgrid_slots' as never)
        .update({
          impressions: Number(matched.impressions ?? 0) + 1,
          last_impression_at: now,
        } as never)
        .eq('id' as never, matched.id);
      const event = buildAdgridEventInsert({
        eventType: 'impression',
        slotId: matched.id,
        surface,
        zone: matched.surface,
        countryCode: matched.country_code,
        corridorSlug: matched.corridor_slug,
        userAgentSummary: req.headers.get('user-agent')?.slice(0, 180) ?? null,
      });
      await supabase.from(event.table).insert(event.payload);
    }

    return NextResponse.json({ sponsor: matched ? sponsorFromRow(matched) : null, tracking: { impression_logged: Boolean(matched) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown AdGrid slot error';
    console.error('[AdGrid Slot Error]', message);
    return NextResponse.json({ sponsor: null });
  }
}
