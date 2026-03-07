// =====================================================================
// Next.js admin moderation actions — service_role only
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

/** Ban an identity for N days. Writes to hc_moderation_actions audit log. */
export async function modBanIdentity(
    supabase: SupabaseClient,
    identityId: string,
    durationDays: number,
    reason: string
) {
    const { error } = await supabase.rpc("hc_ban_identity", {
        p_identity_id: identityId,
        p_duration_days: durationDays,
        p_reason: reason,
    });
    if (error) throw error;
}

/** Shadow-limit an identity (reduced caps, no ban message). */
export async function modShadowLimitIdentity(
    supabase: SupabaseClient,
    identityId: string,
    reason?: string
) {
    const { error } = await supabase.rpc("hc_shadow_limit_identity", {
        p_identity_id: identityId,
        p_reason: reason ?? null,
    });
    if (error) throw error;
}

/** Fetch moderation action log (staff-only via RLS). */
export async function fetchModerationActions(
    supabase: SupabaseClient,
    limit = 100
) {
    const { data, error } = await supabase
        .from("hc_admin_moderation_actions_v")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data ?? [];
}

/** Run a merge sweep (dry run or live). Requires service_role client. */
export async function runMergeSweep(
    supabase: SupabaseClient,
    countryCode: string,
    entityType: string,
    options: {
        batchSize?: number;
        maxBatches?: number;
        maxMergesTotal?: number;
        maxMergesPerCluster?: number;
        maxDistanceM?: number;
        minNameSim?: number;
        dryRun?: boolean;
    } = {}
) {
    const { data, error } = await supabase.rpc("hc_merge_sweep", {
        p_country_code: countryCode,
        p_entity_type: entityType,
        p_batch_size: options.batchSize ?? 50,
        p_max_batches: options.maxBatches ?? 5,
        p_max_merges_total: options.maxMergesTotal ?? 500,
        p_max_merges_per_cluster: options.maxMergesPerCluster ?? 25,
        p_max_distance_m: options.maxDistanceM ?? 150,
        p_min_name_sim: options.minNameSim ?? 0.72,
        p_dry_run: options.dryRun ?? true,
    });
    if (error) throw error;
    return data;
}

// Types
export interface ModerationAction {
    action_id: string;
    moderator_user_id: string;
    target_identity_id: string | null;
    target_post_id: string | null;
    action_type: string;
    reason: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    target_display_name: string | null;
}

export interface MergeSweepResult {
    ok: boolean;
    country_code: string;
    entity_type: string;
    dry_run: boolean;
    batches_run: number;
    clusters_scanned: number;
    clusters_merged: number;
    merges_total: number;
    plan: unknown[];
    job_run_id: string;
    error?: string;
}
