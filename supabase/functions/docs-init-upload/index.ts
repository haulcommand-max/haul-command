import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const body = await req.json().catch(() => null);
    const doc_type = body?.doc_type;
    const file_name = body?.file_name;
    const mime = body?.mime;

    if (!doc_type || !file_name || !mime) {
        return new Response(JSON.stringify({ error: "Missing doc_type/file_name/mime" }), { status: 400 });
    }

    // 1) create documents row
    const document_id = crypto.randomUUID();
    const ext = (file_name.split(".").pop() || "bin").toLowerCase();
    const storage_path = `private-docs/${user.id}/${doc_type}/${document_id}.${ext}`;

    const { error: docErr } = await adminClient
        .from("documents")
        .insert({
            id: document_id,
            owner_id: user.id,
            doc_type,
            storage_path,
            status: "uploaded",
        });

    if (docErr) return new Response(JSON.stringify({ error: docErr.message }), { status: 500 });

    // 2) create signed upload URL
    const { data: signed, error: signErr } = await adminClient.storage
        .from("private-docs")
        .createSignedUploadUrl(storage_path);

    if (signErr) return new Response(JSON.stringify({ error: signErr.message }), { status: 500 });

    return new Response(JSON.stringify({
        document_id,
        storage_path,
        signed_url: signed.signedUrl,
        expires_in: 600
    }), { headers: { "Content-Type": "application/json" } });
});
