// lib/legal/freshness-confidence.ts
// Legal Freshness OS — confidence labels, freshness tracking, safe degradation
// Rule: Do not present seeded or stale legal content as current verified law.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export type LegalConfidence =
  | "verified_current"
  | "verified_but_review_due"
  | "partially_verified"
  | "seeded_needs_human_review"
  | "historical_reference_only";

export interface LegalFreshnessRecord {
  entity_type: "regulation" | "permit_rule" | "escort_requirement" | "frost_law" | "border_rule";
  entity_id: string;
  country_code: string;
  region?: string;
  confidence: LegalConfidence;
  last_verified_at: string | null;
  last_verified_by: string | null;
  official_source_url: string | null;
  official_source_name: string | null;
  review_cadence_days: number;
  next_review_due: string | null;
  known_facts: string[];
  unknown_gaps: string[];
  what_to_do_next: string;
  fallback_copy?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE EVALUATION
// ═══════════════════════════════════════════════════════════════

export function evaluateConfidence(record: {
  last_verified_at: string | null;
  review_cadence_days: number;
  official_source_url: string | null;
  has_human_review: boolean;
}): LegalConfidence {
  if (!record.last_verified_at || !record.has_human_review) {
    return "seeded_needs_human_review";
  }

  const daysSinceVerified = Math.floor(
    (Date.now() - new Date(record.last_verified_at).getTime()) / 86400000
  );

  if (daysSinceVerified > record.review_cadence_days * 3) {
    return "historical_reference_only";
  }

  if (daysSinceVerified > record.review_cadence_days) {
    return record.official_source_url ? "verified_but_review_due" : "partially_verified";
  }

  return record.official_source_url ? "verified_current" : "partially_verified";
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════

export const CONFIDENCE_DISPLAY: Record<LegalConfidence, {
  label: string;
  color: string;
  icon: string;
  warning?: string;
}> = {
  verified_current: {
    label: "Verified Current",
    color: "#10b981",
    icon: "✅",
  },
  verified_but_review_due: {
    label: "Review Scheduled",
    color: "#f59e0b",
    icon: "🔄",
    warning: "This information was verified but is due for review. Check official sources for recent changes.",
  },
  partially_verified: {
    label: "Partially Verified",
    color: "#f59e0b",
    icon: "⚠️",
    warning: "Some details may be incomplete. We recommend confirming with official sources.",
  },
  seeded_needs_human_review: {
    label: "Pending Expert Review",
    color: "#ef4444",
    icon: "🔍",
    warning: "This information has been compiled from public sources and has not yet been reviewed by an expert. Do not rely on it as legal advice.",
  },
  historical_reference_only: {
    label: "Historical Reference",
    color: "#6b7280",
    icon: "📚",
    warning: "This information may be outdated. Check current regulations before acting on it.",
  },
};

// ═══════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

export async function getLegalFreshness(
  entityType: string,
  entityId: string
): Promise<LegalFreshnessRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("legal_freshness")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();
  return data as LegalFreshnessRecord | null;
}

export async function upsertLegalFreshness(
  record: LegalFreshnessRecord
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const confidence = evaluateConfidence({
    last_verified_at: record.last_verified_at,
    review_cadence_days: record.review_cadence_days,
    official_source_url: record.official_source_url,
    has_human_review: record.last_verified_by !== null,
  });

  await supabase.from("legal_freshness").upsert({
    ...record,
    confidence,
    next_review_due: record.last_verified_at
      ? new Date(new Date(record.last_verified_at).getTime() + record.review_cadence_days * 86400000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "entity_type,entity_id" });
}

export async function getStaleRegulations(limit = 50): Promise<LegalFreshnessRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("legal_freshness")
    .select("*")
    .or("confidence.eq.seeded_needs_human_review,confidence.eq.historical_reference_only,confidence.eq.verified_but_review_due")
    .order("next_review_due", { ascending: true, nullsFirst: true })
    .limit(limit);
  return (data ?? []) as LegalFreshnessRecord[];
}
