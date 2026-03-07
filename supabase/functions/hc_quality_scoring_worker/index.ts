import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function env(name: string): string { const v = Deno.env.get(name); if (!v) throw new Error(`Missing env ${name}`); return v; }
function json(status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } }); }

/**
 * Quality Scoring Worker — Scores operators on 6 dimensions:
 *  1. Completeness — profile fullness
 *  2. Contact — phone/email/website reachable
 *  3. Geo — coordinates, city, state present
 *  4. Trust — verification, insurance, certifications
 *  5. Monetization — claim, ads, leads readiness
 *  6. Final — weighted composite
 */
Deno.serve(async (req) => {
    try {
        if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
        const url = env("SUPABASE_URL");
        const key = env("SUPABASE_SERVICE_ROLE_KEY");
        const supabase = createClient(url, key, { auth: { persistSession: false } });
        const body = await req.json().catch(() => ({}));
        const countryCode = (body.country_code || "").toUpperCase() || null;
        const batchSize = body.batch_size || 500;

        let query = supabase.from("operators")
            .select("id,display_name,company_name,phone,email,website_url,home_base_city,home_base_state,country_code,latitude,longitude,is_claimed,verification_status,insurance_status,certifications_json,us_dot_number,vehicle_type,trust_score,review_count,completed_escorts")
            .order("updated_at", { ascending: true }).limit(batchSize);
        if (countryCode) query = query.eq("country_code", countryCode);

        const { data: operators, error: oErr } = await query;
        if (oErr) return json(500, { ok: false, error: oErr.message });
        if (!operators || operators.length === 0) return json(200, { ok: true, scored: 0 });

        let scored = 0;
        const badges_awarded: Record<string, number> = {};

        for (const op of operators) {
            let completeness = 0;
            if (op.display_name || op.company_name) completeness += 15;
            if (op.phone) completeness += 20;
            if (op.email) completeness += 15;
            if (op.website_url) completeness += 10;
            if (op.vehicle_type) completeness += 10;
            if (op.us_dot_number) completeness += 15;
            if (op.home_base_city) completeness += 10;
            if (op.home_base_state) completeness += 5;
            completeness = Math.min(100, completeness);

            let contact = 0;
            if (op.phone) contact += 50;
            if (op.email) contact += 30;
            if (op.website_url) contact += 20;

            let geo = 0;
            if (op.latitude && op.longitude) geo += 50;
            if (op.home_base_city) geo += 30;
            if (op.home_base_state) geo += 20;

            let trust = 0;
            if (op.verification_status === "verified") trust += 35;
            if (op.insurance_status === "verified") trust += 25;
            if (op.is_claimed) trust += 20;
            const certs = op.certifications_json || {};
            const certCount = Object.values(certs).filter(Boolean).length;
            trust += Math.min(20, certCount * 5);
            trust = Math.min(100, trust);

            let monetization = 0;
            if (op.is_claimed) monetization += 40;
            if (op.verification_status === "verified") monetization += 25;
            if (op.phone && op.email) monetization += 20;
            if (op.completed_escorts && op.completed_escorts > 0) monetization += 15;
            monetization = Math.min(100, monetization);

            const final_score = Math.round(completeness * 0.20 + contact * 0.15 + geo * 0.15 + trust * 0.30 + monetization * 0.20);

            const badges: string[] = [];
            if (final_score >= 80) badges.push("top_performer");
            if (completeness >= 90) badges.push("complete_profile");
            if (trust >= 75) badges.push("trusted");
            if (contact >= 100) badges.push("reachable");
            if (monetization >= 80) badges.push("revenue_ready");
            for (const b of badges) badges_awarded[b] = (badges_awarded[b] || 0) + 1;

            const { error: uErr } = await supabase.from("operator_quality").upsert({
                operator_id: op.id, country_code: op.country_code || "US",
                completeness_score: completeness, contact_score: contact, geo_score: geo,
                trust_score: trust, monetization_score: monetization, final_score, badges,
                last_scored_at: new Date().toISOString(),
                score_inputs: { has_phone: !!op.phone, has_email: !!op.email, is_claimed: !!op.is_claimed, is_verified: op.verification_status === "verified", cert_count: certCount },
            }, { onConflict: "operator_id" });
            if (!uErr) scored++;
        }
        return json(200, { ok: true, country_code: countryCode || "ALL", scored, total_operators: operators.length, badges_awarded });
    } catch (e) { return json(500, { ok: false, error: (e as Error).message }); }
});
