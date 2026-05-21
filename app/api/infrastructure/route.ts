import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Infrastructure API - route-support graph.
 *
 * Public infrastructure discovery reads the canonical directory_entities
 * readiness view. Source tables such as truck_stops remain specialized
 * inputs, not competing public directories.
 */

export const dynamic = 'force-dynamic';

const CATEGORY_SUBTYPES: Record<string, string[]> = {
  truck_stop: ['truck_stop', 'fuel_station', 'cat_scale_location'],
  rest_area: ['rest_area'],
  weigh_station: ['weigh_station'],
  truck_parking: ['truck_parking', 'staging_yard', 'industrial_yard', 'drop_yard', 'secure_storage', 'escort_staging_zone'],
  port: ['port', 'shipyard', 'lng_terminal'],
  rail_intermodal: ['rail_intermodal', 'freight_terminal'],
  border_crossing: ['border_crossing'],
  tunnel: ['tunnel', 'tunnel_authority'],
  truck_repair: ['truck_repair_shop', 'mobile_mechanic', 'tire_service', 'heavy_tow_service', 'truck_wash'],
};

const CATEGORIES = Object.keys(CATEGORY_SUBTYPES);

function categoryForSubtype(subtype: string | null | undefined) {
  const value = subtype || '';
  return Object.entries(CATEGORY_SUBTYPES).find(([, subtypes]) => subtypes.includes(value))?.[0] || value || 'infrastructure';
}

function serviceLabels(row: any) {
  return [
    row.restrooms_available && 'Restrooms',
    row.wifi_available && 'WiFi',
    row.overnight_allowed && 'Overnight',
    row.security_presence && row.security_presence !== 'unknown' && 'Security notes',
    row.open_status && row.open_status !== 'unknown' && `Status: ${row.open_status}`,
    row.approved_report_count > 0 && `${row.approved_report_count} field reports`,
  ].filter(Boolean);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const state = searchParams.get('state');
  const corridor = searchParams.get('corridor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  try {
    const supabase = getSupabaseAdmin();
    const categorySubtypes = category ? CATEGORY_SUBTYPES[category] : null;

    let query = supabase
      .from('v_hc_public_infrastructure_readiness')
      .select(`
        entity_id,
        hc_id,
        entity_subtype,
        entity_family,
        name,
        display_name,
        city,
        admin1_code,
        country_code,
        claim_status,
        is_claimable,
        approved_report_count,
        last_observed_at,
        safety_rating,
        cleanliness_rating,
        lighting_rating,
        open_status,
        wifi_available,
        restrooms_available,
        overnight_allowed,
        security_presence,
        latest_oversized_access_notes,
        latest_hazard_notes,
        latest_amenity_notes,
        readiness_state,
        steward_claim_route
      `, { count: 'exact' })
      .limit(limit);

    if (state) {
      query = query.eq('admin1_code', state.toUpperCase());
    }

    if (categorySubtypes) {
      query = query.in('entity_subtype', categorySubtypes);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const locations = (data || []).map((row: any) => ({
      id: row.entity_id,
      hc_id: row.hc_id,
      name: row.display_name || row.name,
      category: categoryForSubtype(row.entity_subtype),
      entity_subtype: row.entity_subtype,
      city: row.city || '',
      state: row.admin1_code || '',
      country_code: row.country_code,
      is_claimed: ['claimed', 'verified'].includes(String(row.claim_status || '')),
      is_claimable: row.is_claimable,
      services: serviceLabels(row),
      oversize_friendly: Boolean(row.latest_oversized_access_notes || row.overnight_allowed),
      readiness_state: row.readiness_state,
      safety_rating: row.safety_rating,
      lighting_rating: row.lighting_rating,
      open_status: row.open_status,
      oversized_access_notes: row.latest_oversized_access_notes,
      hazard_notes: row.latest_hazard_notes,
      steward_claim_route: row.steward_claim_route,
    }));

    const categorySummary: Record<string, number> = {};
    locations.forEach((location) => {
      categorySummary[location.category] = (categorySummary[location.category] || 0) + 1;
    });

    return NextResponse.json({
      locations,
      total: count || locations.length,
      categories: CATEGORIES,
      category_summary: categorySummary,
      filters: { category, state, corridor },
      source: 'v_hc_public_infrastructure_readiness',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Infrastructure query failed', details: error?.message },
      { status: 500 },
    );
  }
}
