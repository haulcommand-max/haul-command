/**
 * POST /api/recovery/scan
 * 
 * Scans operator accounts for revenue recovery opportunities.
 * Returns prioritized recovery signals with monetizable hooks.
 * Admin-only endpoint.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { scanForRecovery, estimateTotalRecovery, type RecoverySignal } from '@/lib/engines/recovery-revenue';


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

        return NextResponse.json({
            ok: true,
            stats: {
                operators_scanned: operators?.length || 0,
                total_signals: allSignals.length,
                total_recoverable_usd: totalRecoverable,
                by_severity: bySeverity,
                by_type: byType,
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
