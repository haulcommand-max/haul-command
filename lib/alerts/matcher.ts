// lib/alerts/matcher.ts
//
// Saved Search → Alert Matcher
// Runs via cron or on load_posted trigger.
// Matches saved searches against new loads, then fires push/email.
//
// Spec: HCOS-GROWTH-PLAY-01 / Phase 0 — saved searches + job alerts

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

interface SavedSearch {
    id: string;
    user_id: string;
    search_type: string;
    filters: Record<string, unknown>;
    geo_center_lat: number | null;
    geo_center_lon: number | null;
    radius_km: number | null;
    country_code: string | null;
    admin1_code: string | null;
    alert_enabled: boolean;
    alert_channel: string;
    alert_frequency: string;
    quiet_hours: { start?: string; end?: string; tz?: string } | null;
    last_notified_at: string | null;
    match_count: number;
}

interface MatchResult {
    search_id: string;
    user_id: string;
    matched_entity_ids: string[];
    alert_channel: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const EARTH_RADIUS_KM = 6371;
const DEFAULT_RADIUS_KM = 250;

// Minimum time between alerts per search (prevent spam)
const MIN_ALERT_INTERVAL_MS: Record<string, number> = {
    instant: 15 * 60 * 1000,       // 15 minutes
    daily_digest: 24 * 60 * 60 * 1000,
    weekly_digest: 7 * 24 * 60 * 60 * 1000,
};

// ============================================================
// GEO
// ============================================================

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function isInQuietHours(quietHours: SavedSearch['quiet_hours']): boolean {
    if (!quietHours?.start || !quietHours?.end) return false;

    try {
        const now = new Date();
        const tz = quietHours.tz || 'UTC';
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        const currentMinutes = hour * 60 + minute;

        const [startH, startM] = quietHours.start.split(':').map(Number);
        const [endH, endM] = quietHours.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (startMinutes < endMinutes) {
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        }
        // Crosses midnight
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } catch {
        return false;
    }
}

// ============================================================
// MATCHING
// ============================================================

/**
 * Match saved searches of type 'load' against new load posts.
 * Called by cron or on load_posted webhook.
 */
export async function matchSavedSearchesForLoads(
    loadIds?: string[]
): Promise<MatchResult[]> {
    const supabase = getSupabaseAdmin();
    const results: MatchResult[] = [];

    // 1) Fetch active saved searches for loads
    const { data: searches } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('search_type', 'load')
        .eq('alert_enabled', true);

    if (!searches?.length) return results;

    // 2) Fetch candidate loads (recent or specific IDs)
    let loadsQuery = supabase
        .from('loads')
        .select('id, origin_lat, origin_lon, destination_lat, destination_lon, country_code, admin1_origin, status, created_at')
        .eq('status', 'open');

    if (loadIds?.length) {
        loadsQuery = loadsQuery.in('id', loadIds);
    } else {
        // Default: loads posted in last 2 hours
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        loadsQuery = loadsQuery.gte('created_at', twoHoursAgo);
    }

    const { data: loads } = await loadsQuery;
    if (!loads?.length) return results;

    // 3) Match each search against loads
    const now = Date.now();

    for (const search of searches as SavedSearch[]) {
        // Throttle check
        const minInterval = MIN_ALERT_INTERVAL_MS[search.alert_frequency] || MIN_ALERT_INTERVAL_MS.instant;
        if (search.last_notified_at) {
            const lastNotified = new Date(search.last_notified_at).getTime();
            if (now - lastNotified < minInterval) continue;
        }

        // Quiet hours check
        if (isInQuietHours(search.quiet_hours)) continue;

        const matchedIds: string[] = [];
        const radius = search.radius_km || DEFAULT_RADIUS_KM;

        for (const load of loads) {
            // Country filter
            if (search.country_code && load.country_code !== search.country_code) continue;

            // Admin1 filter
            if (search.admin1_code && load.admin1_origin !== search.admin1_code) continue;

            // Geo proximity (to origin)
            if (search.geo_center_lat && search.geo_center_lon && load.origin_lat && load.origin_lon) {
                const dist = haversineKm(
                    search.geo_center_lat, search.geo_center_lon,
                    load.origin_lat, load.origin_lon
                );
                if (dist > radius) continue;
            }

            // Additional filter matching from search.filters
            // This is extensible — add equipment, load type, etc.
            const filters = search.filters as Record<string, unknown>;
            // (Add more filter logic here as filter types are defined)

            matchedIds.push(load.id);
        }

        if (matchedIds.length > 0) {
            results.push({
                search_id: search.id,
                user_id: search.user_id,
                matched_entity_ids: matchedIds,
                alert_channel: search.alert_channel,
            });

            // Update match tracking
            await supabase
                .from('saved_searches')
                .update({
                    last_matched_at: new Date().toISOString(),
                    match_count: search.match_count + matchedIds.length,
                })
                .eq('id', search.id);
        }
    }

    return results;
}

/**
 * Dispatch alerts for matched searches.
 * This fires push notifications and/or emails.
 */
export async function dispatchAlerts(matches: MatchResult[]): Promise<{ sent: number; failed: number }> {
    const supabase = getSupabaseAdmin();
    let sent = 0;
    let failed = 0;

    for (const match of matches) {
        try {
            const count = match.matched_entity_ids.length;
            const label = count === 1 ? '1 new load matches your search' : `${count} new loads match your search`;

            if (match.alert_channel === 'push' || match.alert_channel === 'both') {
                // Queue push notification
                await supabase.from('hc_notification_log').insert({
                    user_id: match.user_id,
                    channel: 'push',
                    notification_type: 'job_alert',
                    title: '🚛 New Load Alert',
                    body: label,
                    data: {
                        search_id: match.search_id,
                        entity_ids: match.matched_entity_ids.slice(0, 5), // cap payload
                        deep_link: `haulcommand://load/${match.matched_entity_ids[0]}`,
                    },
                    status: 'queued',
                });
            }

            if (match.alert_channel === 'email' || match.alert_channel === 'both') {
                // Queue email
                await supabase.from('hc_notification_log').insert({
                    user_id: match.user_id,
                    channel: 'email',
                    notification_type: 'job_alert',
                    title: `${count} New Load${count === 1 ? '' : 's'} Matching Your Saved Search`,
                    body: label,
                    data: {
                        search_id: match.search_id,
                        entity_ids: match.matched_entity_ids,
                    },
                    status: 'queued',
                });
            }

            // Mark search as notified
            await supabase
                .from('saved_searches')
                .update({ last_notified_at: new Date().toISOString() })
                .eq('id', match.search_id);

            sent++;
        } catch {
            failed++;
        }
    }

    return { sent, failed };
}

/**
 * Full pipeline: match + dispatch. Call this from cron.
 */
export async function runAlertPipeline(loadIds?: string[]): Promise<{
    searches_checked: number;
    matches_found: number;
    alerts_sent: number;
    alerts_failed: number;
}> {
    const matches = await matchSavedSearchesForLoads(loadIds);
    const { sent, failed } = await dispatchAlerts(matches);

    return {
        searches_checked: matches.length,
        matches_found: matches.reduce((sum, m) => sum + m.matched_entity_ids.length, 0),
        alerts_sent: sent,
        alerts_failed: failed,
    };
}
