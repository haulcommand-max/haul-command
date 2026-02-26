export type UserRole = "broker" | "escort" | "carrier" | "guest";

export type AnalyticsEvent =
    | { name: "page_view"; role: UserRole; path: string; ref?: string }
    | { name: "listing_view"; role: UserRole; provider_id: string }
    | { name: "compare_opened"; role: UserRole; provider_ids: string[] }
    | { name: "lead_post_started"; role: UserRole }
    | { name: "lead_post_submitted"; role: UserRole; lead_id: string }
    | { name: "match_results_viewed"; role: UserRole; lead_id: string; count: number }
    | { name: "offer_sent"; role: UserRole; lead_id: string; provider_id: string }
    | { name: "offer_accepted"; role: UserRole; lead_id: string; provider_id: string }
    | { name: "booking_confirmed"; role: UserRole; booking_id: string }
    | { name: "payment_hold_created"; role: UserRole; booking_id: string }
    | { name: "payment_released"; role: UserRole; booking_id: string }
    | { name: "verification_upload"; role: UserRole; doc_type: string }
    | { name: "verification_passed"; role: UserRole; badge: string }
    | { name: "hazard_reported"; role: UserRole; hazard_type: string }
    | { name: "tool_used"; role: UserRole; tool: string }
    | { name: "app_install_attributed"; role: UserRole; channel: string };

/**
 * Validates an event object at runtime (if needed) and returns it.
 * acts as a pass-through for now, but can be expanded for heavy validation.
 */
export function assertEvent(e: AnalyticsEvent): AnalyticsEvent {
    return e;
}

/**
 * Helper to log event to Supabase (Mock implementation for Core Package)
 * Real implementation would import the Supabase client.
 */
export async function logEvent(supabase: any, event: AnalyticsEvent, userId?: string) {
    const { error } = await supabase
        .from('analytics_events')
        .insert({
            user_id: userId || null,
            role: event.role,
            name: event.name,
            payload: event // The rest of the object is stored in payload
        });

    if (error) console.error("Analytics Log Error:", error);
}
