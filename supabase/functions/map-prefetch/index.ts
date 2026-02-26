import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Map Prefetch — Edge Function
 * 
 * Prefetches drawer payloads for a user's home jurisdiction + neighbors.
 * Caches results in jurisdiction_content_cache with 24h TTL.
 * 
 * Trigger: POST /functions/v1/map-prefetch
 * Body: { user_id?: string, jurisdiction_code?: string }
 */

// Hardcoded adjacency (simplified — full version in lib/map/adjacency.ts)
const US_ADJ: Record<string, string[]> = {
    'US-FL': ['US-AL', 'US-GA'], 'US-GA': ['US-AL', 'US-FL', 'US-NC', 'US-SC', 'US-TN'],
    'US-TX': ['US-AR', 'US-LA', 'US-NM', 'US-OK'], 'US-CA': ['US-AZ', 'US-NV', 'US-OR'],
    'US-NY': ['US-CT', 'US-MA', 'US-NJ', 'US-PA', 'US-VT'],
    'US-WY': ['US-CO', 'US-ID', 'US-MT', 'US-NE', 'US-SD', 'US-UT'],
};

const CA_ADJ: Record<string, string[]> = {
    'CA-ON': ['CA-MB', 'CA-QC'], 'CA-AB': ['CA-BC', 'CA-SK', 'CA-NT'],
    'CA-BC': ['CA-AB', 'CA-NT', 'CA-YT'], 'CA-QC': ['CA-NB', 'CA-NL', 'CA-ON'],
};

function getNeighbors(code: string): string[] {
    return US_ADJ[code] || CA_ADJ[code] || [];
}

const CACHE_TTL_SECONDS = 86400;

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const body = await req.json().catch(() => ({}));
        let homeCode: string | null = body.jurisdiction_code || null;

        // If user_id provided, look up their home jurisdiction
        if (!homeCode && body.user_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('home_jurisdiction_code')
                .eq('id', body.user_id)
                .single();
            homeCode = profile?.home_jurisdiction_code || null;
        }

        if (!homeCode) {
            return new Response(JSON.stringify({ success: true, cached: 0, message: 'No home jurisdiction set' }),
                { headers: { 'Content-Type': 'application/json' } });
        }

        // Collect codes to prefetch: home + neighbors
        const codesToPrefetch = [homeCode, ...getNeighbors(homeCode)];
        const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();
        let cached = 0;

        for (const code of codesToPrefetch) {
            const cacheKey = `${code}:drawer:v1`;

            // Check if cache is still fresh
            const { data: existing } = await supabase
                .from('jurisdiction_content_cache')
                .select('expires_at')
                .eq('cache_key', cacheKey)
                .single();

            if (existing && new Date(existing.expires_at) > new Date()) {
                continue; // Still fresh
            }

            // Fetch drawer data
            const { data: drawer } = await supabase.rpc('get_jurisdiction_drawer', { p_jurisdiction_code: code });

            if (drawer) {
                await supabase
                    .from('jurisdiction_content_cache')
                    .upsert({
                        cache_key: cacheKey,
                        jurisdiction_code: code,
                        payload_json: drawer,
                        expires_at: expiresAt,
                    }, { onConflict: 'cache_key' });
                cached++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            home: homeCode,
            neighbors: getNeighbors(homeCode),
            cached,
            total_prefetched: codesToPrefetch.length,
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Map prefetch error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
