/**
 * lib/telemetry.ts
 * Universal telemetry logger — thin wrapper around log_telemetry RPC.
 * Zero-blindness operations: call this on every critical path.
 *
 * Usage:
 *   import { track } from '@/lib/telemetry';
 *   await track('load_posted', { entity_type: 'load', entity_id: loadId, latency_ms: ms });
 */
import { createBrowserClient } from '@supabase/ssr';

export type TelemetryAction =
    | 'user_signup' | 'profile_activation' | 'availability_toggled'
    | 'load_posted' | 'shortlist_generated' | 'offer_sent'
    | 'offer_viewed' | 'offer_accepted' | 'offer_declined'
    | 'assignment_created' | 'checkin_submitted' | 'checkout_submitted'
    | 'push_sent' | 'push_delivered' | 'push_failed'
    | 'search_query' | 'search_result_clicked' | 'search_performed'
    | 'page_view' | 'api_call' | 'api_error' | 'profile_viewed'
    | 'claim_started' | 'claim_completed' | 'corridor_search_volume'
    | 'escort_contacted'
    | 'heartbeat' | 'ad_impression' | 'ad_click'
    // Growth engine events (HCOS-GROWTH-PLAY-01)
    | 'app_install' | 'app_banner_shown' | 'app_banner_clicked'
    | 'saved_search_created' | 'job_alert_sent' | 'job_alert_opened'
    | 'referral_code_shared' | 'referral_signup' | 'referral_activated'
    | 'open_in_app_shown' | 'open_in_app_clicked'
    | 'claim_cta_shown' | 'verification_tier_up'
    | 'subscription_started' | 'subscription_cancelled'
    | 'leaderboard_share_card'
    // Band D: Outcome Engine + Completion + Dominance events
    | 'outcome_timeline_seen' | 'outcome_recorded' | 'completion_state_shown'
    | 'completion_next_step' | 'route_support_seen' | 'support_bundle_clicked'
    | 'workflow_infra_cta' | 'social_proof_seen' | 'outcome_alerts_seen'
    | 'playbook_page_seen' | 'playbook_step_completed'
    | 'partner_application_submitted';

export interface TrackOptions {
    entity_type?: string;
    entity_id?: string;
    latency_ms?: number;
    client?: 'web' | 'mobile' | 'api' | 'edge' | 'system';
    route?: string;
    status_code?: number;
    metadata?: Record<string, unknown>;
}

let _supabase: ReturnType<typeof createBrowserClient> | null = null;

function getClient() {
    if (!_supabase) {
        _supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return _supabase;
}

/**
 * Track a user action. Fire-and-forget — never throws.
 */
export async function track(
    action: TelemetryAction,
    opts: TrackOptions = {}
): Promise<void> {
    try {
        const sb = getClient();
        const { data: { user } } = await sb.auth.getUser();

        await sb.rpc('log_telemetry', {
            p_action: action,
            p_user_id: user?.id ?? null,
            p_role: (user?.user_metadata?.role as string) ?? null,
            p_entity_type: opts.entity_type ?? null,
            p_entity_id: opts.entity_id ?? null,
            p_latency_ms: opts.latency_ms ?? null,
            p_client: opts.client ?? 'web',
            p_route: opts.route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
            p_status_code: opts.status_code ?? null,
            p_metadata: opts.metadata ?? {},
        });

        // Mirror to dedicated business intelligence table
        await sb.from('behavioral_events').insert({
            event_type: action,
            user_id: user?.id ?? null,
            entity_type: opts.entity_type ?? null,
            entity_id: opts.entity_id ?? null,
            client_platform: opts.client ?? 'web',
            route_path: opts.route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
            metadata: opts.metadata ?? {}
        });
    } catch {
        // Telemetry must never break the calling code
    }
}

/**
 * Server-side telemetry — use in API routes and Edge Functions.
 * Requires service role key for unauthenticated server contexts.
 */
export async function trackServer(
    action: TelemetryAction,
    opts: TrackOptions & { user_id?: string; role?: string } = {}
): Promise<void> {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await sb.rpc('log_telemetry', {
            p_action: action,
            p_user_id: opts.user_id ?? null,
            p_role: opts.role ?? null,
            p_entity_type: opts.entity_type ?? null,
            p_entity_id: opts.entity_id ?? null,
            p_latency_ms: opts.latency_ms ?? null,
            p_client: opts.client ?? 'api',
            p_route: opts.route ?? null,
            p_status_code: opts.status_code ?? null,
            p_metadata: opts.metadata ?? {},
        });

        // Mirror to dedicated business intelligence table
        await sb.from('behavioral_events').insert({
            event_type: action,
            user_id: opts.user_id ?? null,
            entity_type: opts.entity_type ?? null,
            entity_id: opts.entity_id ?? null,
            client_platform: opts.client ?? 'api',
            route_path: opts.route ?? null,
            metadata: opts.metadata ?? {}
        });
    } catch {
        // Never throw from telemetry
    }
}

/**
 * Timing helper — wrap any async fn to auto-track latency.
 *
 * const result = await withTiming('shortlist_generated', () => generateShortlist(loadId), { entity_id: loadId });
 */
export async function withTiming<T>(
    action: TelemetryAction,
    fn: () => Promise<T>,
    opts: TrackOptions = {}
): Promise<T> {
    const start = Date.now();
    try {
        const result = await fn();
        await track(action, { ...opts, latency_ms: Date.now() - start, status_code: 200 });
        return result;
    } catch (err) {
        await track(action, { ...opts, latency_ms: Date.now() - start, status_code: 500, metadata: { error: String(err) } });
        throw err;
    }
}
