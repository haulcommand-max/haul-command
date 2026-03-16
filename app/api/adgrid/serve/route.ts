import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const supabaseAdmin = getSupabaseAdmin();

/**
 * GET /api/adgrid/serve?surface=directory&corridor=I-10&country=US
 * Serve the highest-bidding ad for a given placement
 */
export async function GET(req: NextRequest) {
    const surface = req.nextUrl.searchParams.get('surface') || 'directory';
    const corridor = req.nextUrl.searchParams.get('corridor');
    const country = req.nextUrl.searchParams.get('country') || 'US';

    try {
        const { data, error } = await supabaseAdmin.rpc('serve_adgrid_ad', {
            p_surface: surface,
            p_corridor: corridor,
            p_country: country,
        });

        if (error) {
            // Fallback: no ads available, return empty
            return NextResponse.json({ ad: null, source: 'none' });
        }

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ ad: null, source: 'none' });
        }

        // Track impression automatically
        if (data.creative_id) {
            await supabaseAdmin.from('hc_ad_events').insert({
                creative_id: data.creative_id,
                campaign_id: data.campaign_id,
                event_type: 'impression',
                surface,
                corridor_code: corridor,
                country_code: country,
            }); // Non-blocking impression tracking
        }

        return NextResponse.json({ ad: data, source: 'adgrid' });
    } catch {
        return NextResponse.json({ ad: null, source: 'none' });
    }
}
