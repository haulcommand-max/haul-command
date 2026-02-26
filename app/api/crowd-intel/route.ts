export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

const VALID_TYPES = [
    'police_spotted', 'road_blocked', 'heavy_wind', 'accident',
    'escort_shortage', 'parking_full', 'enforcement_hotspot',
    'construction', 'bridge_restriction', 'weather', 'road_closure',
    'utility_work', 'other',
];

// POST: Submit a crowd intel report
export async function POST(req: Request) {
    const body = await req.json();
    const { corridor_slug, incident_type, location_text, lat, lng, severity, reported_by } = body;

    if (!corridor_slug || !incident_type) {
        return new Response('Missing required fields', { status: 400 });
    }

    if (!VALID_TYPES.includes(incident_type)) {
        return new Response(`Invalid incident_type. Must be one of: ${VALID_TYPES.join(', ')}`, { status: 400 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Rate limit: max 5 reports per user per hour
    if (reported_by) {
        const { count } = await supabase
            .from('corridor_incidents')
            .select('*', { count: 'exact', head: true })
            .eq('reported_by', reported_by)
            .gte('created_at', new Date(Date.now() - 3600_000).toISOString());

        if ((count || 0) >= 5) {
            return new Response('Rate limit exceeded (5 reports/hour)', { status: 429 });
        }
    }

    const { data, error } = await supabase
        .from('corridor_incidents')
        .insert({
            corridor_slug,
            incident_type,
            location_text: location_text || null,
            lat: lat || null,
            lng: lng || null,
            severity: severity || 'moderate',
            reported_by: reported_by || null,
            source: 'crowd',
            expires_at: new Date(Date.now() + 6 * 3600_000).toISOString(),
        })
        .select()
        .single();

    if (error) return new Response(error.message, { status: 500 });
    return Response.json(data, { status: 201 });
}

// GET: Fetch active incidents for a corridor
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const corridor = searchParams.get('corridor');

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    let query = supabase
        .from('corridor_incidents')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(25);

    if (corridor) query = query.eq('corridor_slug', corridor);

    const { data, error } = await query;
    if (error) return new Response(error.message, { status: 500 });
    return Response.json(data || []);
}
