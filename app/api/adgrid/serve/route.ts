import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/adgrid/serve?surface=directory&corridor=I-10&country=US
 *   — Legacy: serve via DB RPC (serve_adgrid_ad)
 * GET /api/adgrid/serve?zone=homepage_hero&role=pilot
 *   — New: serve from hc_adgrid_inventory by zone + optional role targeting
 *
 * Merged route: tries RPC first (stronger), falls back to direct query.
 */
export async function GET(req: NextRequest) {
    const surface = req.nextUrl.searchParams.get('surface');
    const zone = req.nextUrl.searchParams.get('zone');
    const corridor = req.nextUrl.searchParams.get('corridor');
    const country = req.nextUrl.searchParams.get('country') || 'US';
    const role = req.nextUrl.searchParams.get('role');

    const supabaseAdmin = getSupabaseAdmin();

    try {
        // ── PATH A: legacy RPC approach (strongest — uses bid ranking) ──
        if (surface) {
            const { data, error } = await supabaseAdmin.rpc('serve_adgrid_ad', {
                p_surface: surface,
                p_corridor: corridor,
                p_country: country,
            });

            if (!error && data && Object.keys(data).length > 0) {
                // Track impression
                if (data.creative_id) {
                    supabaseAdmin.from('hc_ad_events').insert({
                        creative_id: data.creative_id,
                        campaign_id: data.campaign_id,
                        event_type: 'impression',
                        surface,
                        corridor_code: corridor,
                        country_code: country,
                    }).then(() => {});
                }
                return NextResponse.json({ ad: data, source: 'adgrid' });
            }
        }

        // ── PATH B: zone-based query (new — for AdGridSlot component) ──
        const queryZone = zone ?? surface ?? 'homepage_hero';

        let query = supabaseAdmin
            .from('hc_adgrid_inventory')
            .select('id, headline, body, cta_label, cta_url, advertiser_name')
            .eq('zone', queryZone)
            .limit(5);

        if (role) {
            query = query.or(`role_targeting.is.null,role_targeting.cs.{${role}}`);
        }

        const { data: ads } = await query;

        if (ads && ads.length > 0) {
            const ad = ads[Math.floor(Math.random() * ads.length)];
            // Log impression async
            supabaseAdmin.from('hc_adgrid_impressions').insert({
                inventory_id: ad.id,
                zone: queryZone,
                role,
                timestamp: new Date().toISOString(),
            }).then(() => {});
            return NextResponse.json({ ad, source: 'inventory' });
        }

        // ── PATH C: no ads available ──
        return NextResponse.json({ ad: null, source: 'none' });
    } catch {
        return NextResponse.json({ ad: null, source: 'none' });
    }
}
