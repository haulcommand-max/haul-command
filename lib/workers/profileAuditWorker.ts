/**
 * lib/workers/profileAuditWorker.ts
 * Haul Command — Profile Local-Intent Audit Worker
 *
 * Implements the full audit spec:
 *   - Scores geo_truth, local_intent_packaging, proof_conversion,
 *     render_visibility, link_graph, freshness per profile class
 *   - Emits HC_AUDIT_* fail codes
 *   - Routes repairs to correct worker
 *   - Writes to profile_audit_runs, hc_events, hc_surface_effects
 *
 * Called via job envelope: { job_type: "profile-local-intent-audit-worker", ... }
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ProfileClass = 'local' | 'service_area' | 'directory_only';
export type ConfidenceState =
  | 'verified_current'
  | 'verified_but_review_due'
  | 'partially_verified'
  | 'seeded_needs_review'
  | 'historical_reference_only';

export interface ProfileAuditInput {
  entity_id: string;
  hc_id?: string;
  profile_class: ProfileClass;
  country_code: string;
  region_code?: string;
  city_name?: string;
  lat?: number;
  lng?: number;
  map_pin_accuracy_score?: number;
  base_location_type?: string;
  service_areas?: string[];
  coverage_corridors?: string[];
  hyperlocal_tokens?: string[];
  primary_role_term_local?: string;
  language_code_primary?: string;
  title_tag?: string;
  h1?: string;
  opening_copy?: string;
  faq_items?: { question: string; answer: string; visible: boolean }[];
  proof_block_items?: unknown[];
  cta_mode?: string;
  cta_above_fold?: boolean;
  proof_above_fold?: boolean;
  critical_copy_hidden?: boolean;
  hero_oversized?: boolean;
  review_count?: number;
  review_score?: number;
  certifications?: string[];
  insurance_status?: string;
  response_speed_seconds?: number;
  availability_status?: string;
  recent_job_count?: number;
  photo_count?: number;
  last_verified_at?: string;
  city_page_id?: string;
  region_page_id?: string;
  country_page_id?: string;
  tool_links?: string[];
  regulation_links?: string[];
  glossary_links?: string[];
  related_profile_links?: string[];
  freshness_score?: number;
  proof_updated_at?: string;
  content_updated_at?: string;
  links_updated_at?: string;
  profile_updated_at?: string;
}

export interface AuditResult {
  entity_id: string;
  hc_id?: string;
  profile_class: ProfileClass;
  audit_version: 'v1';
  audit_status: 'passed' | 'failed' | 'hard_failed';
  score_total: number;
  pass_threshold: number;
  hard_fail: boolean;
  component_scores: Record<string, number>;
  fail_reason_codes: string[];
  repair_actions: { worker: string; reason: string }[];
  events_emitted: string[];
  surface_effect_candidates: unknown[];
  next_refresh_due_at: string;
}

// ─── Hard fail codes ──────────────────────────────────────────────────────────
const HARD_FAIL_CODES = new Set([
  'HC_AUDIT_MISSING_HC_ID',
  'HC_AUDIT_MISSING_COUNTRY',
  'HC_AUDIT_MISSING_CITY',
  'HC_AUDIT_INVALID_PROFILE_CLASS',
  'HC_AUDIT_GENERIC_TITLE',
  'HC_AUDIT_TITLE_MISSING_ROLE',
  'HC_AUDIT_TITLE_MISSING_GEO',
  'HC_AUDIT_H1_MISSING_ROLE',
  'HC_AUDIT_H1_MISSING_GEO',
  'HC_AUDIT_H1_NOT_VISIBLE',
  'HC_AUDIT_OPENING_COPY_COMPANY_FIRST',
  'HC_AUDIT_NO_ABOVE_FOLD_CTA',
  'HC_AUDIT_NO_ABOVE_FOLD_PROOF',
  'HC_AUDIT_ORPHAN_PROFILE',
  'HC_AUDIT_SERVICE_AREA_MISSING',
]);

const GENERIC_TITLES = new Set(['home', 'homepage', 'index', 'welcome', 'main', 'page']);

// ─── Scoring helpers ──────────────────────────────────────────────────────────
function clamp(val: number): number {
  return Math.max(0, Math.min(100, val));
}

function daysSince(isoDate?: string): number {
  if (!isoDate) return 999;
  return (Date.now() - new Date(isoDate).getTime()) / 86_400_000;
}

// ─── Component scorers ────────────────────────────────────────────────────────
function scoreGeoTruth(p: ProfileAuditInput, fails: string[]): number {
  let score = 0;
  if (p.country_code) score += 20;
  else fails.push('HC_AUDIT_MISSING_COUNTRY');
  if (p.city_name) score += 20;
  else if (p.profile_class !== 'directory_only') fails.push('HC_AUDIT_MISSING_CITY');
  if (p.lat && p.lng) score += 20;
  else fails.push('HC_AUDIT_MISSING_LAT_LNG');
  if ((p.map_pin_accuracy_score ?? 0) > 0.7) score += 20;
  else if ((p.map_pin_accuracy_score ?? 0) > 0) score += 10;
  else fails.push('HC_AUDIT_LOW_MAP_PIN_ACCURACY');
  if (p.base_location_type) score += 10;
  if ((p.hyperlocal_tokens?.length ?? 0) > 0) score += 10;
  return clamp(score);
}

function scoreLocalIntent(p: ProfileAuditInput, fails: string[]): number {
  let score = 0;
  const title = (p.title_tag ?? '').toLowerCase();
  const h1 = (p.h1 ?? '').toLowerCase();
  const role = (p.primary_role_term_local ?? '').toLowerCase();
  const city = (p.city_name ?? '').toLowerCase();

  if (GENERIC_TITLES.has(title.trim())) fails.push('HC_AUDIT_GENERIC_TITLE');
  if (role && title.includes(role)) score += 30;
  else fails.push('HC_AUDIT_TITLE_MISSING_ROLE');
  if (city && title.includes(city)) score += 25;
  else fails.push('HC_AUDIT_TITLE_MISSING_GEO');
  if (role && h1.includes(role)) score += 10;
  else fails.push('HC_AUDIT_H1_MISSING_ROLE');
  if (city && h1.includes(city)) score += 10;
  else fails.push('HC_AUDIT_H1_MISSING_GEO');
  if (p.h1) score += 10; // H1 exists
  if (p.language_code_primary) score += 5;
  const openingCopy = (p.opening_copy ?? '').toLowerCase();
  const companyFirstWords = ['we are', 'our company', 'founded in', 'established', 'about us'];
  const isCompanyFirst = companyFirstWords.some((w) => openingCopy.startsWith(w));
  if (isCompanyFirst) fails.push('HC_AUDIT_OPENING_COPY_COMPANY_FIRST');
  else if (p.opening_copy) score += 10;
  return clamp(score);
}

function scoreProofConversion(p: ProfileAuditInput, fails: string[]): number {
  let score = 0;
  if ((p.review_count ?? 0) > 0) score += 20;
  if ((p.certifications?.length ?? 0) > 0) score += 15;
  if (p.response_speed_seconds) score += 15;
  if (p.availability_status && p.availability_status !== 'unknown') score += 15;
  if (p.proof_above_fold) score += 15;
  else fails.push('HC_AUDIT_NO_ABOVE_FOLD_PROOF');
  if (p.cta_above_fold) score += 20;
  else fails.push('HC_AUDIT_NO_ABOVE_FOLD_CTA');
  return clamp(score);
}

function scoreRenderVisibility(p: ProfileAuditInput, fails: string[]): number {
  let score = 100;
  if (p.critical_copy_hidden) { score -= 40; fails.push('HC_AUDIT_CRITICAL_COPY_HIDDEN'); }
  const faqItems = p.faq_items ?? [];
  const hiddenFaqs = faqItems.filter((f) => !f.visible).length;
  if (hiddenFaqs > 0) { score -= 30; fails.push('HC_AUDIT_FAQ_HIDDEN'); }
  if (p.hero_oversized) { score -= 15; fails.push('HC_AUDIT_HERO_TOO_LARGE'); }
  if (!p.proof_above_fold && !p.critical_copy_hidden) score -= 15;
  return clamp(score);
}

function scoreLinkGraph(p: ProfileAuditInput, fails: string[]): number {
  let score = 0;
  if (p.city_page_id) score += 15; else fails.push('HC_AUDIT_NO_CITY_LINK');
  if (p.region_page_id) score += 15; else fails.push('HC_AUDIT_NO_REGION_LINK');
  if (p.country_page_id) score += 15; else fails.push('HC_AUDIT_NO_COUNTRY_LINK');
  if ((p.tool_links?.length ?? 0) > 0) score += 15; else fails.push('HC_AUDIT_NO_TOOL_LINKS');
  if ((p.regulation_links?.length ?? 0) > 0) score += 15; else fails.push('HC_AUDIT_NO_REGULATION_LINKS');
  if ((p.glossary_links?.length ?? 0) > 0) score += 10; else fails.push('HC_AUDIT_NO_GLOSSARY_LINKS');
  if ((p.related_profile_links?.length ?? 0) >= 2) score += 15;
  const isOrphan = !p.city_page_id && !p.region_page_id && !p.country_page_id;
  if (isOrphan) fails.push('HC_AUDIT_ORPHAN_PROFILE');
  return clamp(score);
}

function scoreFreshness(p: ProfileAuditInput, fails: string[]): number {
  let score = (p.freshness_score ?? 0) * 60;
  const proofAge = daysSince(p.proof_updated_at);
  if (proofAge < 30) score += 20;
  else if (proofAge < 90) score += 10;
  else fails.push('HC_AUDIT_PROOF_STALE');
  const contentAge = daysSince(p.content_updated_at);
  if (contentAge < 90) score += 10;
  else fails.push('HC_AUDIT_CONTENT_STALE');
  const linksAge = daysSince(p.links_updated_at);
  if (linksAge < 90) score += 10;
  else fails.push('HC_AUDIT_LINKS_STALE');
  return clamp(score);
}

function scoreServiceAreaTruth(p: ProfileAuditInput, fails: string[]): number {
  let score = 0;
  if (p.city_name) score += 20;
  if ((p.service_areas?.length ?? 0) > 0) score += 20;
  else fails.push('HC_AUDIT_SERVICE_AREA_MISSING');
  if ((p.service_areas?.length ?? 0) <= 20) score += 20;
  if ((p.coverage_corridors?.length ?? 0) > 0) score += 15;
  const fakeGlobal = (p.service_areas ?? []).some(
    (s) => s.toLowerCase() === 'worldwide' || s.toLowerCase() === 'global'
  );
  if (!fakeGlobal) score += 15;
  else fails.push('HC_AUDIT_FAKE_GLOBAL_COVERAGE');
  if ((p.hyperlocal_tokens?.length ?? 0) > 0) score += 10;
  return clamp(score);
}

// ─── Main audit function ──────────────────────────────────────────────────────
export function runProfileAudit(p: ProfileAuditInput): AuditResult {
  const fails: string[] = [];
  if (!p.hc_id) fails.push('HC_AUDIT_MISSING_HC_ID');
  const validClasses: ProfileClass[] = ['local', 'service_area', 'directory_only'];
  if (!validClasses.includes(p.profile_class)) fails.push('HC_AUDIT_INVALID_PROFILE_CLASS');

  const compScores: Record<string, number> = {};

  if (p.profile_class === 'local') {
    compScores.geo_truth = scoreGeoTruth(p, fails);
    compScores.local_intent_packaging = scoreLocalIntent(p, fails);
    compScores.proof_conversion = scoreProofConversion(p, fails);
    compScores.render_visibility = scoreRenderVisibility(p, fails);
    compScores.link_graph = scoreLinkGraph(p, fails);
    compScores.freshness = scoreFreshness(p, fails);
    compScores.score_total = clamp(
      compScores.geo_truth * 0.30 +
      compScores.local_intent_packaging * 0.20 +
      compScores.proof_conversion * 0.20 +
      compScores.render_visibility * 0.10 +
      compScores.link_graph * 0.10 +
      compScores.freshness * 0.10
    );
  } else if (p.profile_class === 'service_area') {
    compScores.geo_truth = scoreGeoTruth(p, fails);
    compScores.service_area_truth = scoreServiceAreaTruth(p, fails);
    compScores.local_intent_packaging = scoreLocalIntent(p, fails);
    compScores.proof_conversion = scoreProofConversion(p, fails);
    compScores.render_visibility = scoreRenderVisibility(p, fails);
    compScores.link_graph = scoreLinkGraph(p, fails);
    compScores.freshness = scoreFreshness(p, fails);
    compScores.score_total = clamp(
      compScores.geo_truth * 0.25 +
      compScores.service_area_truth * 0.20 +
      compScores.local_intent_packaging * 0.15 +
      compScores.proof_conversion * 0.15 +
      compScores.render_visibility * 0.10 +
      compScores.link_graph * 0.10 +
      compScores.freshness * 0.05
    );
  } else {
    // directory_only
    compScores.geo_truth = scoreGeoTruth(p, fails);
    compScores.local_intent_packaging = scoreLocalIntent(p, fails);
    compScores.link_graph = scoreLinkGraph(p, fails);
    compScores.freshness = scoreFreshness(p, fails);
    compScores.score_total = clamp(
      compScores.geo_truth * 0.15 +
      compScores.local_intent_packaging * 0.15 +
      (fails.includes('HC_AUDIT_ORPHAN_PROFILE') ? 0 : 20) + // content depth proxy
      compScores.link_graph * 0.20 +
      compScores.freshness * 0.10
    );
  }

  // Dedupe fails
  const uniqueFails = [...new Set(fails)];
  const hard_fail = uniqueFails.some((c) => HARD_FAIL_CODES.has(c));
  const score_total = Math.round(compScores.score_total * 100) / 100;
  const pass_threshold = 85;
  const passed = !hard_fail && score_total >= pass_threshold;

  // Repair routing
  const repair_actions: { worker: string; reason: string }[] = [];
  const titleH1Fails = uniqueFails.filter((c) =>
    ['HC_AUDIT_GENERIC_TITLE', 'HC_AUDIT_TITLE_MISSING_ROLE', 'HC_AUDIT_TITLE_MISSING_GEO',
     'HC_AUDIT_H1_MISSING_ROLE', 'HC_AUDIT_H1_MISSING_GEO', 'HC_AUDIT_H1_NOT_VISIBLE',
     'HC_AUDIT_OPENING_COPY_COMPANY_FIRST'].includes(c)
  );
  if (titleH1Fails.length > 0)
    repair_actions.push({ worker: 'page-blueprint-worker', reason: 'Fix title, H1, and opening copy local-intent packaging' });
  if (uniqueFails.includes('HC_AUDIT_FAQ_MISSING') || uniqueFails.includes('HC_AUDIT_FAQ_HIDDEN'))
    repair_actions.push({ worker: 'faq-worker', reason: 'Ensure FAQ is present and rendered visibly' });
  if (uniqueFails.some((c) => ['HC_AUDIT_NO_CITY_LINK', 'HC_AUDIT_NO_REGION_LINK', 'HC_AUDIT_NO_COUNTRY_LINK',
    'HC_AUDIT_NO_TOOL_LINKS', 'HC_AUDIT_NO_REGULATION_LINKS', 'HC_AUDIT_NO_GLOSSARY_LINKS', 'HC_AUDIT_ORPHAN_PROFILE'].includes(c)))
    repair_actions.push({ worker: 'internal-link-worker', reason: 'Rebuild upward, sideways, and outward link graph' });
  if (uniqueFails.some((c) => ['HC_AUDIT_PROOF_STALE', 'HC_AUDIT_CONTENT_STALE', 'HC_AUDIT_LINKS_STALE'].includes(c)))
    repair_actions.push({ worker: 'freshness-refresh-worker', reason: 'Refresh stale proof, content, and links' });

  // Events
  const events_emitted = ['profile.audit.started'];
  if (passed) {
    events_emitted.push('profile.audit.completed');
    if (compScores.geo_truth >= 70) events_emitted.push('profile.geo_truth.passed');
    if (compScores.local_intent_packaging >= 70) events_emitted.push('profile.local_intent.passed');
  } else {
    events_emitted.push(hard_fail ? 'profile.audit.failed' : 'profile.audit.completed');
    if ((compScores.local_intent_packaging ?? 100) < 70) events_emitted.push('profile.local_intent.failed');
    if ((compScores.proof_conversion ?? 100) < 70) events_emitted.push('profile.proof_conversion.failed');
    if ((compScores.render_visibility ?? 100) < 70) events_emitted.push('profile.render_visibility.failed');
    if ((compScores.link_graph ?? 100) < 70) events_emitted.push('profile.link_graph.failed');
    repair_actions.forEach((r) => events_emitted.push(`profile.repair.${r.worker.replace('-worker', '')}_required`));
  }

  const surface_effect_candidates = passed
    ? [{ affected_surface_type: 'profile', effect_type: 'seo_lift_candidate', effect_value: score_total / 100 }]
    : [];

  const refreshDays = score_total >= 90 ? 30 : score_total >= 70 ? 14 : 7;
  const next_refresh_due_at = new Date(Date.now() + refreshDays * 86_400_000).toISOString();

  return {
    entity_id: p.entity_id,
    hc_id: p.hc_id,
    profile_class: p.profile_class,
    audit_version: 'v1',
    audit_status: hard_fail ? 'hard_failed' : passed ? 'passed' : 'failed',
    score_total,
    pass_threshold,
    hard_fail,
    component_scores: compScores,
    fail_reason_codes: uniqueFails,
    repair_actions,
    events_emitted,
    surface_effect_candidates,
    next_refresh_due_at,
  };
}

// ─── Supabase writeback ───────────────────────────────────────────────────────
export async function writeAuditResult(
  result: AuditResult,
  workflowRunId?: string,
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Write audit run
  const { data: auditRun, error: runErr } = await supabase
    .from('profile_audit_runs')
    .insert({
      entity_id: result.entity_id,
      hc_id: result.hc_id,
      profile_class: result.profile_class,
      audit_status: result.audit_status,
      score_total: result.score_total,
      pass_threshold: result.pass_threshold,
      hard_fail: result.hard_fail,
      score_geo_truth: result.component_scores.geo_truth,
      score_local_intent_packaging: result.component_scores.local_intent_packaging,
      score_proof_conversion: result.component_scores.proof_conversion,
      score_render_visibility: result.component_scores.render_visibility,
      score_link_graph: result.component_scores.link_graph,
      score_freshness: result.component_scores.freshness,
      score_service_area_truth: result.component_scores.service_area_truth,
      fail_reason_codes: result.fail_reason_codes,
      repair_actions_json: result.repair_actions,
      events_emitted_json: result.events_emitted,
      surface_effect_candidates_json: result.surface_effect_candidates,
      next_refresh_due_at: result.next_refresh_due_at,
      workflow_run_id: workflowRunId,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (runErr) { console.error('[profileAuditWorker] run write error', runErr); return; }

  // Write repair queue
  if (result.repair_actions.length > 0) {
    await supabase.from('profile_audit_repairs').insert(
      result.repair_actions.map((r) => ({
        audit_run_id: auditRun.id,
        entity_id: result.entity_id,
        worker_key: r.worker,
        repair_reason: r.reason,
        fail_codes: result.fail_reason_codes,
        status: 'queued',
      }))
    );
  }

  // Emit events to hc_events bus
  if (result.events_emitted.length > 0) {
    await supabase.from('hc_events').insert(
      result.events_emitted.map((eventType) => ({
        event_type: eventType,
        event_source: 'profile-local-intent-audit-worker',
        entity_type: 'person', // will refine per entity_type
        entity_id: result.entity_id,
        actor_type: 'worker',
        payload_json: { audit_run_id: auditRun.id, score_total: result.score_total },
        status: 'queued',
      }))
    );
  }

  // Write surface effects
  if (result.surface_effect_candidates.length > 0) {
    await supabase.from('hc_surface_effects').insert(
      result.surface_effect_candidates.map((c: any) => ({
        source_type: 'profile_audit_run',
        source_id: auditRun.id,
        affected_surface_type: c.affected_surface_type,
        affected_surface_id: result.entity_id,
        effect_type: c.effect_type,
        effect_value: c.effect_value,
        metadata_json: { profile_class: result.profile_class },
      }))
    );
  }
}
