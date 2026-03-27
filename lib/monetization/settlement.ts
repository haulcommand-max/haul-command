import { createClient } from '@supabase/supabase-js';

// ============================================================================
// ENGINE 3 — SETTLEMENT & TRUST ENGINE
// ============================================================================
// Zero-leak execution of QuickPay factoring sweeps from a delivered load
// to the operator's digital wallet + platform fee rake.

export class SettlementEngine {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }

    /**
     * Broker approves Proof of Delivery (POD) -> Triggers QuickPay Escrow Release
     */
    async processLoadSettlement(jobId: string, factoringProgramId: string) {
        
        // 1. Fetch current status
        const { data: job, error: errFetch } = await this.supabase
            .from('jobs')
            .select('id, settlement_status, agreed_price_cents, broker_id, driver_id')
            .eq('id', jobId)
            .single();

        if (errFetch || !job) throw new Error(`Settlement Invalid: Job ${jobId} not found.`);

        // Anti-leak guard: ensure only verified proofs move to cash
        if (job.settlement_status === 'factored_and_wallet_credited') {
            return { skipped: true, reason: 'already_settled', jobId };
        }
        
        if (job.settlement_status !== 'pod_verified' && job.settlement_status !== 'quickpay_eligible') {
             throw new Error(`Trust Engine Denied: Job ${jobId} is not in a valid POD-verified state (is ${job.settlement_status}).`);
        }

        // 2. Risk Control & Trust Check
        const { data: broker } = await this.supabase.from('score_snapshots').select('score').eq('subject_id', job.broker_id).eq('subject_type','broker').order('created_at', { ascending: false }).limit(1).single();
        if (broker && broker.score < 40) {
             // System overrides instant payout if broker credit logic is too dangerous
             await this.supabase.from('jobs').update({ settlement_status: 'on_hold', manual_review_flag: true }).eq('id', jobId);
             throw new Error(`Trust Engine Hold: Broker trust score is critically low (${broker.score}). Sent to manual review.`);
        }

        // 3. Invoke Atomic RPC Ledger Engine (Built in Migration 20260327150000)
        const { data: ledgerId, error: rpcErr } = await this.supabase.rpc('execute_quickpay_settlement', {
            p_job_id: jobId,
            p_factoring_program_id: factoringProgramId
        });

        if (rpcErr) {
            console.error(`[SettlementEngine] FATAL SETTLEMENT FAILURE for ${jobId}:`, rpcErr);
            throw rpcErr;
        }

        return {
            success: true,
            jobId,
            ledger_entry_id: ledgerId,
            status: 'factored_and_wallet_credited',
            analytics: { event: 'quickpay_funded', job: jobId }
        };
    }
}
