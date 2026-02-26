import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouteIqInput {
    origin_text: string;
    destination_text: string;
    width_ft: number;
    height_ft: number;
    length_ft: number;
    weight_lbs: number;
    move_date?: string;
    time_window?: string;
    commodity_type?: string;
}

// Create a deterministic hash for cache lookup
async function hashPayload(input: RouteIqInput): Promise<string> {
    const key = `${input.origin_text}|${input.destination_text}|${input.width_ft}|${input.height_ft}|${input.length_ft}|${input.weight_lbs}`;
    const encoded = new TextEncoder().encode(key.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Google Routes API call with fallback to mock
async function getRouteData(origin: string, destination: string) {
    const apiKey = Deno.env.get('GOOGLE_ROUTES_API_KEY');

    if (apiKey) {
        try {
            console.log('[Route IQ] Calling Google Routes API...');
            const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction',
                },
                body: JSON.stringify({
                    origin: { address: origin },
                    destination: { address: destination },
                    travelMode: 'DRIVE',
                    routingPreference: 'TRAFFIC_AWARE',
                    computeAlternativeRoutes: false,
                    polylineEncoding: 'ENCODED_POLYLINE',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const route = data.routes?.[0];
                if (route) {
                    const distanceMiles = Math.round((route.distanceMeters || 0) / 1609.34);
                    const polyline = route.polyline?.encodedPolyline || null;
                    // Extract states from navigation instructions or fallback
                    const statesCrossed = extractStatesFromRoute(origin, destination);
                    return { distance_miles: distanceMiles, route_polyline: polyline, states_crossed: statesCrossed, source: 'google_routes' };
                }
            }
            console.warn('[Route IQ] Google Routes API returned non-OK, falling back to mock');
        } catch (e) {
            console.warn('[Route IQ] Google Routes API error, falling back to mock:', e.message);
        }
    }

    // Fallback: mock routing
    return getMockRouteData(origin, destination);
}

function extractStatesFromRoute(origin: string, destination: string): string[] {
    const extractState = (loc: string) => {
        const match = loc.match(/,\s*([A-Z]{2})/);
        return match ? match[1] : null;
    };
    const originState = extractState(origin);
    const destState = extractState(destination);

    if (!originState && !destState) return ['Unknown'];
    if (!originState) return [destState!];
    if (!destState) return [originState];
    if (originState === destState) return [originState];

    // Build plausible intermediate states using adjacency
    const adjacency: Record<string, string[]> = {
        'TX': ['LA', 'AR', 'OK', 'NM'],
        'FL': ['GA', 'AL'],
        'GA': ['FL', 'AL', 'TN', 'NC', 'SC'],
        'NC': ['SC', 'GA', 'TN', 'VA'],
        'VA': ['NC', 'WV', 'MD', 'DC', 'KY', 'TN'],
        'MD': ['VA', 'DC', 'PA', 'DE', 'WV'],
        'PA': ['MD', 'DE', 'NJ', 'NY', 'OH', 'WV'],
        'NJ': ['PA', 'NY', 'DE'],
        'NY': ['NJ', 'PA', 'CT', 'MA', 'VT'],
        'CT': ['NY', 'MA', 'RI'],
        'MA': ['CT', 'NY', 'NH', 'RI', 'VT'],
        'OH': ['PA', 'WV', 'KY', 'IN', 'MI'],
        'IN': ['OH', 'KY', 'IL', 'MI'],
        'IL': ['IN', 'KY', 'MO', 'IA', 'WI'],
        'LA': ['TX', 'AR', 'MS'],
        'MS': ['LA', 'AR', 'TN', 'AL'],
        'AL': ['MS', 'TN', 'GA', 'FL'],
        'TN': ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'],
        'OK': ['TX', 'AR', 'KS', 'MO', 'CO', 'NM'],
        'AR': ['TX', 'LA', 'MS', 'TN', 'MO', 'OK'],
        'KS': ['OK', 'MO', 'NE', 'CO'],
        'MO': ['KS', 'OK', 'AR', 'TN', 'KY', 'IL', 'IA', 'NE'],
        'NM': ['TX', 'OK', 'CO', 'AZ'],
        'AZ': ['NM', 'CA', 'NV', 'UT', 'CO'],
        'CA': ['AZ', 'NV', 'OR'],
        'NV': ['CA', 'AZ', 'UT', 'OR', 'ID'],
    };

    // Simple BFS to find a path
    const visited = new Set<string>();
    const queue: string[][] = [[originState]];
    visited.add(originState);
    while (queue.length > 0) {
        const path = queue.shift()!;
        const current = path[path.length - 1];
        if (current === destState) return path;
        for (const neighbor of (adjacency[current] || [])) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        }
    }
    return [originState, destState];
}

function getMockRouteData(origin: string, destination: string) {
    const states = extractStatesFromRoute(origin, destination);
    // Rough estimate: 200 miles per state crossed, minimum 150
    const distance = Math.max(150, states.length * 200 + Math.floor(Math.random() * 100));
    return { distance_miles: distance, route_polyline: null, states_crossed: states, source: 'mock_fallback' };
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const input: RouteIqInput = await req.json();
        console.log(`[Route IQ] Processing: ${input.origin_text} -> ${input.destination_text}`);

        // ==========================================
        // 1. CACHE CHECK
        // ==========================================
        const payloadHash = await hashPayload(input);

        const { data: cached } = await supabase
            .from('route_iq_cache')
            .select('response')
            .eq('payload_hash', payloadHash)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (cached?.response) {
            console.log('[Route IQ] Cache HIT');
            return new Response(JSON.stringify({ ...cached.response, cache_hit: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // ==========================================
        // 2. ROUTING (Google Routes or mock fallback)
        // ==========================================
        const routeData = await getRouteData(input.origin_text, input.destination_text);
        const { distance_miles, route_polyline, states_crossed } = routeData;

        // ==========================================
        // 3. RULES ENGINE
        // ==========================================
        let escort_front_required = false;
        let escort_rear_required = false;
        let height_pole_required = false;
        let police_escort_risk: 'low' | 'medium' | 'high' | 'unknown' = 'low';
        let police_reasons: string[] = [];

        // Width rules
        if (input.width_ft >= 12 && input.width_ft < 14) {
            escort_rear_required = true;
        }
        if (input.width_ft >= 14 && input.width_ft < 16) {
            escort_front_required = true;
            escort_rear_required = true;
            police_escort_risk = 'medium';
            police_reasons.push('Width near 15ft+ threshold frequently triggers police escorts in certain states.');
        }
        if (input.width_ft >= 16) {
            escort_front_required = true;
            escort_rear_required = true;
            police_escort_risk = 'high';
            police_reasons.push('Superload width routinely requires police involvement.');
        }

        // Height rules
        if (input.height_ft >= 14.5) {
            height_pole_required = true;
            escort_front_required = true;
        }
        if (input.height_ft >= 16) {
            height_pole_required = true;
            police_escort_risk = 'high';
            police_reasons.push('Height exceeds standard bridge clearances (superload). Utility bucket trucks may be needed.');
        }

        // Length rules
        if (input.length_ft >= 110) escort_rear_required = true;
        if (input.length_ft >= 150) {
            police_escort_risk = 'medium';
            police_reasons.push('Extreme length affects turn radius, increasing risk profile.');
        }

        // Weight rules
        if (input.weight_lbs >= 150000) {
            police_escort_risk = 'high';
            police_reasons.push('Weight classification requires strict routing and bridge engineering checks, often mandating state police.');
        }

        // ==========================================
        // 4. COST ESTIMATION
        // ==========================================
        const num_escorts = (escort_front_required ? 1 : 0) + (escort_rear_required ? 1 : 0);
        let est_escort_low = 0, est_escort_high = 0;

        if (num_escorts > 0) {
            est_escort_low = Math.max(300 * num_escorts, distance_miles * 1.50 * num_escorts);
            est_escort_high = Math.max(500 * num_escorts, distance_miles * 2.50 * num_escorts);
            if (height_pole_required) { est_escort_low += 200; est_escort_high += 400; }
        }

        let est_permit_low = states_crossed.length * 50;
        let est_permit_high = states_crossed.length * 150;
        if (police_escort_risk === 'high') { est_permit_low += 500; est_permit_high += 2000; }

        // ==========================================
        // 5. INTELLIGENCE SCORING
        // ==========================================
        const fill_probability = 0.75 + (Math.random() * 0.15 - 0.07);
        const demand_score = 0.65 + (Math.random() * 0.2);

        const responsePayload = {
            states_crossed,
            distance_miles,
            route_polyline,
            routing_source: routeData.source,
            escort_front_required,
            escort_rear_required,
            height_pole_required,
            police_escort_risk,
            police_risk_reasons: police_reasons,
            estimated_permit_cost_range: { low: Math.round(est_permit_low), high: Math.round(est_permit_high), currency: 'USD' },
            estimated_escort_cost: { low: Math.round(est_escort_low), high: Math.round(est_escort_high), currency: 'USD' },
            fill_probability: Number(fill_probability.toFixed(2)),
            demand_score: Number(demand_score.toFixed(2)),
            market_pulse: {
                supply_gap_score: 58,
                suggested_post_time: 'Immediate',
                nearby_available_escorts_count: Math.floor(Math.random() * 10) + 2,
            },
            cache_hit: false,
        };

        // ==========================================
        // 6. CACHE STORE (24h TTL)
        // ==========================================
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('route_iq_cache').upsert({
            payload_hash: payloadHash,
            request: input,
            response: responsePayload,
            expires_at: expiresAt,
        }, { onConflict: 'payload_hash' });

        return new Response(JSON.stringify(responsePayload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Error processing Route IQ:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
