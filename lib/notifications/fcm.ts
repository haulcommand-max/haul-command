/**
 * FCM Push Notification Engine — Haul Command
 *
 * Core send functions + automatic invalid token cleanup.
 * Used by dispatch engine, availability system, QuickPay, and load alerts.
 */

import { getAdminMessaging } from '@/lib/firebase/admin';
import { supabaseServer } from '@/lib/supabase/server';

// ── Notification Types ──

export type NotificationType =
    | 'dispatch_wave'
    | 'hold_request'
    | 'hold_accepted'
    | 'hold_declined'
    | 'quickpay_deposit'
    | 'load_grade_a'
    | 'triroute_match'
    | 'vapi_claim_resolved';

export interface SendNotificationOptions {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}

// ── Core Send Function ──

/**
 * Send a push notification to all active devices for a user.
 * Handles invalid token cleanup automatically.
 */
export async function sendNotification(opts: SendNotificationOptions): Promise<{
    sent: number;
    failed: number;
    tokensDeactivated: number;
}> {
    const supabase = supabaseServer();
    const messaging = getAdminMessaging();

    // Fetch all active tokens for this user
    const { data: tokenRows } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', opts.userId)
        .eq('is_active', true);

    if (!tokenRows || tokenRows.length === 0) {
        return { sent: 0, failed: 0, tokensDeactivated: 0 };
    }

    const tokens = tokenRows.map((r: any) => r.token);

    const message: any = {
        tokens,
        notification: {
            title: opts.title,
            body: opts.body,
            ...(opts.imageUrl && { imageUrl: opts.imageUrl }),
        },
        data: {
            type: opts.type,
            ...(opts.data ?? {}),
        },
        android: {
            priority: 'high' as const,
            notification: { sound: 'default' },
        },
        apns: {
            payload: { aps: { sound: 'default', badge: 1 } },
        },
        webpush: {
            headers: { Urgency: 'high' },
            notification: { icon: '/icons/icon-192.png' },
        },
    };

    const response = await messaging.sendEachForMulticast(message);

    // Deactivate invalid / unregistered tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
            const code = resp.error?.code;
            if (
                code === 'messaging/invalid-registration-token' ||
                code === 'messaging/registration-token-not-registered'
            ) {
                invalidTokens.push(tokens[idx]);
            }
        }
    });

    if (invalidTokens.length > 0) {
        await supabase
            .from('push_tokens')
            .update({ is_active: false })
            .in('token', invalidTokens)
            .eq('user_id', opts.userId);
    }

    // Audit log
    // Audit log
    const sentCount = response.responses.filter((r: any) => r.success).length;
    const failedCount = response.responses.filter((r: any) => !r.success).length;

    await supabase.from('push_log').insert({
        user_id: opts.userId,
        notification_type: opts.type,
        title: opts.title,
        body: opts.body,
        data: opts.data ?? {},
        fcm_message_id: response.responses.find((r: any) => r.success)?.messageId ?? null,
        status: sentCount > 0 ? 'sent' : 'failed',
        error_message: failedCount > 0
            ? response.responses.find((r: any) => !r.success)?.error?.message ?? null
            : null,
    });

    return {
        sent: sentCount,
        failed: failedCount,
        tokensDeactivated: invalidTokens.length,
    };
}

// ── Bulk Send ──

/**
 * Send the same notification to multiple users at once.
 * Used by the dispatch engine for wave notifications.
 */
export async function sendBulkNotification(
    userIds: string[],
    opts: Omit<SendNotificationOptions, 'userId'>,
): Promise<{ total: number; sentToUsers: number; errors: number }> {
    const results = await Promise.allSettled(
        userIds.map((uid) => sendNotification({ ...opts, userId: uid })),
    );

    let sentToUsers = 0;
    let errors = 0;

    for (const r of results) {
        if (r.status === 'fulfilled' && r.value.sent > 0) sentToUsers++;
        else errors++;
    }

    return { total: userIds.length, sentToUsers, errors };
}

// ── Conditional Send (safe for missing Firebase config) ──

/**
 * Wrapper that silently no-ops if Firebase is not configured.
 * Use this in places where FCM is optional (e.g., dev environments).
 */
export async function trySendNotification(opts: SendNotificationOptions): Promise<void> {
    if (!process.env.FIREBASE_PROJECT_ID) {
        console.log(`[FCM:skip] ${opts.type} → ${opts.userId} (Firebase not configured)`);
        return;
    }
    try {
        await sendNotification(opts);
    } catch (err) {
        console.error(`[FCM:error] ${opts.type} → ${opts.userId}:`, err);
    }
}

export async function trySendBulkNotification(
    userIds: string[],
    opts: Omit<SendNotificationOptions, 'userId'>,
): Promise<void> {
    if (!process.env.FIREBASE_PROJECT_ID) {
        console.log(`[FCM:skip] bulk ${opts.type} → ${userIds.length} users (Firebase not configured)`);
        return;
    }
    try {
        await sendBulkNotification(userIds, opts);
    } catch (err) {
        console.error(`[FCM:error] bulk ${opts.type}:`, err);
    }
}

// ── Notification Templates ──

export interface DispatchWaveTemplateProps {
    origin: string;
    destination: string;
    waveNumber: number;
    loadType: string;
    requestId: string;
}

/**
 * Generates the FCM payload for a dispatch wave match
 */
export function dispatchWaveTemplate(props: DispatchWaveTemplateProps): Omit<SendNotificationOptions, 'userId'> {
    return {
        type: 'dispatch_wave',
        title: `⚡ URGENT: Wave ${props.waveNumber} Load Match`,
        body: `${props.loadType}: ${props.origin} → ${props.destination}`,
        data: {
            dispatch_id: props.requestId,
            screen: '/dispatch',
        },
    };
}

