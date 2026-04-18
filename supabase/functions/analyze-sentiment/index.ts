// supabase/functions/analyze-sentiment/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Runs sentiment analysis on operator messages using HuggingFace.
// Model: cardiffnlp/twitter-roberta-base-sentiment-latest
// Auto-creates an alert in hc_operator_alerts when negative sentiment > 0.7.
//
// Deploy: supabase functions deploy analyze-sentiment
// Invoke: POST { "text": "...", "operator_id": "uuid", "context_id": "..." }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const HF_API_URL =
  "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest";

const NEGATIVE_THRESHOLD = 0.7;   // Flag if negative score exceeds this
const HIGH_SEVERITY_THRESHOLD = 0.9; // Escalate to high severity above this

Deno.serve(async (req: Request) => {
  try {
    const { text, operator_id, context_id } = await req.json();

    if (!text || !operator_id) {
      return new Response(
        JSON.stringify({ error: "text and operator_id are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Run sentiment inference
    const hfRes = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("HF_API_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!hfRes.ok) {
      throw new Error(`HuggingFace API error: ${await hfRes.text()}`);
    }

    const result = await hfRes.json();
    // HF returns [[{label, score}, ...]] — pick highest score
    const scores: Array<{ label: string; score: number }> = result[0] ?? [];
    const top = scores.reduce((max, curr) =>
      curr.score > max.score ? curr : max,
    );

    const isNegative =
      top.label.toLowerCase().includes("negative") &&
      top.score > NEGATIVE_THRESHOLD;

    // Write alert if negative sentiment detected
    if (isNegative) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      await fetch(`${supabaseUrl}/rest/v1/hc_operator_alerts`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          operator_id,
          alert_type: "negative_sentiment",
          severity: top.score > HIGH_SEVERITY_THRESHOLD ? "high" : "medium",
          context: text.substring(0, 500),
          sentiment_score: top.score,
          context_id: context_id ?? null,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        sentiment:       top.label,
        score:           top.score,
        flagged:         isNegative,
        all_scores:      scores,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[analyze-sentiment]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
