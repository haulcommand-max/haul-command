import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { emitBatch, NOVU_EVENT_NAMES, type NovuEventName, type NovuPayload, type EmitOptions } from '@/lib/novu';
import {
    decideNotification,
    NOVU_WORKFLOWS,
    type NotificationPayload,
    type NotificationDecision,
} from '@/lib/engines/notification-brain';

/**
 * GET /api/cron/notifications
 * 
 * Periodic scanner that checks all monetization tables for
 * expiring/renewal/digest notification triggers.
 * 
 * Runs via Vercel Cron or external scheduler.
 * Backend-only, service-role.
 * 
 * NOW WIRED: notification-brain decideNotification() for channel
 * routing, quiet hours, anti-fatigue rate limiting.
 * 
 * @status wired — notification brain connected
 */

export async function GET(req: NextRequest) {
    // ── Auth Check ────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET;
    if (authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sb = getSupabaseAdmin();
    const now = new Date();
    const events: Array<{ eventName: NovuEventName; payload: NovuPayload; options: EmitOptions }> = [];
    const scanLog: Array<{ scan: string; found: number }> = [];

    // ─────────────────────────────────────────────────────────────────────
    // 1. BOOSTS EXPIRING (within 3 days)
    // ─────────────────────────────────────────────────────────────────────
    try {
        const threeDaysOut = new Date(now.getTime() + 3 * 86400000).toISOString();
        const { data: expiringBoosts } = await sb
            .from('profile_boosts')
            .select('id, operator_id, boost_type, expires_at')
            .lte('expires_at', threeDaysOut)
            .gte('expires_at', now.toISOString())
            .limit(50);

        if (expiringBoosts?.length) {
            for (const boost of expiringBoosts) {
                const daysUntil = Math.ceil((new Date(boost.expires_at).getTime() - now.getTime()) / 86400000);
                events.push({
                    eventName: NOVU_EVENT_NAMES.BOOST_EXPIRING,
                    payload: {
                        boost_id: boost.id,
                        operator_id: boost.operator_id,
                        boost_type: boost.boost_type || 'standard',
                        expires_at: boost.expires_at,
                        days_until_expiry: daysUntil,
                    },
                    options: { subscriberId: boost.operator_id },
                });
            }
        }
        scanLog.push({ scan: 'boosts_expiring', found: expiringBoosts?.length || 0 });
    } catch (err) {
        scanLog.push({ scan: 'boosts_expiring', found: -1 });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. SPONSORSHIPS EXPIRING (within 7 days)
    // ─────────────────────────────────────────────────────────────────────
    try {
        const sevenDaysOut = new Date(now.getTime() + 7 * 86400000).toISOString();
        const { data: expSponsorships } = await sb
            .from('territory_sponsorships')
            .select('id, sponsor_id, territory_name, expires_at')
            .lte('expires_at', sevenDaysOut)
            .gte('expires_at', now.toISOString())
            .limit(50);

        if (expSponsorships?.length) {
            for (const sp of expSponsorships) {
                const daysUntil = Math.ceil((new Date(sp.expires_at).getTime() - now.getTime()) / 86400000);
                events.push({
                    eventName: NOVU_EVENT_NAMES.SPONSORSHIP_EXPIRING,
                    payload: {
                        sponsorship_id: sp.id,
                        sponsor_id: sp.sponsor_id || '',
                        territory_name: sp.territory_name || '',
                        expires_at: sp.expires_at,
                        days_until_expiry: daysUntil,
                    },
                    options: { subscriberId: sp.sponsor_id || sp.id },
                });
            }
        }
        scanLog.push({ scan: 'sponsorships_expiring', found: expSponsorships?.length || 0 });
    } catch (err) {
        scanLog.push({ scan: 'sponsorships_expiring', found: -1 });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. CREDENTIALS EXPIRING (within 30 days)
    // ─────────────────────────────────────────────────────────────────────
    try {
        const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000).toISOString();
        const { data: expCredentials } = await sb
            .from('credential_verifications')
            .select('id, operator_id, credential_type, valid_until')
            .lte('valid_until', thirtyDaysOut)
            .gte('valid_until', now.toISOString())
            .limit(100);

        if (expCredentials?.length) {
            for (const cred of expCredentials) {
                const daysUntil = Math.ceil((new Date(cred.valid_until).getTime() - now.getTime()) / 86400000);
                events.push({
                    eventName: NOVU_EVENT_NAMES.CREDENTIAL_EXPIRING,
                    payload: {
                        verification_id: cred.id,
                        operator_id: cred.operator_id || '',
                        credential_type: cred.credential_type || '',
                        expiry_date: cred.valid_until,
                        days_until_expiry: daysUntil,
                    },
                    options: { subscriberId: cred.operator_id || cred.id },
                });
            }
        }
        scanLog.push({ scan: 'credentials_expiring', found: expCredentials?.length || 0 });
    } catch (err) {
        scanLog.push({ scan: 'credentials_expiring', found: -1 });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. TRAINING RENEWALS DUE (within 14 days)
    // ─────────────────────────────────────────────────────────────────────
    try {
        const fourteenDaysOut = new Date(now.getTime() + 14 * 86400000).toISOString();
        const { data: renewals } = await sb
            .from('training_enrollments')
            .select('id, user_id, course_id, course_name, valid_until')
            .lte('valid_until', fourteenDaysOut)
            .gte('valid_until', now.toISOString())
            .limit(100);

        if (renewals?.length) {
            for (const r of renewals) {
                const daysUntil = Math.ceil((new Date(r.valid_until).getTime() - now.getTime()) / 86400000);
                events.push({
                    eventName: NOVU_EVENT_NAMES.TRAINING_RENEWAL_DUE,
                    payload: {
                        enrollment_id: r.id,
                        user_id: r.user_id || '',
                        course_name: r.course_name || r.course_id || '',
                        expiry_date: r.valid_until,
                        days_until_expiry: daysUntil,
                    },
                    options: { subscriberId: r.user_id || r.id },
                });
            }
        }
        scanLog.push({ scan: 'training_renewals', found: renewals?.length || 0 });
    } catch (err) {
        scanLog.push({ scan: 'training_renewals', found: -1 });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. LOW CREDIT BALANCES (< 3 credits)
    // ─────────────────────────────────────────────────────────────────────
    try {
        const { data: lowCredits } = await sb
            .from('lead_credit_balances')
            .select('id, user_id, credits_remaining, credits_used_total')
            .lt('credits_remaining', 3)
            .gt('credits_remaining', 0) // Don't alert at zero — that's a different flow
            .limit(50);

        if (lowCredits?.length) {
            for (const lc of lowCredits) {
                events.push({
                    eventName: NOVU_EVENT_NAMES.LEAD_CREDIT_LOW,
                    payload: {
                        user_id: lc.user_id,
                        credits_remaining: lc.credits_remaining,
                        credits_used_total: lc.credits_used_total,
                        threshold: 3,
                    },
                    options: { subscriberId: lc.user_id },
                });
            }
        }
        scanLog.push({ scan: 'low_credits', found: lowCredits?.length || 0 });
    } catch (err) {
        scanLog.push({ scan: 'low_credits', found: -1 });
    }

    // ─────────────────────────────────────────────────────────────────────
    // NOTIFICATION BRAIN FILTER — channel routing, quiet hours, anti-fatigue
    // ─────────────────────────────────────────────────────────────────────
    const defaultUserState = {
        notifications_sent_24h: { in_app: 0, push: 0, email: 0, sms: 0, webhook: 0 },
        user_preferences: {
            channels_enabled: ['in_app' as const, 'push' as const, 'email' as const, 'sms' as const],
            quiet_hours_enabled: true,
            timezone_offset_hours: -5, // EST default, would be user-specific in production
        },
    };

    let brainFiltered = 0;
    let brainSuppressed = 0;
    const filteredEvents = events.filter(evt => {
        const decision = decideNotification(
            {
                event_type: evt.eventName,
                recipient_id: evt.options.subscriberId,
                recipient_role: 'operator',
                priority: 'medium',
                data: evt.payload as Record<string, unknown>,
            },
            defaultUserState,
        );
        if (!decision.anti_fatigue_ok || decision.channels.length === 0) {
            brainSuppressed++;
            return false;
        }
        brainFiltered++;
        return true;
    });

    // ─────────────────────────────────────────────────────────────────────
    // EMIT BRAIN-APPROVED EVENTS
    // ─────────────────────────────────────────────────────────────────────
    const results = filteredEvents.length > 0 ? await emitBatch(filteredEvents) : [];
    const sent = results.filter(r => r.ok && !r.error).length;
    const deduped = results.filter(r => r.error?.includes('Deduplicated')).length;
    const failed = results.filter(r => !r.ok).length;

    return NextResponse.json({
        ok: true,
        scanned_at: now.toISOString(),
        scan_results: scanLog,
        events_found: events.length,
        brain_approved: brainFiltered,
        brain_suppressed: brainSuppressed,
        events_sent: sent,
        events_deduped: deduped,
        events_failed: failed,
    });
}
