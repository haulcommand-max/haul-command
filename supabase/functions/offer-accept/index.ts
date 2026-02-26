/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Extract offer_id from URL path or body
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const pathOfferId = pathParts[pathParts.length - 1];

    const body = await req.json().catch(() => ({}));
    const offer_id = (pathOfferId && pathOfferId !== "offer-accept") ? pathOfferId : body?.offer_id;

    if (!offer_id) return new Response(JSON.stringify({ error: "Missing offer_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const now = new Date().toISOString();
    const escort_id = user.id;

    // ══════════════════════════════════════════════════════════
    // ATOMIC ACCEPT — First write wins. Advisory lock on load_id.
    // ══════════════════════════════════════════════════════════

    // 1. Fetch the offer (verify ownership + eligibility)
    const { data: offer, error: fetchErr } = await supabase
        .from("match_offers")
        .select("id, load_id, broker_id, escort_id, status, expires_at, offered_rate, wave")
        .eq("id", offer_id)
        .single();

    if (fetchErr || !offer) return new Response(JSON.stringify({ error: "Offer not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    if (offer.escort_id !== escort_id) return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    if (!["offered", "viewed"].includes(offer.status)) {
        return new Response(JSON.stringify({
            error: "Offer not available",
            status: offer.status,
            message: offer.status === "accepted" ? "Already accepted" :
                offer.status === "expired" ? "Offer expired" :
                    offer.status === "rescinded" ? "Offer was rescinded" : "Offer unavailable",
        }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
        await supabase.from("match_offers").update({ status: "expired" }).eq("id", offer_id);
        return new Response(JSON.stringify({ error: "Offer expired", code: "OFFER_EXPIRED" }), {
            status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Acquire advisory lock on load_id to prevent double-accept
    //    Use hash of load_id UUID as lock key
    const lockKey = offer.load_id.replace(/-/g, "").substring(0, 8);
    const lockKeyInt = parseInt(lockKey, 16) % 2147483647;

    const { data: lockResult } = await supabase.rpc("pg_try_advisory_xact_lock", {
        key: lockKeyInt,
    }).single();
    // Note: advisory xact lock — if pg_try_advisory_xact_lock not available,
    // we fall through to the UNIQUE constraint on matches(load_id) as the safety net.

    // 3. Check if load already matched (race condition guard via DB constraint)
    const { data: existingMatch } = await supabase
        .from("matches")
        .select("id, escort_id")
        .eq("load_id", offer.load_id)
        .single();

    if (existingMatch) {
        const isSelf = existingMatch.escort_id === escort_id;
        return new Response(JSON.stringify({
            error: isSelf ? "You already accepted this load" : "Load already matched by another escort",
            code: "ALREADY_MATCHED",
            matched_by_self: isSelf,
            message: "You'll receive priority credit for the next match in this lane.",
        }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Accept the offer (update match_offer row)
    const { error: offerUpdateErr } = await supabase
        .from("match_offers")
        .update({ status: "accepted", responded_at: now })
        .eq("id", offer_id)
        .in("status", ["offered", "viewed"]); // Extra guard: only update if still open

    if (offerUpdateErr) return new Response(JSON.stringify({ error: offerUpdateErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // 5. Insert matches row (UNIQUE constraint on load_id is final safety net)
    const { data: matchRow, error: matchErr } = await supabase
        .from("matches")
        .insert({
            load_id: offer.load_id,
            broker_id: offer.broker_id,
            escort_id,
            accepted_offer_id: offer_id,
            accepted_at: now,
            status: "accepted",
            payout_status: "none",
        })
        .select("id")
        .single();

    if (matchErr) {
        // UNIQUE violation means another escort just accepted simultaneously
        if (matchErr.code === "23505") {
            return new Response(JSON.stringify({
                error: "Load just matched by another escort",
                code: "RACE_LOST",
                message: "You'll receive priority credit for the next match in this lane.",
            }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: matchErr.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 6. Mark load as matched
    await supabase
        .from("loads")
        .update({ status: "matched", updated_at: now })
        .eq("id", offer.load_id);

    // 7. Rescind all other outstanding offers for this load
    await supabase
        .from("match_offers")
        .update({ status: "rescinded" })
        .eq("load_id", offer.load_id)
        .neq("id", offer_id)
        .in("status", ["offered", "viewed"]);

    // 8. Set escort status to busy
    await supabase
        .from("escort_presence")
        .update({ status: "busy", updated_at: now })
        .eq("escort_id", escort_id);

    // 9. Update boost SLA log if this load was boosted
    await supabase
        .from("boost_sla_log")
        .update({ first_accept_at: now, sla_met: true })
        .eq("load_id", offer.load_id)
        .is("first_accept_at", null);

    // ── BLOCKER #5 FIX: Wire data spine — ingest escort_responded event ──
    // This feeds: fill probability, response rate metrics, broker risk scorer
    await supabase.rpc('ingest_event', {
        p_event_type: 'escort_responded',
        p_actor_id: escort_id,
        p_entity_id: offer.load_id,
        p_payload: {
            offer_id,
            wave: offer.wave,
            response: 'accepted',
            responded_at: now,
            broker_id: offer.broker_id,
            offered_rate: offer.offered_rate,
        },
        p_corridor_id: null,  // corridor resolved by ingest_event via load lookup
    }).catch(() => { /* non-fatal */ });

    // ── Wire broker memory: record pairing for repeat-match boost ──
    await supabase.rpc('record_broker_pairing', {
        p_broker_id: offer.broker_id,
        p_escort_id: escort_id,
        p_corridor_id: null,
        p_rate_per_mile: offer.offered_rate,
    }).catch(() => { /* non-fatal */ });

    return new Response(JSON.stringify({
        ok: true,
        match_id: matchRow.id,
        load_id: offer.load_id,
        accepted_at: now,
        message: "Match confirmed. Your status is now busy.",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
