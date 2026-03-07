// lib/marketplace/notifications.ts
//
// Notification layer for the Escort Marketplace.
// Cost-tight: push > in-app > email > SMS (last resort).
// Throttled broadcasts to prevent spam.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { sendPushToUser } from "@/lib/push-send";
import { sendViaSMTP, resolveProvider } from "@/lib/email/ses-client";

export interface OfferNotification {
    operator_id: string;
    offer_id: string;
    request_id: string;
    pickup_window: { start: string; end: string };
    origin_city: string;
    destination_city: string;
    load_type_tags: string[];
    required_escort_count: number;
    suggested_rate: number | null;
    currency: string;
    accept_deadline_seconds: number;
}

export interface NotificationResult {
    operator_id: string;
    channel: string;
    sent: boolean;
    error?: string;
}

// ============================================================
// CHANNEL PRIORITY
// ============================================================

type Channel = "push" | "in_app" | "email" | "sms";

const CHANNEL_PRIORITY: Channel[] = ["push", "in_app", "email", "sms"];

// ============================================================
// THROTTLE (prevent spam)
// ============================================================

// In-memory throttle map (per-process; for prod use Redis or DB)
const throttleMap = new Map<string, { count: number; window_start: number }>();
const THROTTLE_MAX_PER_HOUR = 10;
const THROTTLE_WINDOW_MS = 3600 * 1000;

function isThrottled(operatorId: string): boolean {
    const now = Date.now();
    const entry = throttleMap.get(operatorId);

    if (!entry || now - entry.window_start > THROTTLE_WINDOW_MS) {
        throttleMap.set(operatorId, { count: 1, window_start: now });
        return false;
    }

    if (entry.count >= THROTTLE_MAX_PER_HOUR) return true;

    entry.count++;
    return false;
}

// ============================================================
// SEND NOTIFICATIONS
// ============================================================

export async function sendOfferNotifications(
    notifications: OfferNotification[]
): Promise<NotificationResult[]> {
    const supabase = getSupabaseAdmin();
    const results: NotificationResult[] = [];

    for (const notif of notifications) {
        // Throttle check
        if (isThrottled(notif.operator_id)) {
            results.push({
                operator_id: notif.operator_id,
                channel: "throttled",
                sent: false,
                error: "Operator throttled (max offers/hour exceeded)",
            });
            continue;
        }

        // Build notification payload
        const payload = {
            title: `New Escort Request: ${notif.origin_city} → ${notif.destination_city}`,
            body: buildNotificationBody(notif),
            data: {
                type: "escort_offer",
                offer_id: notif.offer_id,
                request_id: notif.request_id,
                accept_deadline_seconds: notif.accept_deadline_seconds,
            },
        };

        // Try channels in priority order
        let sent = false;
        let usedChannel: Channel = "in_app";

        for (const channel of CHANNEL_PRIORITY) {
            try {
                if (channel === "push") {
                    await sendPushToUser(notif.operator_id, {
                        title: payload.title,
                        body: payload.body,
                        url: `/offers/${notif.offer_id}`,
                        meta: payload.data,
                    });
                    sent = true;
                    usedChannel = "push";
                    break;
                }

                if (channel === "in_app") {
                    // Write to notifications table
                    await supabase.from("notifications").insert({
                        user_id: notif.operator_id,
                        type: "escort_offer",
                        title: payload.title,
                        body: payload.body,
                        data: payload.data,
                        read: false,
                        created_at: new Date().toISOString(),
                    });
                    sent = true;
                    usedChannel = "in_app";
                    break;
                }

                if (channel === "email") {
                    const { data: userData } = await supabase.auth.admin.getUserById(notif.operator_id);
                    const email = userData?.user?.email;
                    if (!email) continue;

                    const provider = await resolveProvider(supabase);
                    const result = await sendViaSMTP({
                        from: "noreply@haulcommand.com",
                        fromName: "Haul Command",
                        replyTo: "support@haulcommand.com",
                        to: email,
                        subject: payload.title,
                        html: `<p>${payload.body.replace(/\n/g, "<br>")}</p>`,
                        text: payload.body,
                        tags: { type: "escort_offer", offer_id: notif.offer_id },
                    }, provider);

                    if (!result.success) throw new Error(result.error ?? "Email send failed");
                    sent = true;
                    usedChannel = "email";
                    break;
                }

                if (channel === "sms") {
                    // SMS is last resort — requires Twilio credentials (TWILIO_ACCOUNT_SID,
                    // TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER). Not yet configured.
                    continue;
                }
            } catch (err: any) {
                console.error(`[Notification] Failed on channel ${channel} for ${notif.operator_id}:`, err.message);
                continue;
            }
        }

        results.push({
            operator_id: notif.operator_id,
            channel: usedChannel,
            sent,
            error: sent ? undefined : "All channels failed",
        });
    }

    return results;
}

// ============================================================
// NOTIFICATION BODY BUILDER
// ============================================================

function buildNotificationBody(notif: OfferNotification): string {
    const parts: string[] = [];

    parts.push(`📍 ${notif.origin_city} → ${notif.destination_city}`);

    if (notif.load_type_tags.length > 0) {
        parts.push(`🏷️ ${notif.load_type_tags.join(", ")}`);
    }

    if (notif.required_escort_count > 1) {
        parts.push(`🚗 ${notif.required_escort_count} escorts needed`);
    }

    if (notif.suggested_rate != null) {
        parts.push(`💰 ${notif.currency} ${notif.suggested_rate.toFixed(2)}`);
    }

    const deadline = Math.round(notif.accept_deadline_seconds / 60);
    parts.push(`⏱️ Respond within ${deadline} min`);

    return parts.join("\n");
}

// ============================================================
// BOOKING CONFIRMATION NOTIFICATIONS
// ============================================================

export async function sendBookingConfirmation(
    jobId: string,
    brokerId: string | null,
    escortIds: string[],
    details: {
        origin_city: string;
        destination_city: string;
        pickup_window: { start: string; end: string };
        agreed_rate_total: number;
        currency: string;
    }
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Notify each assigned escort
    for (const escortId of escortIds) {
        await supabase.from("notifications").insert({
            user_id: escortId,
            type: "booking_confirmed",
            title: `✅ Booking Confirmed: ${details.origin_city} → ${details.destination_city}`,
            body: `Job ${jobId.slice(0, 8)} confirmed. Pickup: ${details.pickup_window.start}. Rate: ${details.currency} ${details.agreed_rate_total.toFixed(2)}.`,
            data: { type: "booking_confirmed", job_id: jobId },
            read: false,
            created_at: new Date().toISOString(),
        });
    }

    // Notify broker if present
    if (brokerId) {
        await supabase.from("notifications").insert({
            user_id: brokerId,
            type: "booking_confirmed",
            title: `✅ Escorts Assigned: ${details.origin_city} → ${details.destination_city}`,
            body: `${escortIds.length} escort(s) confirmed for job ${jobId.slice(0, 8)}. Total: ${details.currency} ${details.agreed_rate_total.toFixed(2)}.`,
            data: { type: "booking_confirmed", job_id: jobId, escort_count: escortIds.length },
            read: false,
            created_at: new Date().toISOString(),
        });
    }
}
