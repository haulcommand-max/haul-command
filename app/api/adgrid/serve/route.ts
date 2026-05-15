import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface ServedAd {
    id: string;
    headline: string;
    body: string;
    cta_label: string;
    cta_url: string;
    advertiser_name: string;
    is_house?: boolean;
}

const HOUSE_ADS: Record<string, ServedAd> = {
    directory_sponsor: {
        id: 'house-directory-sponsor',
        headline: 'Own the next heavy-haul support search',
        body: 'Sponsor pilot car, permit, parking, repair, staging, and route-support discovery moments before a move stalls.',
        cta_label: 'Sponsor this market',
        cta_url: '/advertise/buy?zone=directory_sponsor',
        advertiser_name: 'Haul Command',
        is_house: true,
    },
    directory_gap: {
        id: 'house-directory-gap',
        headline: 'Be the first answer in a low-supply market',
        body: 'Put your company in front of buyers searching for hard-to-find heavy-haul support by role, country, corridor, and urgency.',
        cta_label: 'Claim the gap',
        cta_url: '/advertise/buy?zone=directory_gap',
        advertiser_name: 'Haul Command',
        is_house: true,
    },
    default: {
        id: 'house-adgrid-default',
        headline: 'Sponsor a high-intent Haul Command surface',
        body: 'Reach brokers, carriers, operators, suppliers, yards, and support providers at the moment they are planning or rescuing a move.',
        cta_label: 'View sponsor options',
        cta_url: '/advertise',
        advertiser_name: 'Haul Command',
        is_house: true,
    },
};

function getHouseAd(zone: string): ServedAd {
    return HOUSE_ADS[zone] ?? HOUSE_ADS.default;
}

/**
 * GET /api/adgrid/serve?surface=directory&corridor=I-10&country=US
 *   — Legacy: serve via DB RPC (serve_adgrid_ad)
 * GET /api/adgrid/serve?zone=homepage_hero&role=pilot
 *   — New: serve from hc_adgrid_inventory by zone + optional role targeting
 *
 * Merged route: paid ads win, but an empty or degraded inventory returns a
 * Haul Command house ad instead of a dead slot.
 */
export async function GET(req: NextRequest) {
    const surface = req.nextUrl.searchParams.get('surface');
    const zone = req.nextUrl.searchParams.get('zone');
    const corridor = req.nextUrl.searchParams.get('corridor');
    const country = req.nextUrl.searchParams.get('country') || 'US';
    const role = req.nextUrl.searchParams.get('role');
    const queryZone = zone ?? surface ?? 'homepage_hero';

    try {
        const supabaseAdmin = getSupabaseAdmin();

        // ── PATH A: legacy RPC approach (strongest — uses bid ranking) ──
        if (surface) {
            const { data, error } = await supabaseAdmin.rpc('serve_adgrid_ad', {
                p_surface: surface,
                p_corridor: corridor,
                p_country: country,
            });

            if (!error && data && Object.keys(data).length > 0) {
                // Track impression without blocking the user response.
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
            // Log impression async.
            supabaseAdmin.from('hc_adgrid_impressions').insert({
                inventory_id: ad.id,
                zone: queryZone,
                role,
                timestamp: new Date().toISOString(),
            }).then(() => {});
            return NextResponse.json({ ad, source: 'inventory' });
        }

        // ── PATH C: no paid ads available; keep revenue path alive ──
        return NextResponse.json({ ad: getHouseAd(queryZone), source: 'house' });
    } catch {
        return NextResponse.json({ ad: getHouseAd(queryZone), source: 'house' });
    }
}
