
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const payload = await req.json()
        const { user_id, placement_id, event_type, region_code, meta, provider_id } = payload

        // 1. Check Feature Flag
        const { data: settings } = await supabaseClient
            .from("app_settings")
            .select("value")
            .eq("key", "monetization")
            .single()

        const perfEnabled = !!settings?.value?.performance_billing_enabled

        // 2. Load placement + sponsor
        const { data: placement } = await supabaseClient
            .from("sponsor_placements")
            .select("id, sponsor_id, category, region_code, is_active")
            .eq("id", placement_id)
            .single()

        if (!placement || !placement.is_active) {
            return new Response(JSON.stringify({ ok: false, reason: "inactive_placement" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // 3. Always write metrics for analytics
        await supabaseClient.from("sponsor_metrics").insert({
            sponsor_id: placement.sponsor_id,
            placement_id: placement.id,
            event_type: event_type,
            region_code: region_code
        })

        if (!perfEnabled) {
            return new Response(JSON.stringify({ ok: true, billed: false, mode: "performance_disabled" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 4. Check Sponsor Billing Profile
        const { data: billing } = await supabaseClient
            .from("sponsor_billing_profiles")
            .select("*")
            .eq("sponsor_id", placement.sponsor_id)
            .single()

        if (!billing?.is_active || billing.billing_mode !== "performance") {
            return new Response(JSON.stringify({ ok: true, billed: false, mode: "not_in_performance_mode" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 5. Quality Scoring (Phase 1)
        let quality = 50
        if (event_type === "call") quality += 25
        if (meta?.is_suspicious) quality -= 30
        if (meta?.user_trust_score) quality += Math.round(meta.user_trust_score / 10)
        quality = Math.max(0, Math.min(100, quality))

        if (quality < (billing.min_quality_score ?? 60)) {
            return new Response(JSON.stringify({ ok: true, billed: false, reason: "low_quality", quality_score: quality }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 6. Dedupe Key
        const timeBucketMinutes = 10
        const bucket = Math.floor(Date.now() / (timeBucketMinutes * 60 * 1000))
        const dedupe_key = `${user_id}:${placement_id}:${event_type}:${bucket}`

        // 7. Insert Billable Event
        const { error: insertError } = await supabaseClient.from("qualified_events").insert({
            sponsor_id: placement.sponsor_id,
            placement_id: placement.id,
            user_id: user_id,
            provider_id: provider_id ?? null,
            event_type: event_type,
            quality_score: quality,
            region_code: region_code,
            meta: meta ?? {},
            dedupe_key
        })

        if (insertError) {
            return new Response(JSON.stringify({ ok: true, billed: false, reason: "duplicate_event" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({ ok: true, billed: true, quality_score: quality }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
