// ============================================================================
// SYSTEM 1 — HIGH POLE DEFLECTION ALERT
// ============================================================================
// Trigger:  Navixy speed-update webhook
// Logic:    Calculate pole-tip deflection from wind drag (proportional to v²)
// Action:   If deflection > threshold → insert event → call VAPI to alert driver
//
// Physics Model (simplified):
//   Wind force on pole ∝ Cd × A × ρ × v²
//   Deflection ∝ F × L³ / (3 × E × I)
//   We use a simplified coefficient model where:
//     deflection_inches = (speed_mph² × pole_height_ft × drag_coefficient) / stiffness
//   Default threshold: 3 inches of pole-tip movement
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseClient, corsHeaders, validateNavixySignature } from "../_shared/supabase-client.ts";
import type { NavixyLocationUpdate, IntelligenceResponse, DeflectionResult } from "../_shared/types.ts";

// ---------------------------------------------------------------------------
// CONFIGURATION (override via env vars or per-load metadata)
// ---------------------------------------------------------------------------
const DEFAULT_POLE_HEIGHT_FT = 16.0;
const DEFAULT_POLE_STIFFNESS = 1200.0;  // Material stiffness coefficient
const DEFAULT_DRAG_COEFFICIENT = 0.0035; // Calibrated drag factor
const DEFAULT_THRESHOLD_IN = 3.0;        // Alert threshold in inches
const SPEED_FLOOR_MPH = 45;              // Don't bother below this speed
const COOLDOWN_MINUTES = 10;             // Min gap between alerts for same tracker

const VAPI_API_URL = "https://api.vapi.ai/call/phone";
const SYSTEM_NAME = "high-pole-deflection-alert";

// ---------------------------------------------------------------------------
// DEFLECTION CALCULATOR
// ---------------------------------------------------------------------------
function calculateDeflection(
    speedMph: number,
    poleHeightFt: number = DEFAULT_POLE_HEIGHT_FT,
    stiffness: number = DEFAULT_POLE_STIFFNESS,
    dragCoefficient: number = DEFAULT_DRAG_COEFFICIENT
): DeflectionResult {
    // Deflection ∝ speed² × height / stiffness
    const deflectionInches =
        (speedMph * speedMph * poleHeightFt * dragCoefficient) / stiffness;

    let severity: DeflectionResult["severity"] = "info";
    if (deflectionInches >= 6.0) severity = "emergency";
    else if (deflectionInches >= 4.5) severity = "critical";
    else if (deflectionInches >= DEFAULT_THRESHOLD_IN) severity = "warning";

    return {
        deflection_inches: Math.round(deflectionInches * 100) / 100,
        exceeds_threshold: deflectionInches >= DEFAULT_THRESHOLD_IN,
        severity,
        speed_mph: speedMph,
        pole_height_ft: poleHeightFt,
        pole_stiffness: stiffness,
    };
}

// ---------------------------------------------------------------------------
// VAPI VOICE ALERT
// ---------------------------------------------------------------------------
async function triggerVapiAlert(
    phoneNumber: string,
    deflection: DeflectionResult,
    lat: number,
    lng: number
): Promise<string | null> {
    const vapiKey = Deno.env.get("VAPI_API_KEY");
    const assistantId = Deno.env.get("VAPI_SAFETY_SENTINEL_ID");

    if (!vapiKey || !assistantId) {
        console.warn("[VAPI] Missing API key or assistant ID — skipping voice alert");
        return null;
    }

    const message =
        `SAFETY ALERT. Your pole is deflecting ${deflection.deflection_inches} inches ` +
        `at ${deflection.speed_mph} miles per hour. ` +
        (deflection.severity === "emergency"
            ? "STOP IMMEDIATELY and secure the load."
            : deflection.severity === "critical"
                ? "Reduce speed to 45 miles per hour NOW."
                : "Reduce speed below 50 miles per hour.");

    try {
        const res = await fetch(VAPI_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${vapiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                assistantId,
                customer: { number: phoneNumber },
                assistantOverrides: {
                    firstMessage: message,
                    model: {
                        messages: [
                            {
                                role: "system",
                                content:
                                    "You are the Haul Command Safety Sentinel. You just called a driver " +
                                    "because their high pole is deflecting dangerously. Be firm, clear, " +
                                    "and concise. If they acknowledge, tell them to reduce speed and " +
                                    "confirm when they're below 45mph. End the call once confirmed.",
                            },
                        ],
                    },
                },
                metadata: {
                    system: SYSTEM_NAME,
                    deflection_inches: deflection.deflection_inches,
                    severity: deflection.severity,
                    location: { lat, lng },
                },
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`[VAPI] Call failed: ${res.status} — ${err}`);
            return null;
        }

        const data = await res.json();
        console.log(`[VAPI] Call initiated: ${data.id}`);
        return data.id;
    } catch (err) {
        console.error("[VAPI] Request error:", err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// COOLDOWN CHECK — prevent alert fatigue
// ---------------------------------------------------------------------------
async function isInCooldown(trackerId: string): Promise<boolean> {
    const db = getSupabaseClient();
    const cutoff = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000).toISOString();

    const { data } = await db
        .from("pole_deflection_events")
        .select("id")
        .eq("tracker_id", trackerId)
        .eq("alert_sent", true)
        .gte("alert_sent_at", cutoff)
        .limit(1);

    return (data?.length ?? 0) > 0;
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

        // Validate webhook signature (if secret is configured)
        const webhookSecret = Deno.env.get("NAVIXY_WEBHOOK_SECRET");
        if (webhookSecret) {
            const signature = req.headers.get("x-navixy-signature");
            const valid = await validateNavixySignature(bodyText, signature, webhookSecret);
            if (!valid) {
                console.warn("[AUTH] Invalid webhook signature");
                return new Response(JSON.stringify({ error: "Invalid signature" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        const payload: NavixyLocationUpdate = JSON.parse(bodyText);

        // Convert km/h → mph
        const speedMph = payload.speed * 0.621371;

        // Skip if speed is below the floor
        if (speedMph < SPEED_FLOOR_MPH) {
            const response: IntelligenceResponse = {
                success: true,
                system: SYSTEM_NAME,
                alert_sent: false,
                message: `Speed ${speedMph.toFixed(1)} mph below floor (${SPEED_FLOOR_MPH} mph). No action.`,
            };
            return new Response(JSON.stringify(response), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Calculate deflection
        const deflection = calculateDeflection(speedMph);

        const db = getSupabaseClient();

        if (!deflection.exceeds_threshold) {
            // Log but don't alert
            const response: IntelligenceResponse = {
                success: true,
                system: SYSTEM_NAME,
                alert_sent: false,
                message: `Deflection ${deflection.deflection_inches}" within limits. Logged.`,
                data: { deflection },
            };
            return new Response(JSON.stringify(response), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ---- THRESHOLD EXCEEDED ----

        // Check cooldown
        const inCooldown = await isInCooldown(payload.tracker_id);

        // Look up driver phone from trackers/vehicles table (if available)
        const { data: tracker } = await db
            .from("vehicles")
            .select("id, driver_phone")
            .eq("navixy_tracker_id", payload.tracker_id)
            .single();

        let vapiCallSid: string | null = null;

        if (!inCooldown && tracker?.driver_phone) {
            vapiCallSid = await triggerVapiAlert(
                tracker.driver_phone,
                deflection,
                payload.lat,
                payload.lng
            );
        }

        // Insert event record
        const { data: event, error: insertError } = await db
            .from("pole_deflection_events")
            .insert({
                tracker_id: payload.tracker_id,
                vehicle_id: tracker?.id ?? null,
                speed_mph: deflection.speed_mph,
                latitude: payload.lat,
                longitude: payload.lng,
                heading: payload.heading,
                deflection_in: deflection.deflection_inches,
                severity: deflection.severity,
                alert_sent: !!vapiCallSid,
                alert_sent_at: vapiCallSid ? new Date().toISOString() : null,
                vapi_call_sid: vapiCallSid,
                driver_phone: tracker?.driver_phone ?? null,
                event_ts: payload.timestamp,
                raw_payload: payload,
            })
            .select("id")
            .single();

        if (insertError) {
            console.error("[DB] Insert failed:", insertError);
            throw insertError;
        }

        const response: IntelligenceResponse = {
            success: true,
            system: SYSTEM_NAME,
            event_id: event?.id,
            alert_sent: !!vapiCallSid,
            message: inCooldown
                ? `Deflection ${deflection.deflection_inches}" detected. Alert suppressed (cooldown).`
                : `🚨 DEFLECTION ${deflection.deflection_inches}" at ${deflection.speed_mph} mph. ${vapiCallSid ? "Driver alerted via VAPI." : "No driver phone on file."}`,
            data: { deflection, cooldown: inCooldown },
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
