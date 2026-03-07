import { createClient } from "@supabase/supabase-js";

/**
 * Pushes Vapi Interaction Events to the central `behavioral_events`
 * telemetry sink for downstream monetization tracking (e.g. ad conversion, profile interactions)
 */
export async function push_to_behavioral_events(payload: {
    event_type: 'vapi_inbound_call' | 'vapi_outbound_call' | 'vapi_hot_transfer' | 'vapi_voicemail_processed',
    call_id: string,
    country_code: string,
    duration_seconds: number,
    is_qualified?: boolean,
    target_entity_uid?: string, // The broker / user / escort being called
    cost_usd: number
}) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // This assumes `behavioral_events` has flexibility or jsonb payload for custom fields.
        await supabase.from('behavioral_events').insert({
            event_type: payload.event_type,
            user_id: payload.target_entity_uid || null,
            metadata: {
                source: 'vapi_voice_ai',
                call_id: payload.call_id,
                country_code: payload.country_code,
                duration: payload.duration_seconds,
                qualified: !!payload.is_qualified,
                cost: payload.cost_usd
            }
        });

    } catch (e) {
        // Failing to log telemetry shouldn't crash the webhook.
        console.error("Failed to push Vapi interaction to behavioral_events", e);
    }
}
