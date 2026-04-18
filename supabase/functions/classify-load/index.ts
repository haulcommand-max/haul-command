// supabase/functions/classify-load/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Zero-shot load classification using facebook/bart-large-mnli.
// Auto-categorises broker load postings by type and urgency.
// Powers autonomous dispatch — no explicit rules needed per edge case.
//
// Deploy: supabase functions deploy classify-load
// Invoke: POST { "load_id": "uuid", "description": "...", "dimensions": {...} }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const HF_BART_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";

const LOAD_TYPE_LABELS = [
  "oversize load requiring pilot car escort",
  "heavy haul requiring multiple escorts",
  "superload requiring permit and route survey",
  "standard wide load single escort",
  "tall load with height restrictions",
  "long load with rear escort needed",
  "hazardous material transport",
  "routine escort job",
];

const URGENCY_LABELS = [
  "urgent same-day dispatch",
  "next-day scheduled move",
  "standard scheduled move 2-5 days out",
  "flexible timeline over one week",
  "recurring standing order",
];

const EQUIPMENT_LABELS = [
  "pilot car required",
  "high-pole vehicle required",
  "shadow vehicle required",
  "air escort required",
  "no special equipment needed",
];

async function classify(
  text: string,
  labels: string[],
  token: string,
): Promise<{ label: string; score: number; all: Array<{ label: string; score: number }> }> {
  const res = await fetch(HF_BART_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      parameters: { candidate_labels: labels },
    }),
  });

  if (!res.ok) throw new Error(`HF classify error: ${await res.text()}`);

  const result = await res.json();
  const all = (result.labels as string[]).map((l: string, i: number) => ({
    label: l,
    score: result.scores[i] as number,
  }));

  return { label: all[0].label, score: all[0].score, all };
}

Deno.serve(async (req: Request) => {
  try {
    const { load_id, description, dimensions } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: "description is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const token = Deno.env.get("HF_API_TOKEN")!;

    // Build enriched context for better classification
    const context = [
      description,
      dimensions?.width  ? `Width: ${dimensions.width}ft`  : "",
      dimensions?.height ? `Height: ${dimensions.height}ft` : "",
      dimensions?.length ? `Length: ${dimensions.length}ft` : "",
      dimensions?.weight ? `Weight: ${dimensions.weight}lbs` : "",
    ].filter(Boolean).join(". ");

    // Run all three classifications in parallel
    const [loadType, urgency, equipment] = await Promise.all([
      classify(context, LOAD_TYPE_LABELS, token),
      classify(context, URGENCY_LABELS, token),
      classify(context, EQUIPMENT_LABELS, token),
    ]);

    const classification = {
      load_id:              load_id ?? null,
      load_type:            loadType.label,
      load_type_confidence: loadType.score,
      urgency:              urgency.label,
      urgency_confidence:   urgency.score,
      equipment_needed:     equipment.label,
      equipment_confidence: equipment.score,
      requires_pilot_car:   loadType.label.includes("pilot car") || equipment.label.includes("pilot car"),
      is_superload:         loadType.label.includes("superload"),
      is_urgent:            urgency.label.includes("same-day"),
      all_load_scores:      loadType.all,
      all_urgency_scores:   urgency.all,
    };

    // Write classification back to loads table if load_id provided
    if (load_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      await fetch(`${supabaseUrl}/rest/v1/loads?id=eq.${load_id}`, {
        method: "PATCH",
        headers: {
          apikey:            supabaseKey,
          Authorization:     `Bearer ${supabaseKey}`,
          "Content-Type":    "application/json",
          Prefer:            "return=minimal",
        },
        body: JSON.stringify({
          ai_load_type:     loadType.label,
          ai_urgency:       urgency.label,
          ai_classified_at: new Date().toISOString(),
        }),
      });
    }

    return new Response(JSON.stringify(classification), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[classify-load]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
