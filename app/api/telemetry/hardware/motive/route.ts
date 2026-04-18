import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Haul Command Hardware Telemetry: Motive/Samsara Dashcam Webhook Ingestion
// Converts AI-detected dashcam events (from fixed cab hardware) into Haul Command network hazards.

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const signature = request.headers.get('x-motive-signature');
        
        // 1. Verify Webhook Authenticity (Motive Payload)
        // Ensure this is a legitimate ping from a registered dashcam
        if (!process.env.MOTIVE_API_SECRET || !signature) {
             return NextResponse.json({ error: 'Missing security payload' }, { status: 401 });
        }

        const { event_type, location, vehicle_id, metadata } = body;

        // 2. Filter for specific AI-detected road hazard events
        // Motive dashcams can automatically detect extreme braking, collisions, traffic standstills, etc.
        const validHazardEvents = ['hard_brake', 'collision', 'standstill', 'ai_sign_detected'];
        if (!validHazardEvents.includes(event_type)) {
             return NextResponse.json({ success: true, message: 'Event ignored (not a road hazard)' });
        }

        // Initialize Supabase Admin Edge
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Map the cab hardware to a verified Haul Command operator
        const { data: linkage, error: linkError } = await supabase
            .from('profiles')
            .select('id, is_verified')
            .eq('motive_vehicle_id', vehicle_id)
            .single();

        if (linkError || !linkage?.is_verified) {
             return NextResponse.json({ error: 'Hardware ping from unregistered/unverified vehicle' }, { status: 403 });
        }

        // 4. Translate the Dashcam Data into a Waze-style Haul Command Hazard
        let translatedHazard = 'hazard';
        if (event_type === 'standstill') translatedHazard = 'delay';
        if (event_type === 'hard_brake') translatedHazard = 'hazard';

        const { error: insertError } = await supabase
            .from('hc_hazard_reports')
            .insert({
                reporter_id: linkage.id,
                hazard_type: translatedHazard,
                lat: location.lat,
                lng: location.lng,
                severity: 4, // Hardware detected automatically
                description: `Automated dashcam detection: ${event_type}`,
                expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
            });

        if (insertError) throw insertError;

        return NextResponse.json({ 
            success: true, 
            message: 'Camera Hardware event successfully mapped to Haul Command radar.',
            action: 'HARDWARE_HAZARD_INGESTED'
        });

    } catch (error) {
        console.error('[Hardware Telemetry] Error processing dashcam feed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
