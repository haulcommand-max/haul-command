import { createClient } from "@supabase/supabase-js";

/**
 * Triggered from Vapi pipeline hooks anytime the AI identifies an urgent scenario
 * requiring administrator intervention (e.g. Escort Panic, Regulatory Authority Call).
 */
export async function push_vapi_alert(message: string, call_id: string, severity: 'high' | 'critical' | 'escalation_required') {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Notify all admins via Realtime + Firebase FCM table 
        // In real Firebase setups, you'd trigger firebase-admin SDK from edge function.
        // We log to notification_events which a trigger or edge-function processes into FCM.

        await supabase.from('notification_events').insert({
            user_id: 'SYSTEM_ADMIN_BROADCAST',
            title: `VAPI Alert: ${severity.toUpperCase()}`,
            body: `${message} [Call ID: ${call_id}]`,
            type: 'vapi_live_escalation',
            metadata: {
                call_id,
                severity
            }
        });

    } catch (e) {
        console.error("Vapi Alert Dispatch Error:", e);
    }
}
