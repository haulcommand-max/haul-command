// ============================================================================
// SYSTEM 2 — EVIDENCE VAULT
// ============================================================================
// Trigger:  Navixy harsh-event webhook (braking, acceleration, collision)
// Logic:    Fetch dashcam video + speed log from Navixy API
//           Assemble into a legal-grade evidence packet
// Action:   Store artifacts → Generate PDF → Email to ops team
//
// This is the "liability shield" — when a shipper's cargo gets damaged and
// they try to blame your driver, this system proves what actually happened.
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseClient, corsHeaders, validateNavixySignature } from "../_shared/supabase-client.ts";
import type { NavixyHarshEvent, IntelligenceResponse, EvidenceArtifact } from "../_shared/types.ts";

const SYSTEM_NAME = "evidence-vault";
const NAVIXY_API_BASE = "https://api.navixy.com/v2";

// Severity tiers — higher G-force = more urgency
const G_FORCE_THRESHOLDS = {
    minor: 0.3,    // Log only
    moderate: 0.5, // Collect evidence
    severe: 0.8,   // Priority collection + immediate notification
    critical: 1.2, // Full packet + escalation
};

// ---------------------------------------------------------------------------
// NAVIXY API — Fetch video clip around the event
// ---------------------------------------------------------------------------
async function fetchEventVideo(
    trackerId: string,
    eventTimestamp: string
): Promise<{ url: string; start: string; end: string } | null> {
    const apiKey = Deno.env.get("NAVIXY_API_KEY");
    if (!apiKey) {
        console.warn("[NAVIXY] No API key — cannot fetch video");
        return null;
    }

    try {
        // Request a 60-second clip: 30s before + 30s after the event
        const eventTime = new Date(eventTimestamp);
        const start = new Date(eventTime.getTime() - 30_000).toISOString();
        const end = new Date(eventTime.getTime() + 30_000).toISOString();

        const res = await fetch(`${NAVIXY_API_BASE}/tracker/video/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                hash: apiKey,
                tracker_id: trackerId,
                from: start,
                to: end,
            }),
        });

        if (!res.ok) {
            console.warn(`[NAVIXY] Video request failed: ${res.status}`);
            return null;
        }

        const data = await res.json();
        if (data.success && data.value?.url) {
            return { url: data.value.url, start, end };
        }

        console.warn("[NAVIXY] No video available for this time window");
        return null;
    } catch (err) {
        console.error("[NAVIXY] Video fetch error:", err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// NAVIXY API — Fetch speed/telemetry log around the event
// ---------------------------------------------------------------------------
async function fetchSpeedLog(
    trackerId: string,
    eventTimestamp: string
): Promise<string | null> {
    const apiKey = Deno.env.get("NAVIXY_API_KEY");
    if (!apiKey) return null;

    try {
        const eventTime = new Date(eventTimestamp);
        const start = new Date(eventTime.getTime() - 120_000).toISOString(); // 2 min before
        const end = new Date(eventTime.getTime() + 60_000).toISOString();    // 1 min after

        const res = await fetch(`${NAVIXY_API_BASE}/tracker/readings/list`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                hash: apiKey,
                tracker_id: trackerId,
                from: start,
                to: end,
            }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        if (data.success && data.list?.length > 0) {
            // Store the raw speed log as a JSON artifact
            const db = getSupabaseClient();
            const filename = `speed-log-${trackerId}-${Date.now()}.json`;
            const { data: upload } = await db.storage
                .from("evidence-vault")
                .upload(filename, JSON.stringify(data.list), {
                    contentType: "application/json",
                });

            if (upload?.path) {
                const { data: urlData } = db.storage
                    .from("evidence-vault")
                    .getPublicUrl(upload.path);
                return urlData.publicUrl;
            }
        }

        return null;
    } catch (err) {
        console.error("[NAVIXY] Speed log fetch error:", err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// DETERMINE SEVERITY from G-force
// ---------------------------------------------------------------------------
function classifyGForce(gForce: number | undefined): {
    tier: string;
    shouldCollect: boolean;
    shouldEscalate: boolean;
} {
    const g = gForce ?? 0;
    if (g >= G_FORCE_THRESHOLDS.critical) {
        return { tier: "critical", shouldCollect: true, shouldEscalate: true };
    }
    if (g >= G_FORCE_THRESHOLDS.severe) {
        return { tier: "severe", shouldCollect: true, shouldEscalate: true };
    }
    if (g >= G_FORCE_THRESHOLDS.moderate) {
        return { tier: "moderate", shouldCollect: true, shouldEscalate: false };
    }
    return { tier: "minor", shouldCollect: false, shouldEscalate: false };
}

// ---------------------------------------------------------------------------
// NOTIFICATION — Send ops alert via email/webhook
// ---------------------------------------------------------------------------
async function notifyOpsTeam(
    eventType: string,
    severity: string,
    eventId: string,
    trackerLabel: string | undefined
): Promise<void> {
    const webhookUrl = Deno.env.get("OPS_NOTIFICATION_WEBHOOK");
    if (!webhookUrl) {
        console.warn("[NOTIFY] No ops webhook configured — skipping notification");
        return;
    }

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system: SYSTEM_NAME,
                event_type: eventType,
                severity,
                event_id: eventId,
                tracker_label: trackerLabel ?? "Unknown Vehicle",
                message: `🛡️ Evidence Vault: ${severity.toUpperCase()} ${eventType} detected. Packet being assembled.`,
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (err) {
        console.error("[NOTIFY] Failed to send ops notification:", err);
    }
}

// ---------------------------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        const bodyText = await req.text();

        // Validate webhook signature
        const webhookSecret = Deno.env.get("NAVIXY_WEBHOOK_SECRET");
        if (webhookSecret) {
            const signature = req.headers.get("x-navixy-signature");
            const valid = await validateNavixySignature(bodyText, signature, webhookSecret);
            if (!valid) {
                return new Response(JSON.stringify({ error: "Invalid signature" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        const payload: NavixyHarshEvent = JSON.parse(bodyText);

        // Classify severity
        const classification = classifyGForce(payload.g_force);

        if (!classification.shouldCollect) {
            // Minor event — log to DB but don't assemble a full packet
            const db = getSupabaseClient();
            await db.from("evidence_packets").insert({
                tracker_id: payload.tracker_id,
                event_type: payload.event_type,
                navixy_event_id: payload.event_id,
                speed_mph: payload.speed * 0.621371,
                latitude: payload.lat,
                longitude: payload.lng,
                heading: payload.heading,
                g_force: payload.g_force,
                status: "archived",     // Minor events are auto-archived
                event_ts: payload.timestamp,
                raw_payload: payload,
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    system: SYSTEM_NAME,
                    alert_sent: false,
                    message: `Minor ${payload.event_type} (G: ${payload.g_force ?? "N/A"}). Logged, no packet needed.`,
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // ---- MODERATE / SEVERE / CRITICAL — Assemble evidence packet ----
        console.log(`[${SYSTEM_NAME}] ${classification.tier} ${payload.event_type} detected. Collecting evidence...`);

        // 1. Create the packet record (status: collecting)
        const db = getSupabaseClient();

        // Look up vehicle
        const { data: tracker } = await db
            .from("vehicles")
            .select("id")
            .eq("navixy_tracker_id", payload.tracker_id)
            .single();

        const { data: packet, error: insertError } = await db
            .from("evidence_packets")
            .insert({
                tracker_id: payload.tracker_id,
                vehicle_id: tracker?.id ?? null,
                event_type: payload.event_type,
                navixy_event_id: payload.event_id,
                speed_mph: payload.speed * 0.621371,
                latitude: payload.lat,
                longitude: payload.lng,
                heading: payload.heading,
                g_force: payload.g_force,
                status: "collecting",
                event_ts: payload.timestamp,
                raw_payload: payload,
            })
            .select("id")
            .single();

        if (insertError || !packet) {
            throw insertError ?? new Error("Failed to create evidence packet");
        }

        // 2. Fetch video (async — don't block response)
        const artifacts: EvidenceArtifact[] = [];

        const [videoResult, speedLogUrl] = await Promise.all([
            fetchEventVideo(payload.tracker_id, payload.timestamp),
            fetchSpeedLog(payload.tracker_id, payload.timestamp),
        ]);

        const updatePayload: Record<string, unknown> = {
            status: "assembling",
        };

        if (videoResult) {
            updatePayload.video_url = videoResult.url;
            updatePayload.video_start_ts = videoResult.start;
            updatePayload.video_end_ts = videoResult.end;
            artifacts.push({
                type: "video",
                url: videoResult.url,
                captured_at: payload.timestamp,
            });
        }

        if (speedLogUrl) {
            updatePayload.speed_log_url = speedLogUrl;
            artifacts.push({
                type: "speed_log",
                url: speedLogUrl,
                captured_at: payload.timestamp,
            });
        }

        // 3. Update the packet with collected artifacts
        await db
            .from("evidence_packets")
            .update(updatePayload)
            .eq("id", packet.id);

        // 4. Notify ops team if severe/critical
        if (classification.shouldEscalate) {
            await notifyOpsTeam(
                payload.event_type,
                classification.tier,
                packet.id,
                payload.tracker_label
            );
        }

        const response: IntelligenceResponse = {
            success: true,
            system: SYSTEM_NAME,
            event_id: packet.id,
            alert_sent: classification.shouldEscalate,
            message:
                `🛡️ Evidence packet ${packet.id} created (${classification.tier}). ` +
                `Artifacts: ${artifacts.length} collected. ` +
                `${classification.shouldEscalate ? "Ops team notified." : ""}`,
            data: {
                classification,
                artifacts_collected: artifacts.length,
                video_available: !!videoResult,
                speed_log_available: !!speedLogUrl,
            },
        };

        console.log(`[${SYSTEM_NAME}] ${response.message}`);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(`[${SYSTEM_NAME}] Error:`, err);
        return new Response(
            JSON.stringify({
                success: false,
                system: SYSTEM_NAME,
                message: `Internal error: ${(err as Error).message}`,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
