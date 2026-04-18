// supabase/functions/generate-embedding/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Generates 384-dim sentence embeddings via HuggingFace Inference API.
// Model: all-MiniLM-L6-v2 — fast, accurate, free tier handles our volume.
//
// Deploy: supabase functions deploy generate-embedding
// Invoke: POST { "text": "...", "table": "hc_seo_pages", "record_id": "uuid" }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const HF_API_URL =
  "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";

Deno.serve(async (req: Request) => {
  try {
    const { text, table, record_id } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call HuggingFace Inference API
    const hfRes = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("HF_API_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true },
      }),
    });

    if (!hfRes.ok) {
      const err = await hfRes.text();
      throw new Error(`HuggingFace API error: ${err}`);
    }

    const embedding: number[] = await hfRes.json();

    // Optionally write embedding back to the specified table
    if (table && record_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${record_id}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ embedding: `[${embedding.join(",")}]` }),
      });
    }

    return new Response(JSON.stringify({ embedding }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-embedding]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
