import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12'

/**
 * Refresh Chamber Sites — Edge Function
 * 
 * Re-fetches stale chamber websites to update contact info.
 * Selects chambers with low data_freshness_score, re-scrapes contact pages,
 * and updates phone/address if changed.
 * 
 * Trigger: POST /functions/v1/refresh-chamber-sites
 */

const BATCH_SIZE = 10;
const STALE_THRESHOLD = 0.4; // freshness < 0.4 = stale
const REQUEST_DELAY_MS = 2000; // polite crawl delay

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Find stale chambers with websites
        const { data: staleChambers } = await supabase
            .from('chambers')
            .select('id, canonical_name, website, phone, email, address_line1, city, region, data_freshness_score')
            .lt('data_freshness_score', STALE_THRESHOLD)
            .not('website', 'is', null)
            .order('data_freshness_score', { ascending: true })
            .limit(BATCH_SIZE);

        if (!staleChambers || staleChambers.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                refreshed: 0,
                message: 'No stale chambers to refresh'
            }), { headers: { 'Content-Type': 'application/json' } });
        }

        let refreshed = 0;
        let updated = 0;
        const errors: string[] = [];

        for (const chamber of staleChambers) {
            try {
                const response = await fetch(chamber.website, {
                    headers: { 'User-Agent': 'HaulCommand-Bot/1.0 (+https://haulcommand.com/bot)' },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(10000),
                });

                if (!response.ok) {
                    errors.push(`${chamber.id}: HTTP ${response.status}`);
                    continue;
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                // Extract updated contact info
                const newPhone = $('a[href^="tel:"]').first().text().trim() ||
                    $('body').text().match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || '';
                const newEmail = $('a[href^="mailto:"]').first().text().trim() ||
                    $('body').text().match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[0] || '';

                // Build update object (only update if we found new non-empty data)
                const updates: Record<string, unknown> = {
                    last_verified_at: new Date().toISOString(),
                    data_freshness_score: 1.0,
                    updated_at: new Date().toISOString(),
                };

                let changed = false;
                if (newPhone && newPhone !== chamber.phone) {
                    updates.phone = newPhone;
                    changed = true;
                }
                if (newEmail && newEmail !== chamber.email) {
                    updates.email = newEmail;
                    changed = true;
                }

                await supabase.from('chambers').update(updates).eq('id', chamber.id);
                refreshed++;
                if (changed) updated++;

                // Polite delay between requests
                await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));

            } catch (e) {
                errors.push(`${chamber.id}: ${e instanceof Error ? e.message : 'Fetch failed'}`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            total_stale: staleChambers.length,
            refreshed,
            updated_contacts: updated,
            errors: errors.length,
            error_details: errors.slice(0, 5),
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Chamber refresh error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
