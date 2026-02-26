import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * premium-auction-tick — Cron Edge Function (every 5 min)
 * Promotes scheduled→live, closes ended auctions, queues notifications
 */
serve(async () => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )
        const results: Record<string, number> = { promoted: 0, closed: 0, notified: 0 };

        // 1. Promote scheduled → live
        const { data: toPromote } = await supabase
            .from('page_auction_cycles')
            .select('id, premium_page_id')
            .eq('status', 'scheduled')
            .lte('starts_at', new Date().toISOString());

        for (const auction of (toPromote || [])) {
            await supabase.from('page_auction_cycles').update({ status: 'live' }).eq('id', auction.id);
            await supabase.from('premium_page_audit_log').insert({
                entity_type: 'auction', entity_id: auction.id, action: 'promoted_to_live', meta: {}
            });
            // Notify watchers
            const { data: watchers } = await supabase
                .from('page_watchers').select('advertiser_id').eq('premium_page_id', auction.premium_page_id);
            for (const w of (watchers || [])) {
                await supabase.from('page_notifications_outbox').insert({
                    channel: 'inapp', to_ref: w.advertiser_id, template: 'auction_opening',
                    payload: { auction_id: auction.id, premium_page_id: auction.premium_page_id }
                });
                results.notified++;
            }
            results.promoted++;
        }

        // 2. Close ended auctions
        const { data: toClose } = await supabase
            .from('page_auction_cycles')
            .select('id')
            .eq('status', 'live')
            .lte('ends_at', new Date().toISOString());

        for (const auction of (toClose || [])) {
            await supabase.rpc('premium_page_close_auction', { p_auction_cycle_id: auction.id });
            results.closed++;
        }

        return new Response(JSON.stringify({ success: true, ...results }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: String(error) }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
})
