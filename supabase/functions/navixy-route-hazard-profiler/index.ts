// ============================================================================
// SYSTEM 3 & 4 — ROUTE HAZARD PROFILER (Skinny Bridge & Rail Humps)
// ============================================================================
// Logic:    Analyzes a route against known infrastructure hazards.
//           1. Skinny Bridge: Width < 30' vs Load Width
//           2. Rail Hump: Crossing Grade vs Break-over Angle (Clearance/Wheelbase)
// Inputs:   Route Polyline (Points) + Vehicle Dimensions
// Output:   JSON List of "Hazard Instructions" (Traffic Control Plans, Abort Warnings)
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase-client.ts";
import type { InfrastructureAsset } from "../_shared/types.ts";

interface HazardProfileInput {
    vehicle: {
        width_ft: number;
        ground_clearance_in: number;
        wheelbase_ft: number; // For break-over angle
    };
    route_points: Array<{ lat: number; lng: number }>; // Simplified Polyline
}

interface HazardAlert {
    type: 'skinny_bridge' | 'rail_hump';
    asset_id: string;
    location: { lat: number; lng: number };
    severity: 'warning' | 'critical' | 'abort';
    message: string;
    instruction: string; // The "Traffic Control Plan" or Action
}

// Haversine Distance (miles)
function getDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const input: HazardProfileInput = await req.json();
        const db = getSupabaseClient();
        const hazards: HazardAlert[] = [];

        // 1. Calculate Bounding Box of Route (to limit DB query)
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        for (const p of input.route_points) {
            if (p.lat < minLat) minLat = p.lat;
            if (p.lat > maxLat) maxLat = p.lat;
            if (p.lng < minLng) minLng = p.lng;
            if (p.lng > maxLng) maxLng = p.lng;
        }

        // Add buffer (approx 1 mile = ~0.015 deg)
        const BUFFER = 0.02;

        // 2. Fetch Assets within Bounding Box
        const { data: assets, error } = await db
            .from('infrastructure_assets')
            .select('*')
            .gte('latitude', minLat - BUFFER)
            .lte('latitude', maxLat + BUFFER)
            .gte('longitude', minLng - BUFFER)
            .lte('longitude', maxLng + BUFFER);

        if (error) throw error;

        const infraAssets = (assets || []) as InfrastructureAsset[];

        // 3. Analyze Route vs Assets
        for (const asset of infraAssets) {
            // Check if asset is close to ANY point on the route
            // (Naive implementation: verify distance < 200ft / 0.04 miles)
            // A production version would use PostGIS `ST_DWithin(route_line, asset_point)`

            let onRoute = false;
            for (const p of input.route_points) {
                if (getDistance(p, asset.location) < 0.04) {
                    onRoute = true;
                    break;
                }
            }

            if (!onRoute) continue;

            // --- SYSTEM 3: SKINNY BRIDGE ---
            if (asset.asset_type === 'bridge') {
                const bridgeWidth = asset.attributes.curb_to_curb_width_ft as number;

                // SKILL-BASED RULE: "Skinny Bridge" < 30ft width
                if (bridgeWidth && bridgeWidth < 30) {
                    // Start Traffic Control Protocol if Load > 14ft OR Bridge < Load + 2ft
                    if (input.vehicle.width_ft > 14 || input.vehicle.width_ft > (bridgeWidth - 2)) {
                        hazards.push({
                            type: 'skinny_bridge',
                            asset_id: asset.asset_ref_id,
                            location: asset.location,
                            severity: 'critical',
                            message: `Skinny Bridge detected (${bridgeWidth}ft wide).`,
                            instruction: `PROTOCOL: Front Escort must close bridge to oncoming traffic before load enters. Bridge is ${bridgeWidth}' wide, Load is ${input.vehicle.width_ft}'.`
                        });
                    }
                }
            }

            // --- SYSTEM 4: RAILROAD HUMP ---
            if (asset.asset_type === 'railroad_crossing') {
                const isHumped = asset.attributes.is_humped as boolean;
                const humpGrade = asset.attributes.hump_grade_percent as number; // Rise/Run %

                // Calculate Break-Over Angle Capability
                // tan(theta) = (2 * Clearance) / Wheelbase  (Approximation for center high-center)
                // Actually simpler: Max Grade capability % approx = (Clearance / (Wheelbase / 2)) * 100
                const maxGradePercent = (input.vehicle.ground_clearance_in / 12) / (input.vehicle.wheelbase_ft / 2) * 100;

                if (isHumped || (humpGrade && humpGrade > maxGradePercent)) {
                    hazards.push({
                        type: 'rail_hump',
                        asset_id: asset.asset_ref_id,
                        location: asset.location,
                        severity: 'abort',
                        message: `HIGH CENTERING RISK. Crossing Grade ${humpGrade}% exceeds vehicle capability ${maxGradePercent.toFixed(1)}%.`,
                        instruction: "ABORT ROUTE. Reroute required to avoid grounding out.",
                    });
                }
            }
        }

        return new Response(JSON.stringify({ hazards }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err) {
        return new Response(
            JSON.stringify({ error: (err as Error).message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
