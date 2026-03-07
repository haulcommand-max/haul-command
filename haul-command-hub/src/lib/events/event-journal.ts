/**
 * Event Journal v1 — Auth funnel telemetry.
 * Tracks: login views, provider clicks, success/errors.
 * Cost-tight: server console log now, wire to PostHog/Supabase later.
 */

export type EventName =
    | "auth_view_login"
    | "auth_click_provider"
    | "auth_success"
    | "auth_error"
    | "claim_start"
    | "claim_complete"
    | "adgrid_view"
    | "adgrid_click";

export type EventPayload = Record<string, unknown>;

export async function trackEvent(
    name: EventName,
    payload: EventPayload = {}
): Promise<void> {
    try {
        await fetch("/api/events", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, payload, ts: Date.now() }),
        });
    } catch {
        // no-op: cost-tight, never block UX
    }
}
