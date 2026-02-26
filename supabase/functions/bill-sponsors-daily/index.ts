
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function centsForEventType(billing: any, eventType: string) {
    if (eventType === "call") return billing.price_per_call_cents ?? 300;
    if (eventType === "save") return billing.price_per_save_cents ?? 150;
    return billing.price_per_click_cents ?? 75;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Uses service role for batch billing
        )

        const payload = await req.json()
        const billDateISO = payload.bill_date || new Date().toISOString().split('T')[0] // YYYY-MM-DD

        const start = new Date(billDateISO)
        start.setHours(0, 0, 0, 0)
        const end = new Date(billDateISO)
        end.setHours(23, 59, 59, 999)

        // 1. Fetch Sponsors in Performance Mode
        const { data: sponsors, error: sponsorError } = await supabaseClient
            .from("sponsor_billing_profiles")
            .select("*")
            .eq("billing_mode", "performance")
            .eq("is_active", true)

        if (sponsorError) throw sponsorError

        const results = []

        for (const billing of sponsors || []) {
            const sponsorId = billing.sponsor_id

            // 2. Aggregate Events for the day
            const { data: events, error: eventError } = await supabaseClient
                .from("qualified_events")
                .select("event_type")
                .eq("sponsor_id", sponsorId)
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString())

            if (eventError) continue

            const counts: Record<string, number> = { call: 0, click: 0, save: 0 }
            let rawTotalCents = 0

            for (const e of events || []) {
                if (e.event_type in counts) counts[e.event_type] += 1
                rawTotalCents += centsForEventType(billing, e.event_type)
            }

            // 3. Apply Budget and Cap
            const budget = billing.daily_budget_cents ?? 5000
            const cap = billing.daily_cap_cents ?? Math.round(budget * 1.2)
            const charged = Math.min(rawTotalCents, cap)

            // 4. Record to Ledger
            const { error: ledgerError } = await supabaseClient
                .from("sponsor_billing_ledger")
                .upsert({
                    sponsor_id: sponsorId,
                    bill_date: billDateISO,
                    total_events: (events?.length ?? 0),
                    total_cents: charged,
                    breakdown: {
                        counts,
                        raw_total_cents: rawTotalCents,
                        cap_cents: cap,
                        budget_cents: budget
                    },
                    status: "posted"
                }, { onConflict: "sponsor_id,bill_date" })

            results.push({
                sponsor_id: sponsorId,
                charged,
                events: events?.length ?? 0,
                error: ledgerError?.message
            })
        }

        return new Response(JSON.stringify({ ok: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
