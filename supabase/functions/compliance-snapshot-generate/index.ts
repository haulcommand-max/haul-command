import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { job_id } = await req.json().catch(() => ({ job_id: null }));
    if (!job_id) return new Response(JSON.stringify({ error: "Missing job_id" }), { status: 400 });

    const { data: job } = await admin.from("jobs").select("id, broker_id, driver_id, load_id, agreed_price_cents, currency, created_at").eq("id", job_id).single();
    if (!job) return new Response(JSON.stringify({ error: "Job not found" }), { status: 404 });

    const { data: driverDocs } = await admin
        .from("documents")
        .select("id, doc_type, status, expires_at, verified_at")
        .eq("owner_id", job.driver_id);

    const snapshot = {
        job,
        driver_documents: driverDocs ?? [],
        generated_at: new Date().toISOString(),
        disclaimer: "Snapshot reflects documents as of generated time. Operator remains responsible for route clearance and safe operation."
    };

    const snapshot_id = crypto.randomUUID();
    const storage_path = `evidence-private/${job.driver_id}/snapshots/${snapshot_id}.json`;

    // upload JSON to storage
    const enc = new TextEncoder();
    const { error: upErr } = await admin.storage.from("evidence-private")
        .upload(storage_path, enc.encode(JSON.stringify(snapshot, null, 2)), { contentType: "application/json", upsert: true });

    if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });

    // also register as a "document" (optional but useful)
    const { error: docErr } = await admin.from("documents").insert({
        id: snapshot_id,
        owner_id: job.driver_id,
        doc_type: "other",
        status: "verified",
        storage_path,
    });

    if (docErr) return new Response(JSON.stringify({ error: docErr.message }), { status: 500 });

    await admin.from("jobs").update({ compliance_snapshot_id: snapshot_id }).eq("id", job_id);

    return new Response(JSON.stringify({ snapshot_doc_id: snapshot_id, storage_path }), {
        headers: { "Content-Type": "application/json" },
    });
});
