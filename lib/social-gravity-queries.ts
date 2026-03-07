// =====================================================================
// Haul Command — Social Gravity Client Query Patterns
// Next.js + Supabase — zero-guessing contracts
// Generated: 2026-03-03
// =====================================================================

import { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────
// THREAD PANEL
// ─────────────────────────────────────────────────────────────────────

/**
 * ThreadPanel (compact): get thread metadata + top 3 posts
 */
export async function fetchThreadPanelCompact(
    supabase: SupabaseClient,
    scopeType: string,
    scopeId: string,
    mode: "top" | "new" = "top"
) {
    // 1) thread for scope
    const { data: thread, error: tErr } = await supabase
        .from("hc_scope_thread_v")
        .select(
            "thread_id,title,locked,archived,last_activity_at,posts_count"
        )
        .eq("scope_type", scopeType)
        .eq("scope_id", scopeId)
        .maybeSingle();

    if (tErr) throw tErr;
    if (!thread) return { thread: null, posts: [] };

    // 2) top/new posts preview (rn<=3)
    const view =
        mode === "top" ? "hc_thread_top_posts_v" : "hc_thread_new_posts_v";
    const { data: posts, error: pErr } = await supabase
        .from(view)
        .select(
            "post_id,parent_post_id,author_identity_id,body_md,created_at,score_weighted,rn"
        )
        .eq("thread_id", thread.thread_id)
        .lte("rn", 3)
        .order("rn", { ascending: true });

    if (pErr) throw pErr;
    return { thread, posts: posts ?? [] };
}

/**
 * ThreadPanel (full): get-or-create thread and fetch a page via RPC
 */
export async function ensureThreadAndFetchPage(
    supabase: SupabaseClient,
    scopeType: string,
    scopeId: string,
    title: string,
    sortMode: "hot" | "new" | "top" = "hot",
    pageSize = 30,
    cursor?: {
        score?: number;
        created_at?: string;
        post_id?: string;
    }
) {
    // 1) ensure thread exists (requires verified gate if creating)
    const { data: threadId, error: e1 } = await supabase.rpc(
        "hc_get_or_create_thread_for_scope",
        {
            p_scope_type: scopeType,
            p_scope_id: scopeId,
            p_title: title,
            p_visibility: "public",
        }
    );
    if (e1) throw e1;

    // 2) fetch page
    const { data: page, error: e2 } = await supabase.rpc(
        "hc_fetch_thread_page",
        {
            p_thread_id: threadId,
            p_sort_mode: sortMode,
            p_page_size: pageSize,
            p_cursor_score: cursor?.score ?? null,
            p_cursor_created_at: cursor?.created_at ?? null,
            p_cursor_post_id: cursor?.post_id ?? null,
        }
    );
    if (e2) throw e2;

    return { threadId, page: page ?? [] };
}

// ─────────────────────────────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────────────────────────────

/**
 * Create post (reply or top-level)
 */
export async function createPost(
    supabase: SupabaseClient,
    threadId: string,
    bodyMd: string,
    parentPostId?: string
) {
    const { data: postId, error } = await supabase.rpc("hc_create_post", {
        p_thread_id: threadId,
        p_parent_post_id: parentPostId ?? null,
        p_body_md: bodyMd,
        p_evidence_ref_id: null,
    });
    if (error) throw error;
    return postId as string;
}

/**
 * Vote post (weighted, server computed)
 */
export async function votePost(
    supabase: SupabaseClient,
    postId: string,
    vote: 1 | -1
) {
    const { error } = await supabase.rpc("hc_vote_post", {
        p_post_id: postId,
        p_vote: vote,
    });
    if (error) throw error;
}

/**
 * Report post
 */
export async function reportPost(
    supabase: SupabaseClient,
    postId: string,
    reasonCode: "spam" | "abuse" | "dox" | "fraud" | "other",
    details?: string
) {
    const { data: reportId, error } = await supabase.rpc("hc_report_post", {
        p_post_id: postId,
        p_reason_code: reasonCode,
        p_details: details ?? null,
    });
    if (error) throw error;
    return reportId as string;
}

// ─────────────────────────────────────────────────────────────────────
// REPUTATION
// ─────────────────────────────────────────────────────────────────────

/**
 * Cast reputation event (weighted, server computed)
 */
export async function castReputationEvent(
    supabase: SupabaseClient,
    subjectType: string,
    subjectId: string,
    eventType: string,
    reactionTag: string,
    commentText?: string
) {
    const { data: repEventId, error } = await supabase.rpc(
        "hc_cast_reputation_event",
        {
            p_subject_type: subjectType,
            p_subject_id: subjectId,
            p_event_type: eventType,
            p_reaction_tag: reactionTag,
            p_comment_text: commentText ?? null,
            p_evidence_ref_id: null,
        }
    );
    if (error) throw error;
    return repEventId as string;
}

/**
 * Open dispute against a reputation event
 */
export async function openDispute(
    supabase: SupabaseClient,
    repEventId: string,
    reasonCode: string,
    details: string
) {
    const { data: disputeId, error } = await supabase.rpc("hc_open_dispute", {
        rep_event_id: repEventId,
        reason_code: reasonCode,
        details,
    });
    if (error) throw error;
    return disputeId as string;
}

/**
 * Fetch reputation rollup for a subject
 */
export async function fetchReputationRollup(
    supabase: SupabaseClient,
    subjectType: string,
    subjectId: string
) {
    const { data, error } = await supabase
        .from("hc_subject_reputation_rollups")
        .select("*")
        .eq("subject_type", subjectType)
        .eq("subject_id", subjectId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────────────────────────────────
// SOCIAL GRAVITY
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetch social gravity score for an entity
 */
export async function fetchSocialGravityScore(
    supabase: SupabaseClient,
    entityType: string,
    entityId: string
) {
    const { data, error } = await supabase
        .from("hc_social_gravity_scores")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Fetch ranked operators (search results, directory)
 */
export async function fetchRankedOperators(
    supabase: SupabaseClient,
    limit = 25
) {
    const { data, error } = await supabase
        .from("v_hc_operator_ranked")
        .select("*")
        .order("boosted_score", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────
// MODERATION (admin only)
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetch moderation queue (reported + under_review posts)
 */
export async function fetchModerationQueue(
    supabase: SupabaseClient,
    limit = 50,
    offset = 0
) {
    const { data, error } = await supabase.rpc("hc_fetch_moderation_queue", {
        p_limit_n: limit,
        p_offset_n: offset,
    });
    if (error) throw error;
    return data ?? [];
}

/**
 * Remove a post (staff only)
 */
export async function modRemovePost(
    supabase: SupabaseClient,
    postId: string,
    notes?: string
) {
    const { error } = await supabase.rpc("hc_remove_post", {
        p_post_id: postId,
        p_reason_code: "moderation",
        p_notes: notes ?? null,
    });
    if (error) throw error;
}

/**
 * Mark post as spam (staff only, bumps author risk flags)
 */
export async function modMarkSpam(
    supabase: SupabaseClient,
    postId: string,
    notes?: string
) {
    const { error } = await supabase.rpc("hc_mark_spam", {
        p_post_id: postId,
        p_notes: notes ?? null,
    });
    if (error) throw error;
}

/**
 * Resolve a report (staff only)
 */
export async function modResolveReport(
    supabase: SupabaseClient,
    reportId: string,
    resolution: "upheld" | "rejected" | "removed" | "spam",
    notes?: string
) {
    const { error } = await supabase.rpc("hc_resolve_report", {
        p_report_id: reportId,
        p_resolution: resolution,
        p_notes: notes ?? null,
    });
    if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────
// CONVOY / TELEMETRY
// ─────────────────────────────────────────────────────────────────────

/**
 * Ingest convoy ping (single write path: telemetry + presence + event)
 */
export async function ingestConvoyPing(
    supabase: SupabaseClient,
    operatorId: string,
    lat: number,
    lng: number,
    opts?: {
        loadId?: string;
        speedMph?: number;
        headingDeg?: number;
        gpsAccuracyM?: number;
    }
) {
    const { data, error } = await supabase.rpc("hc_ingest_convoy_ping", {
        p_operator_id: operatorId,
        p_load_id: opts?.loadId ?? null,
        p_ts: new Date().toISOString(),
        p_lat: lat,
        p_lng: lng,
        p_speed_mph: opts?.speedMph ?? null,
        p_heading_deg: opts?.headingDeg ?? null,
        p_gps_accuracy_m: opts?.gpsAccuracyM ?? null,
    });
    if (error) throw error;
    return data;
}

/**
 * Emergency dispatch: find nearest verified operators
 */
export async function emergencyFindNearest(
    supabase: SupabaseClient,
    lat: number,
    lng: number,
    radiusMiles = 50
) {
    const { data, error } = await supabase.rpc("hc_emergency_find_nearest", {
        p_lat: lat,
        p_lng: lng,
        p_radius_miles: radiusMiles,
    });
    if (error) throw error;
    return data ?? [];
}

/**
 * Rank operators for a load (reputation-gated matching)
 */
export async function rankOperatorsForLoad(
    supabase: SupabaseClient,
    loadId: string,
    limit = 25
) {
    const { data, error } = await supabase.rpc(
        "hc_rank_operators_for_load",
        {
            p_load_id: loadId,
            p_limit: limit,
        }
    );
    if (error) throw error;
    return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────
// RENDER QUEUE
// ─────────────────────────────────────────────────────────────────────

/**
 * Enqueue a proof-of-run render job
 */
export async function enqueueRenderJob(
    supabase: SupabaseClient,
    loadId: string,
    operatorId?: string
) {
    const { data: jobId, error } = await supabase.rpc(
        "hc_enqueue_render_job",
        {
            p_load_id: loadId,
            p_operator_id: operatorId ?? null,
        }
    );
    if (error) throw error;
    return jobId as string;
}
