import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Haul Command Mobile API: Crowdsourced Hazard Intel (Waze for Heavy Haul)
// This endpoint is STRICTLY for the Mobile App Edge, relying on active verified driving telemetry.
// It is physically walled off from the marketing Web Directory.

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { hazard_type, lat, lng, severity, description, operator_id } = body;

        // 1. Validation Locks
        if (!hazard_type || !lat || !lng || !operator_id) {
            return NextResponse.json({ error: 'Missing critical hazard telemetry payload.' }, { status: 400 });
        }

        // Initialize Admin Auth to bypass RLS strictly for Mobile API ingress
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use Service Role for ingestion validation
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Validate Operator is actively routed and verified (No SPAM pins from the Web)
        const { data: operator, error: authError } = await supabase
            .from('profiles')
            .select('is_verified, role')
            .eq('id', operator_id)
            .single();

        if (authError || !operator?.is_verified) {
             return NextResponse.json({ error: 'Hazard Reports require a verified Escort/Operator ID from the Mobile App.' }, { status: 403 });
        }

        // 3. Drop the Map Pin into the Waze Core (hc_hazard_reports)
        const { error: insertError } = await supabase
            .from('hc_hazard_reports')
            .insert({
                reporter_id: operator_id,
                hazard_type: hazard_type,
                lat: lat,
                lng: lng,
                severity: severity || 1,
                description: description || '',
                // Auto-expire the hazard in 24 hours to keep the map fresh
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

        if (insertError) {
             console.error('[Hazard Engine] Insertion failed:', insertError);
             return NextResponse.json({ error: 'Failed to record hazard to network.' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Hazard ingested and synced to Double Platinum network.',
            action: 'DISPATCH_TO_MAPBOX_EDGE'
        });

    } catch (error) {
        console.error('[Hazard Engine] Fatal Mobile Endpoint Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // 4. Retrieve Active Hazards for the Mapbox Mobile SDK overlay
    // The mobile app requests nearby pins on this route.
    const { searchParams } = new URL(request.url);
    const originLat = parseFloat(searchParams.get('lat') || '');
    const originLng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(originLat) || isNaN(originLng)) {
        return NextResponse.json({ error: 'Valid radar anchors (lat/lng) required.' }, { status: 400 });
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch using the custom RPC built in migration 20260409_902
        const { data: hazards, error } = await supabase
             .rpc('hc_search_nearby_hazards', {
                 origin_lat: originLat,
                 origin_lng: originLng,
                 radius_miles: 150 // Pull hazards inside 150 miles for early warning
             });

        if (error) throw error;

        return NextResponse.json({ active_hazards: hazards || [] });

    } catch (error) {
         console.error('[Hazard Engine] Fetch error:', error);
         return NextResponse.json({ error: 'Failed to pull live Waze hazards.' }, { status: 500 });
    }
}
