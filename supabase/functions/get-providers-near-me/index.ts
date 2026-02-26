
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase-client.ts";

/**
 * get-providers-near-me
 * 
 * Implements the 10X Geo-Logic:
 * 1. Bounding Box Pre-filter (FAST)
 * 2. Haversine Distance Calculation
 * 3. 10X Directory Ranking Algorithm (Weights: Proximity 30%, Trust 25%, Activity 15%, Response 10%, Completeness 10%, Boost 10%)
 */

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = getSupabaseClient();
        const { lat, lng, category, limit = 25 } = await req.json();

        if (!lat || !lng || !category) {
            return new Response(
                JSON.stringify({ error: "Missing lat, lng, or category" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Step 2: Bounding Box Pre-Filter (+/- 1 degree (~69 miles))
        const { data: candidates, error } = await supabase
            .from("sponsors")
            .select("*")
            .eq("status", "active")
            .eq("category", category)
            .filter("latitude", "gte", lat - 1)
            .filter("latitude", "lte", lat + 1)
            .filter("longitude", "gte", lng - 1)
            .filter("longitude", "lte", lng + 1);

        if (error) throw error;

        const ranked = candidates.map(p => {
            // 1. Proximity Score (30%)
            const dist = haversine(lat, lng, p.latitude, p.longitude);
            const proximityScore = Math.max(0, 100 - (dist * 2));

            // 2. Trust Score (25%)
            const trustScore =
                (parseFloat(p.avg_rating || 0) * 15) +
                (p.is_verified ? 10 : 0) +
                Math.min(p.review_count || 0, 50);

            // 3. Activity Score (15%)
            const completedJobs = p.completed_jobs_90_days || 0;
            const lastSeenDate = p.last_seen ? new Date(p.last_seen) : null;
            const isRecentlyActive = lastSeenDate && (Date.now() - lastSeenDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
            const activityScore = Math.min(completedJobs * 2, 60) + (isRecentlyActive ? 40 : 0);

            // 4. Response Score (10%)
            const respTime = p.avg_response_minutes || 60;
            let responseScore = 20;
            if (respTime <= 5) responseScore = 100;
            else if (respTime <= 15) responseScore = 80;
            else if (respTime <= 60) responseScore = 60;
            else if (respTime <= 180) responseScore = 40;

            // 5. Completeness Score (10%)
            const completenessScore =
                (p.has_logo ? 15 : 0) +
                (p.has_description ? 15 : 0) +
                (p.has_phone ? 20 : 0) +
                (p.has_service_area ? 20 : 0) +
                (p.has_photos ? 15 : 0) +
                (p.has_insurance_verified ? 15 : 0);

            // 6. Boost Score (10%)
            // Note: Boost level comes from sponsor_placements, but we'll use a simplified p.boost_level for this logic
            const boostScore = Math.min((p.boost_level || 0) * 20, 100);

            // Composite Final Score
            let finalScore = (
                (proximityScore * 0.30) +
                (trustScore * 0.25) +
                (activityScore * 0.15) +
                (responseScore * 0.10) +
                (completenessScore * 0.10) +
                (boostScore * 0.10)
            );

            // ⚠️ 10X Hard Rule: Never let boost exceed trust by too much
            finalScore = Math.min(finalScore, trustScore + 40);

            return {
                ...p,
                distance: dist,
                final_score: finalScore
            };
        })
            .filter(p => p.distance <= (p.service_radius || 100))
            .sort((a, b) => b.final_score - a.final_score)
            .slice(0, limit);

        return new Response(
            JSON.stringify(ranked),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
