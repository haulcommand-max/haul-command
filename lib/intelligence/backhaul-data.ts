
import { SupabaseClient } from '@supabase/supabase-js';

export async function fetchBackhaulContextV1(
    supabase: SupabaseClient,
    params: {
        originGeoKey: string; // e.g., "us:tx:houston"
        destGeoKey: string;   // e.g., "us:tx:dallas"
        serviceRequired: string;
        postedAtISO: string;
        loadDateISO?: string;
        // If you don't have radius geo yet, provide "neighbor geo keys" for dest cluster:
        destNeighborGeoKeys: string[]; // includes dest itself + nearby cities/metas
        originNeighborGeoKeys?: string[]; // optional for directionality
    }
) {
    const laneKeyAB = `${params.originGeoKey}__${params.destGeoKey}__${params.serviceRequired}`;
    const laneKeyBA = `${params.destGeoKey}__${params.originGeoKey}__${params.serviceRequired}`;

    const { data: lanesRows } = await supabase
        .from('lanes')
        .select('lane_key, active_loads_30d, lane_density_score_30d')
        .in('lane_key', [laneKeyAB, laneKeyBA]);

    const ab = lanesRows?.find((r: any) => r.lane_key === laneKeyAB) ?? { active_loads_30d: 0, lane_density_score_30d: 0 };
    const ba = lanesRows?.find((r: any) => r.lane_key === laneKeyBA) ?? { active_loads_30d: 0, lane_density_score_30d: 0 };

    // Nearby outbound from destination within last 24h/72h:
    // If you have geohash/radius search, replace this with radius query.
    // v1 bucket method: origin geo key in destNeighborGeoKeys
    const now = new Date();
    const d24 = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const d72 = new Date(now.getTime() - 72 * 3600 * 1000).toISOString();

    // Helper to extract cities from geo keys (assuming "us:tx:city" format)
    // This is sensitive to schema, ensuring we match `origin_city` in DB.
    // We should normalize or use a dedicated look up.
    // For V1, we assume the geo keys passed end with the city name or are mapped.
    const destCities = params.destNeighborGeoKeys.map(k => k.split(':').pop()!);

    const { count: near24h } = await supabase
        .from('loads')
        .select('id', { count: 'exact', head: true })
        .in('origin_city', destCities)
        .gte('posted_at', d24)
        .eq('status', 'active');

    const { count: near72h } = await supabase
        .from('loads')
        .select('id', { count: 'exact', head: true })
        .in('origin_city', destCities)
        .gte('posted_at', d72)
        .eq('status', 'active');

    // Optional directionality: how many of those go back toward origin cluster
    let towardOrigin72h = 0;
    if (params.originNeighborGeoKeys?.length) {
        const originCities = params.originNeighborGeoKeys.map(k => k.split(':').pop()!);
        const { count } = await supabase
            .from('loads')
            .select('id', { count: 'exact', head: true })
            .in('origin_city', destCities)
            .in('dest_city', originCities)
            .gte('posted_at', d72)
            .eq('status', 'active');
        towardOrigin72h = count ?? 0;
    }

    return {
        originGeoKey: params.originGeoKey,
        destGeoKey: params.destGeoKey,
        serviceRequired: params.serviceRequired,
        postedAtISO: params.postedAtISO,
        loadDateISO: params.loadDateISO,

        outboundLaneActive30d: ab.active_loads_30d ?? 0,
        returnLaneActive30d: ba.active_loads_30d ?? 0,
        outboundLaneDensity01: Number(ab.lane_density_score_30d ?? 0),
        returnLaneDensity01: Number(ba.lane_density_score_30d ?? 0),

        nearbyOutboundFromDest_24h: near24h ?? 0,
        nearbyOutboundFromDest_72h: near72h ?? 0,
        nearbyTowardOrigin_72h: towardOrigin72h,
    };
}
