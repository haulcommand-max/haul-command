/**
 * POST /api/recovery/scan
 * 
 * Scans operator accounts for revenue recovery opportunities.
 * Returns prioritized recovery signals with monetizable hooks.
 * NOW WIRED: Notification brain for auto-outreach via push/email/in-app.
 * Admin-only endpoint.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { scanForRecovery, estimateTotalRecovery, type RecoverySignal } from '@/lib/engines/recovery-revenue';
import { decideNotification, type NotificationPayload } from '@/lib/engines/notification-brain';
import { emitBatch, type NovuEventName, type NovuPayload, type EmitOptions } from '@/lib/novu';


export async function POST(req: NextRequest) {
    // Admin-only
    const auth = req.headers.get('x-admin-secret');
    if (auth !== process.env.ADMIN_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { limit = 100, severity_filter } = await req.json() as {
            limit?: number;
            severity_filter?: string;
        };

        const supabase = getSupabaseAdmin();

        // Fetch operator states for scanning
        const { data: operators, error } = await supabase
            .from('operators')
            .select(`
        id, company_name, phone, email, city, state, country_code,
        trust_score, reputation_score, is_verified, is_dispatch_ready,
        boost_tier, boost_expires_at, profile_completion_pct,
        claim_status, claim_started_at, last_login_at,
        subscription_status, last_payment_failed,
        freshness_score, docs_expiring_30d, docs_expired, missed_lead_unlocks_30d
      `)
            .limit(limit);

        if (error) throw error;

        const allSignals: (RecoverySignal & { company_name: string })[] = [];

        for (const op of operators || []) {
            const lastLoginHours = op.last_login_at
                ? (Date.now() - new Date(op.last_login_at).getTime()) / 3600000
                : 9999;

            const signals = scanForRecovery({
                id: op.id,
                claim_status: op.claim_status || 'unclaimed',
                claim_started_at: op.claim_started_at,
                freshness_score: (op as any).freshness_score ?? 50,
                freshness_previous: ((op as any).freshness_score ?? 50) + 10,
                rank_current: op.reputation_score ?? 50,
                rank_previous: (op.reputation_score ?? 50) - 5,
                docs_expiring_within_30d: (op as any).docs_expiring_30d ?? 0,
                docs_expired: (op as any).docs_expired ?? 0,
                last_login_hours: lastLoginHours,
                profile_completion_pct: op.profile_completion_pct || 30,
                has_active_subscription: op.subscription_status === 'active',
                last_payment_failed: op.last_payment_failed || false,
                boost_expires_at: op.boost_expires_at,
                sponsor_expires_at: undefined,
                missed_lead_unlocks_30d: (op as any).missed_lead_unlocks_30d ?? 0,
            });

            for (const sig of signals) {
                if (!severity_filter || sig.severity === severity_filter) {
                    allSignals.push({ ...sig, company_name: op.company_name });
                }
            }
        }

        // Sort by severity then estimated value
        const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        allSignals.sort((a, b) => {
            const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
            if (sevDiff !== 0) return sevDiff;
            return b.estimated_recovery_value - a.estimated_recovery_value;
        });

        const totalRecoverable = estimateTotalRecovery(allSignals);
        const bySeverity: Record<string, number> = {};
        const byType: Record<string, number> = {};
        for (const sig of allSignals) {
            bySeverity[sig.severity] = (bySeverity[sig.severity] || 0) + 1;
            byType[sig.type] = (byType[sig.type] || 0) + 1;
        }

        // ── Notification Brain Outreach ─────────────────────────────────
        // Route high/critical recovery signals through notification brain
        // for automated re-engagement via push/email/in-app
        const RECOVERY_EVENT_MAP: Record<string, string> = {
            unfinished_claim: 'claim.started',
            expiring_docs: 'doc.expiring',
            stale_freshness: 'freshness.cooling',
            rank_drop: 'rank.dropped',
            failed_payment: 'payment.failed',
            expired_boost: 'boost.expiring',
            dormant_account: 'freshness.cooling',
            missed_lead_unlock: 'lead.credit_low',
            incomplete_profile: 'freshness.cooling',
        };

        const defaultUserState = {
            notifications_sent_24h: { in_app: 0, push: 0, email: 0, sms: 0, webhook: 0 },
            user_preferences: {
                channels_enabled: ['in_app' as const, 'push' as const, 'email' as const],
                quiet_hours_enabled: true,
                timezone_offset_hours: -5,
            },
        };

        const notifyEligible = allSignals.filter(s =>
            s.severity === 'critical' || s.severity === 'high'
        );

        const notifyEvents: Array<{ eventName: NovuEventName; payload: NovuPayload; options: EmitOptions }> = [];
        let brainApproved = 0;
        let brainSuppressed = 0;

        for (const sig of notifyEligible.slice(0, 30)) {
            const eventType = RECOVERY_EVENT_MAP[sig.type] || 'freshness.cooling';
            const decision = decideNotification(
                {
                    event_type: eventType,
                    recipient_id: sig.operator_id,
                    recipient_role: 'operator',
                    priority: sig.severity === 'critical' ? 'critical' : 'high',
                    data: {
                        recovery_type: sig.type,
                        message: sig.message,
                        action_label: sig.action_label,
                        action_url: sig.action_url,
                        revenue_hook: sig.revenue_hook,
                        estimated_value: sig.estimated_recovery_value,
                    },
                },
                defaultUserState,
            );

            if (decision.anti_fatigue_ok && decision.channels.length > 0) {
                brainApproved++;
                notifyEvents.push({
                    eventName: eventType as NovuEventName,
                    payload: {
                        recovery_type: sig.type,
                        operator_id: sig.operator_id,
                        message: sig.message,
                        action_label: sig.action_label,
                        action_url: sig.action_url,
                        revenue_hook: sig.revenue_hook,
                        estimated_value: sig.estimated_recovery_value,
                        channels: decision.channels,
                    },
                    options: { subscriberId: sig.operator_id },
                });
            } else {
                brainSuppressed++;
            }
        }

        // Emit approved recovery notifications
        const emitResults = notifyEvents.length > 0 ? await emitBatch(notifyEvents) : [];
        const notifySent = emitResults.filter(r => r.ok).length;
        const notifyFailed = emitResults.filter(r => !r.ok).length;

        return NextResponse.json({
            ok: true,
            stats: {
                operators_scanned: operators?.length || 0,
                total_signals: allSignals.length,
                total_recoverable_usd: totalRecoverable,
                by_severity: bySeverity,
                by_type: byType,
            },
            recovery_outreach: {
                eligible: notifyEligible.length,
                brain_approved: brainApproved,
                brain_suppressed: brainSuppressed,
                notifications_sent: notifySent,
                notifications_failed: notifyFailed,
            },
            signals: allSignals.slice(0, 50).map(s => ({
                operator_id: s.operator_id,
                company_name: s.company_name,
                type: s.type,
                severity: s.severity,
                message: s.message,
                action_label: s.action_label,
                action_url: s.action_url,
                revenue_hook: s.revenue_hook,
                estimated_value: s.estimated_recovery_value,
            })),
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
