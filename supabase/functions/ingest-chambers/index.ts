import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
    try {
        const { record } = await req.json(); // Expected payload from Postgres Trigger or pg_net webhook on ingestion_jobs

        if (!record || record.job_type !== 'seed' || record.status !== 'queued') {
            return new Response(JSON.stringify({ message: 'Ignored' }), { status: 200 });
        }

        // Mark running
        await supabase.from('ingestion_jobs').update({ status: 'running' }).eq('id', record.id);

        const targetUrl = record.cursor?.url;
        if (!targetUrl) throw new Error('No target URL in cursor');

        // Fetch HTML
        const response = await fetch(targetUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Very basic parsing heuristic for demonstration - in production, this would use LLM extraction or strict CSS selectors per source
        const name = $('title').text().replace(/ - .*/, '').trim();
        const phone = $('a[href^="tel:"]').first().text().trim() || $('body').text().match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || '';
        const email = $('a[href^="mailto:"]').first().text().trim() || $('body').text().match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[0] || '';

        let website = targetUrl;
        const potentialWebsite = $('a').filter((i, el) => $(el).text().toLowerCase().includes('website')).attr('href');
        if (potentialWebsite && potentialWebsite.startsWith('http')) website = potentialWebsite;

        // Extract raw data
        const { data: rawData, error: rawError } = await supabase.from('chambers_raw').insert({
            source: 'seed_scraper',
            source_url: targetUrl,
            name: name,
            website: website,
            phone: phone,
            email: email,
            confidence: 0.8, // high confidence for seed
            raw_json: { headers: Object.fromEntries(response.headers.entries()) }
        }).select('id').single();

        if (rawError) throw rawError;

        // Execute Dedupe & Upsert via RPC
        const { data: canonicalId, error: rpcError } = await supabase.rpc('dedupe_and_upsert_chamber_raw', {
            p_raw_id: rawData.id
        });

        if (rpcError) throw rpcError;

        // Mark done
        await supabase.from('ingestion_jobs').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', record.id);

        return new Response(JSON.stringify({
            success: true,
            chamber_id: canonicalId
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Ingestion Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
