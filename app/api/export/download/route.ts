import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { DATA_PRODUCT_CATALOG } from '@/lib/monetization/data-product-engine';
import { HC_15X_DATA_PRODUCTS } from '@/lib/monetization/data-product-15x-catalog';

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only route */ },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return 'notice\nNo rows matched this export. Try a broader market or lower confidence floor.\n';
  const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(',')),
  ].join('\n');
}

function knownProduct(productId: string) {
  return DATA_PRODUCT_CATALOG.some(product => product.id === productId)
    || HC_15X_DATA_PRODUCTS.some(product => product.id === productId);
}

function publicPreviewColumns(row: any) {
  return {
    product_id: row.product_id,
    market_name: row.market_name,
    country_code: row.country_code,
    region_code: row.region_code,
    corridor_code: row.corridor_code,
    port_code: row.port_code,
    border_crossing_code: row.border_crossing_code,
    industrial_zone_code: row.industrial_zone_code,
    maturity_status: row.maturity_status,
    confidence_score: row.confidence_score,
    confidence_band: row.confidence_band,
    freshness_window: row.freshness_window,
    source_class: row.source_class,
    privacy_class: row.privacy_class,
    demand_score: row.demand_score,
    scarcity_score: row.scarcity_score,
    liquidity_score: row.liquidity_score,
    port_pressure_score: row.port_pressure_score,
    permit_complexity_score: row.permit_complexity_score,
    infrastructure_fit_score: row.infrastructure_fit_score,
    broker_activity_density: row.broker_activity_density,
    operator_density: row.operator_density,
    claimed_listing_count: row.claimed_listing_count,
    unclaimed_listing_count: row.unclaimed_listing_count,
    active_corridor_count: row.active_corridor_count,
    active_port_count: row.active_port_count,
    religious_holiday_flags: row.religious_holiday_flags,
    cultural_localization: row.cultural_localization,
    source_summary: row.source_summary,
    last_observed_at: row.last_observed_at,
    computed_at: row.computed_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const productId = String(url.searchParams.get('product') || url.searchParams.get('type') || '').trim();
    const countryCode = String(url.searchParams.get('country') || 'ALL').toUpperCase();
    const corridorCode = url.searchParams.get('corridor');
    const regionCode = url.searchParams.get('region');
    const format = String(url.searchParams.get('format') || 'csv').toLowerCase();
    const confidenceFloor = Math.max(0, Math.min(1, Number(url.searchParams.get('confidence_floor') || '0.35')));

    if (!productId || !knownProduct(productId)) {
      return NextResponse.json({ error: 'Known data product is required' }, { status: 400 });
    }

    if (!['csv', 'json', 'geojson'].includes(format)) {
      return NextResponse.json({ error: 'format must be csv, json, or geojson' }, { status: 400 });
    }

    const user = await getSupabaseUser();
    const supabase = getSupabaseAdmin();

    let hasUnlock = false;
    if (user?.id) {
      let purchaseQuery = supabase
        .from('data_purchases')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('country_code', countryCode)
        .eq('status', 'active')
        .limit(1);

      if (corridorCode) purchaseQuery = purchaseQuery.eq('corridor_code', corridorCode);
      const { data: purchases } = await purchaseQuery;
      hasUnlock = Boolean((purchases || []).some((purchase: any) => !purchase.expires_at || new Date(purchase.expires_at) > new Date()));
    }

    const rowLimit = hasUnlock ? 5000 : 100;
    let query = supabase
      .from('data_product_market_snapshots')
      .select('*')
      .eq('product_id', productId)
      .gte('confidence_score', confidenceFloor)
      .order('computed_at', { ascending: false })
      .limit(rowLimit);

    if (countryCode !== 'ALL') query = query.eq('country_code', countryCode);
    if (corridorCode) query = query.eq('corridor_code', corridorCode);
    if (regionCode) query = query.eq('region_code', regionCode);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map(publicPreviewColumns);

    const { data: job } = await supabase.from('data_product_export_jobs').insert({
      user_id: user?.id || null,
      email: user?.email || null,
      product_id: productId,
      country_code: countryCode,
      region_code: regionCode,
      corridor_code: corridorCode,
      export_format: format,
      status: 'ready',
      row_count: rows.length,
      row_limit: rowLimit,
      filters: {
        country: countryCode,
        region: regionCode,
        corridor: corridorCode,
        confidence_floor: confidenceFloor,
        unlocked: hasUnlock,
      },
      redaction_policy: hasUnlock ? 'paid_redacted' : 'public_preview_redacted',
      confidence_floor: confidenceFloor,
      completed_at: new Date().toISOString(),
    }).select('id').single();

    await supabase.from('data_product_export_events').insert({
      export_job_id: job?.id || null,
      user_id: user?.id || null,
      email: user?.email || null,
      event_type: 'export_downloaded',
      product_id: productId,
      country_code: countryCode,
      properties: {
        format,
        row_count: rows.length,
        unlocked: hasUnlock,
        confidence_floor: confidenceFloor,
      },
    });

    if (format === 'json') {
      return NextResponse.json({
        product_id: productId,
        country_code: countryCode,
        unlocked: hasUnlock,
        redaction_policy: hasUnlock ? 'paid_redacted' : 'public_preview_redacted',
        row_count: rows.length,
        rows,
      });
    }

    if (format === 'geojson') {
      return NextResponse.json({
        type: 'FeatureCollection',
        metadata: {
          product_id: productId,
          country_code: countryCode,
          unlocked: hasUnlock,
          redaction_policy: hasUnlock ? 'paid_redacted' : 'public_preview_redacted',
          row_count: rows.length,
        },
        features: rows.map(row => ({
          type: 'Feature',
          geometry: null,
          properties: row,
        })),
      });
    }

    return new NextResponse(toCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="haul-command-${productId}-${countryCode}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('[Data Export Error]', err);
    return NextResponse.json({ error: err?.message || 'Export failed' }, { status: 500 });
  }
}
