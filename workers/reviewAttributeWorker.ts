import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Review Attribute Extraction Worker
 * 
 * Takes a raw review, extracts structured attributes from text,
 * writes hc_review_attributes, and updates entity attribute confidence.
 * 
 * In production this would call an LLM. For now: keyword extraction.
 */

const ATTRIBUTE_KEYWORDS: Record<string, string[]> = {
  same_day_escort: ["same day", "same-day", "short notice", "last minute"],
  twic: ["twic", "port", "port access"],
  overnight_escort: ["overnight", "night move", "after dark"],
  weekend_escort: ["weekend", "saturday", "sunday"],
  emergency_response: ["emergency", "urgent", "last-minute", "no-show"],
  height_pole: ["height pole", "pole car", "high pole"],
  lightbar: ["lightbar", "light bar", "warning lights"],
  oversize_signage: ["oversize", "wide load", "over-dimensional"],
  wind: ["wind", "blade", "turbine"],
  port: ["port", "dock", "terminal"],
  oil_and_gas: ["oil", "gas", "refinery", "oilfield", "permian"],
  insured: ["insured", "insurance", "coverage"],
  fast_response: ["fast", "quick", "responded quickly", "within minutes"],
};

export async function extractReviewAttributes(jobPayload: {
  review_id: string;
  entity_id: string;
  review_text: string;
}) {
  const { review_id, entity_id, review_text } = jobPayload;
  const lower = review_text.toLowerCase();
  const extracted: { attribute_key: string; snippet: string; confidence: number }[] = [];

  for (const [attrKey, keywords] of Object.entries(ATTRIBUTE_KEYWORDS)) {
    for (const kw of keywords) {
      const idx = lower.indexOf(kw);
      if (idx !== -1) {
        // Extract surrounding snippet (50 chars each side)
        const start = Math.max(0, idx - 50);
        const end = Math.min(review_text.length, idx + kw.length + 50);
        const snippet = review_text.slice(start, end).trim();

        extracted.push({
          attribute_key: attrKey,
          snippet,
          confidence: 0.75,
        });
        break; // One match per attribute per review
      }
    }
  }

  // Write to hc_review_attributes
  if (extracted.length > 0) {
    // Look up attribute IDs
    const { data: attrs } = await supabaseAdmin
      .from("hc_attributes")
      .select("id, canonical_key")
      .in("canonical_key", extracted.map((e) => e.attribute_key));

    const attrMap = new Map((attrs || []).map((a) => [a.canonical_key, a.id]));

    const rows = extracted
      .filter((e) => attrMap.has(e.attribute_key))
      .map((e) => ({
        review_id,
        entity_id,
        attribute_id: attrMap.get(e.attribute_key),
        snippet_text: e.snippet,
        confidence_score: e.confidence,
        sentiment_direction: "positive",
        ai_snippet_candidate: e.snippet.length > 30,
      }));

    if (rows.length > 0) {
      await supabaseAdmin.from("hc_review_attributes").insert(rows);
    }
  }

  return {
    review_id,
    extracted_count: extracted.length,
    attributes: extracted.map((e) => e.attribute_key),
  };
}
