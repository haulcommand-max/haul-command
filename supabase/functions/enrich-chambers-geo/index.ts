import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Enrich Chambers Geo — Edge Function
 * 
 * Batch geocodes canonical chambers missing lat/lng.
 * Configurable geocoding provider via GEOCODE_PROVIDER env var.
 * 
 * Trigger: POST /functions/v1/enrich-chambers-geo
 */

const BATCH_SIZE = 25;
const GEOCODE_PROVIDER = Deno.env.get('GEOCODE_PROVIDER') || 'nominatim'; // 'nominatim' | 'opencage' | 'mapbox'
const OPENCAGE_KEY = Deno.env.get('OPENCAGE_API_KEY') || '';
const MAPBOX_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN') || '';

interface GeoResult {
    lat: number;
    lng: number;
    confidence: number;
    provider: string;
}

async function geocode(address: string): Promise<GeoResult | null> {
    try {
        if (GEOCODE_PROVIDER === 'opencage' && OPENCAGE_KEY) {
            const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${OPENCAGE_KEY}&limit=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.results?.[0]) {
                return {
                    lat: data.results[0].geometry.lat,
                    lng: data.results[0].geometry.lng,
                    confidence: data.results[0].confidence / 10,
                    provider: 'opencage',
                };
            }
        } else if (GEOCODE_PROVIDER === 'mapbox' && MAPBOX_TOKEN) {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.features?.[0]) {
                const [lng, lat] = data.features[0].center;
                return { lat, lng, confidence: data.features[0].relevance, provider: 'mapbox' };
            }
        } else {
            // Nominatim (free, rate-limited — 1 req/sec)
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
            const res = await fetch(url, { headers: { 'User-Agent': 'HaulCommand/1.0' } });
            const data = await res.json();
            if (data?.[0]) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    confidence: 0.7,
                    provider: 'nominatim',
                };
            }
            // Rate limit: sleep 1s between Nominatim requests
            await new Promise(r => setTimeout(r, 1100));
        }
    } catch (e) {
        console.warn('Geocode error for:', address, e);
    }
    return null;
}

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Find chambers missing lat/lng
        const { data: chambers } = await supabase
            .from('chambers')
            .select('id, canonical_name, address_line1, city, region, postal_code, country')
            .is('lat', null)
            .limit(BATCH_SIZE);

        if (!chambers || chambers.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                enriched: 0,
                message: 'All chambers already geocoded'
            }), { headers: { 'Content-Type': 'application/json' } });
        }

        let enriched = 0;
        const errors: string[] = [];

        for (const chamber of chambers) {
            const addressParts = [
                chamber.address_line1,
                chamber.city,
                chamber.region,
                chamber.postal_code,
                chamber.country,
            ].filter(Boolean);

            if (addressParts.length < 2) {
                errors.push(`${chamber.id}: Insufficient address data`);
                continue;
            }

            const address = addressParts.join(', ');
            const result = await geocode(address);

            if (result) {
                await supabase.from('chambers').update({
                    lat: result.lat,
                    lng: result.lng,
                    updated_at: new Date().toISOString(),
                }).eq('id', chamber.id);
                enriched++;
            } else {
                errors.push(`${chamber.id}: Geocode returned no results`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            provider: GEOCODE_PROVIDER,
            total_candidates: chambers.length,
            enriched,
            errors: errors.length,
            error_details: errors.slice(0, 5),
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Geo enrichment error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
