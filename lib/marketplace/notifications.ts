// lib/marketplace/notifications.ts
//
// HAUL COMMAND — CONSOLIDATED Marketplace Notifications
//
// Merged from:
//   - lib/marketplace/notifications.ts (throttled multi-channel: push > in-app > email > sms)
//   - lib/marketplace/booking-notifications.ts (push + Telnyx SMS + in-app records)
//
// This file is now the SINGLE notification layer for all marketplace events:
//   - Offer notifications (with throttling)
//   - Booking confirmations
//   - Job completion notifications
//   - Review requests
//
// Channel priority: push > in-app > email > SMS (Telnyx)
// All channels fire-and-forget — never blocks the calling code.
// ============================================================

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendPushToUser, type PushPayload } from "@/lib/push-send";
import { isEnabled } from "@/lib/feature-flags";

// ── Types ──

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

// ── Helpers ──

type Channel = "push" | "in_app" | "email" | "sms";
const CHANNEL_PRIORITY: Channel[] = ["push", "in_app", "email", "sms"];

/** Send push to multiple users — fire-and-forget */
async function pushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    await Promise.allSettled(
        userIds.map(uid => sendPushToUser(uid, payload).catch(() => { }))
    );
}

// ── Throttling ──

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. OFFER NOTIFICATIONS (throttled, multi-channel)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function sendOfferNotifications(
    notifications: OfferNotification[]
): Promise<NotificationResult[]> {
    const supabase = getSupabaseAdmin();
    const results: NotificationResult[] = [];

    for (const notif of notifications) {
        if (isThrottled(notif.operator_id)) {
            results.push({
                operator_id: notif.operator_id,
                channel: "throttled",
                sent: false,
                error: "Operator throttled (max offers/hour exceeded)",
            });
            continue;
        }

        const payload = {
            title: `New Escort Request: ${notif.origin_city} → ${notif.destination_city}`,
            body: buildOfferBody(notif),
            data: {
                type: "escort_offer",
                offer_id: notif.offer_id,
                request_id: notif.request_id,
                accept_deadline_seconds: notif.accept_deadline_seconds,
            },
        };

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
                    try {
                        const { sendViaSMTP, resolveProvider } = await import("@/lib/email/ses-client");
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
                    } catch {
                        continue;
                    }
                }

                if (channel === "sms") {
                    if (!isEnabled('TELNYX')) continue;
                    try {
                        const { sendSMS } = await import("@/lib/comms/telnyx");
                        const { data: profile } = await supabase
                            .from("profiles").select("phone").eq("id", notif.operator_id).maybeSingle();
                        if (!profile?.phone) continue;
                        await sendSMS({
                            to: profile.phone,
                            from: process.env.TELNYX_FROM_NUMBER || '',
                            text: `Haul Command: New escort job — ${notif.origin_city} → ${notif.destination_city}. ${notif.suggested_rate ? `$${notif.suggested_rate}` : 'Rate TBD'}. Open app to respond.`,
                        });
                        sent = true;
                        usedChannel = "sms";
                        break;
                    } catch {
                        continue;
                    }
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. BULK OFFER PUSH (from booking-notifications — simpler path)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function notifyOffersCreated(params: {
    request_id: string;
    operator_ids: string[];
    rate_offered: number | null;
    currency: string;
    timeout_seconds: number;
    country_code: string;
    load_summary: string;
}): Promise<void> {
    const supabase = getSupabaseAdmin();

    // 1. Push to all operators
    await pushToUsers(params.operator_ids, {
        title: '🚛 New escort job available',
        body: `${params.load_summary} — ${params.rate_offered ? `$${params.rate_offered} ${params.currency}` : 'Rate TBD'} — Respond in ${Math.round(params.timeout_seconds / 60)} min`,
        url: `/offers?request=${params.request_id}`,
        meta: { type: 'offer', request_id: params.request_id },
    });

    // 2. SMS fallback for operators without push tokens
    if (isEnabled('TELNYX')) {
        try {
            const { sendSMS } = await import('@/lib/comms/telnyx');
            const { data: allOps } = await supabase
                .from('profiles').select('id, phone').in('id', params.operator_ids);
            const { data: pushOps } = await supabase
                .from('push_tokens').select('profile_id').in('profile_id', params.operator_ids).eq('enabled', true);
            const pushUserIds = new Set((pushOps ?? []).map((p: any) => p.profile_id));
            const smsTargets = (allOps ?? []).filter((o: any) => !pushUserIds.has(o.id) && o.phone);
            for (const target of smsTargets.slice(0, 10)) {
                await sendSMS({
                    to: target.phone,
                    from: process.env.TELNYX_FROM_NUMBER || '',
                    text: `Haul Command: New escort job — ${params.load_summary}. ${params.rate_offered ? `$${params.rate_offered}` : 'Rate TBD'}. Open app to respond.`,
                }).catch(() => { });
            }
        } catch { /* SMS fallback — don't block */ }
    }

    // 3. In-app inbox records
    const notifInserts = params.operator_ids.map(op_id => ({
        user_id: op_id,
        type: 'offer_sent',
        title: 'New escort job available',
        body: params.load_summary,
        data: { request_id: params.request_id, rate: params.rate_offered, currency: params.currency },
        read: false,
    }));
    await supabase.from('notifications').insert(notifInserts);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. BOOKING CONFIRMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function notifyBookingConfirmed(params: {
    job_id: string;
    broker_id: string;
    escort_ids: string[];
    total_rate: number;
    currency: string;
    payment_intent_id?: string;
}): Promise<void> {
    await sendPushToUser(params.broker_id, {
        title: '✅ Escorts assigned — booking confirmed',
        body: `${params.escort_ids.length} escort(s) confirmed for $${params.total_rate} ${params.currency}`,
        url: `/jobs/${params.job_id}`,
        meta: { type: 'booking_confirmed', job_id: params.job_id },
    }).catch(() => { });

    await pushToUsers(params.escort_ids, {
        title: '🎉 You\'re booked!',
        body: `Job ${params.job_id} confirmed. Check app for details.`,
        url: `/jobs/${params.job_id}`,
        meta: { type: 'booking_assigned', job_id: params.job_id },
    });
}

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. REVIEW REQUESTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function requestReviews(params: {
    job_id: string;
    broker_id: string;
    escort_ids: string[];
}): Promise<void> {
    const supabase = getSupabaseAdmin();

    const reviewInserts: any[] = [];
    for (const escort_id of params.escort_ids) {
        reviewInserts.push({
            job_id: params.job_id,
            reviewer_id: params.broker_id, reviewer_role: 'broker',
            reviewee_id: escort_id, status: 'sent',
            request_sent_at: new Date().toISOString(),
        });
        reviewInserts.push({
            job_id: params.job_id,
            reviewer_id: escort_id, reviewer_role: 'operator',
            reviewee_id: params.broker_id, status: 'sent',
            request_sent_at: new Date().toISOString(),
        });
    }

    await supabase.from('job_reviews').insert(reviewInserts);
    await supabase.from('jobs')
        .update({ review_requested_at: new Date().toISOString() })
        .eq('job_id', params.job_id);

    const allUserIds = [params.broker_id, ...params.escort_ids];
    await pushToUsers(allUserIds, {
        title: '⭐ How did it go?',
        body: 'Leave a review for your recent escort job',
        url: `/reviews?job=${params.job_id}`,
        meta: { type: 'review_request', job_id: params.job_id },
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  5. JOB COMPLETION NOTIFICATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function notifyJobCompleted(params: {
    job_id: string;
    broker_id: string;
    escort_ids: string[];
    payment_captured: boolean;
}): Promise<void> {
    await sendPushToUser(params.broker_id, {
        title: '✅ Job completed',
        body: params.payment_captured
            ? 'Payment has been processed. A review request will follow.'
            : 'Job marked complete. Payment processing.',
        url: `/jobs/${params.job_id}`,
        meta: { type: 'job_completed', job_id: params.job_id },
    }).catch(() => { });

    await pushToUsers(params.escort_ids, {
        title: '💰 Job completed — payout processing',
        body: 'Great work! Your payout is being prepared.',
        url: `/jobs/${params.job_id}`,
        meta: { type: 'job_completed', job_id: params.job_id },
    });
}

// ── Internal Helpers ──

function buildOfferBody(notif: OfferNotification): string {
    const parts: string[] = [];
    parts.push(`📍 ${notif.origin_city} → ${notif.destination_city}`);
    if (notif.load_type_tags.length > 0) parts.push(`🏷️ ${notif.load_type_tags.join(", ")}`);
    if (notif.required_escort_count > 1) parts.push(`🚗 ${notif.required_escort_count} escorts needed`);
    if (notif.suggested_rate != null) parts.push(`💰 ${notif.currency} ${notif.suggested_rate.toFixed(2)}`);
    parts.push(`⏱️ Respond within ${Math.round(notif.accept_deadline_seconds / 60)} min`);
    return parts.join("\n");
}
