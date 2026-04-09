/**
 * Haul Command — Training RPC pack
 * Server-side Supabase calls for the training system.
 * All functions are safe to call from RSC / server actions.
 */
import { supabaseServer } from '@/lib/supabase-server';
import type {
  TrainingHubPayload,
  TrainingPagePayload,
  TrainingUserStatus,
  TrainingBadgeEffect,
  TrainingEnterprisePayload,
  TrainingModule,
  TrainingLevel,
  TrainingGeoFit,
} from './types';

// ─── Hub ─────────────────────────────────────────────────────
export async function getTrainingHubPayload(): Promise<TrainingHubPayload | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc('training_hub_payload');
  if (error) {
    console.error('[Training RPC] training_hub_payload error:', error.message);
    return null;
  }
  return data as TrainingHubPayload;
}

// ─── Page (training entry) ───────────────────────────────────
export async function getTrainingPagePayload(
  trainingSlug: string,
  countryCode?: string,
  regionCode?: string,
): Promise<TrainingPagePayload | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc('training_page_payload', {
    p_training_slug: trainingSlug,
    p_country_code: countryCode ?? null,
    p_region_code: regionCode ?? null,
  });
  if (error) {
    console.error('[Training RPC] training_page_payload error:', error.message);
    return null;
  }
  return data as TrainingPagePayload;
}

// ─── Module page ─────────────────────────────────────────────
export async function getTrainingModuleBySlug(slug: string): Promise<TrainingModule | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('training_modules')
    .select('*, training_catalog(*)')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data as TrainingModule;
}

// ─── Level page ──────────────────────────────────────────────
export async function getTrainingLevelBySlug(levelSlug: string): Promise<TrainingLevel | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('training_levels')
    .select('*, training_catalog(*)')
    .eq('level_slug', levelSlug)
    .single();
  if (error) return null;
  return data as TrainingLevel;
}

// ─── Geo fit for country page ─────────────────────────────────
export async function getTrainingGeoFit(countryCode: string, regionCode?: string): Promise<TrainingGeoFit[]> {
  const supabase = supabaseServer();
  let q = supabase
    .from('training_geo_fit')
    .select('*')
    .eq('country_code', countryCode.toLowerCase());
  if (regionCode) q = q.eq('region_code', regionCode.toLowerCase());
  const { data } = await q;
  return (data as TrainingGeoFit[]) ?? [];
}

// ─── User training status ─────────────────────────────────────
export async function getTrainingUserStatus(userId: string): Promise<TrainingUserStatus | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc('training_user_status_payload', {
    p_user_id: userId,
  });
  if (error) return null;
  return data as TrainingUserStatus;
}

// ─── Badge effects ────────────────────────────────────────────
export async function getTrainingBadgeEffects(badgeSlug: string): Promise<TrainingBadgeEffect[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc('training_badge_effects_payload', {
    p_badge_slug: badgeSlug,
  });
  if (error) return [];
  return (data as TrainingBadgeEffect[]) ?? [];
}

// ─── Enterprise payload ───────────────────────────────────────
export async function getTrainingEnterprisePayload(): Promise<TrainingEnterprisePayload | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc('training_enterprise_payload');
  if (error) return null;
  return data as TrainingEnterprisePayload;
}

// ─── All modules (for sitemap / static generation) ───────────
export async function getAllTrainingModuleSlugs(): Promise<string[]> {
  const supabase = supabaseServer();
  const { data } = await supabase.from('training_modules').select('slug');
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

// ─── All level slugs ──────────────────────────────────────────
export async function getAllTrainingLevelSlugs(): Promise<string[]> {
  const supabase = supabaseServer();
  const { data } = await supabase.from('training_levels').select('level_slug');
  return (data ?? []).map((r: { level_slug: string }) => r.level_slug);
}
