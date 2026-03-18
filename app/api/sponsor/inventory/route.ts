/**
 * GET /api/sponsor/inventory?territory_type=corridor&territory_value=i-10
 *
 * Returns the active sponsor for a given territory, if one exists.
 * Used by SponsoredIntelligenceCell and CorridorSponsorCard to render
 * real paid inventory or fall back to house ads.
 *
 * Schema truth (verified against live DB):
 *   territory_sponsorships: id, sponsor_user_id, territory_type, territory_value, plan, price_cents_monthly, status
 *   profiles: id, display_name, email, role, phone, country, home_state, home_city, ...
 *
 * We join sponsor_user_id → profiles.id to get display_name for the sponsor.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface SponsorInventoryItem {
  id: string;
  sponsor_name: string;
  territory_type: 'state' | 'corridor' | 'city' | 'country';
  territory_value: string;
  plan: 'bronze' | 'silver' | 'gold' | 'exclusive';
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const territoryType = sp.get('territory_type');
  const territoryValue = sp.get('territory_value');

  if (!territoryType || !territoryValue) {
    return NextResponse.json(
      { sponsor: null, house: true, reason: 'missing params' },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' } },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Query only columns that exist in the real schema
    const { data, error } = await supabase
      .from('territory_sponsorships')
      .select('id, sponsor_user_id, territory_type, territory_value, plan, status')
      .eq('territory_type', territoryType)
      .eq('territory_value', territoryValue)
      .eq('status', 'active')
      .order('plan', { ascending: false }) // exclusive > gold > silver > bronze
      .limit(1);

    if (error) {
      console.error('[sponsor/inventory] query error:', error.message);
      return NextResponse.json(
        { sponsor: null, house: true, reason: 'query_error' },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=30' } },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          sponsor: null,
          house: true,
          territory: { type: territoryType, value: territoryValue },
          founding_available: true,
        },
        { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
      );
    }

    const row = data[0];

    // Enrich with profile display_name
    let sponsorName = 'Verified Partner';
    if (row.sponsor_user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', row.sponsor_user_id)
        .maybeSingle();
      if (profile?.display_name) {
        sponsorName = profile.display_name;
      }
    }

    const sponsor: SponsorInventoryItem = {
      id: row.id,
      sponsor_name: sponsorName,
      territory_type: row.territory_type,
      territory_value: row.territory_value,
      plan: row.plan,
    };

    return NextResponse.json(
      { sponsor, house: false, founding_available: false },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
    );
  } catch (err: unknown) {
    console.error('[sponsor/inventory] error:', err);
    return NextResponse.json(
      { sponsor: null, house: true, reason: 'internal_error' },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=30' } },
    );
  }
}
