import { createClient } from '@supabase/supabase-js';
import { getStripe, createIdempotentPaymentIntent, createIdempotentTransfer } from '../stripe';
import { OS_EVENTS } from '../os-events';

// Initialize admin client for backend operations
const getAdminDb = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export class EscrowGuardrails {
    /**
     * OPUS-02 RULE: KYC Step-Up Trigger Thresholds
     */
    static async verifyKycTier(userId: string, requiredTier: number) {
        const db = getAdminDb();
        const { data: profile } = await db.from('profiles').select('kyc_tier, stripe_customer_id').eq('id', userId).single();
        
        if (!profile || (profile.kyc_tier || 0) < requiredTier) {
            throw new Error(`KYC_VIOLATION: User must be Tier ${requiredTier} to perform this action. Current: ${profile?.kyc_tier || 0}`);
        }
        
        return profile;
    }

    /**
     * OPUS-02 RULE: Pre-Auth Hard-Stop at Post-a-Load.
     * Enforces that no load goes live until pre-auth clears.
     */
    static async initiateLoadPreAuth(jobId: string, brokerId: string, amount: number) {
        const db = getAdminDb();
        
        // 1. Verify KYC Tier (Rule: MUST be Tier 2+)
        const profile = await this.verifyKycTier(brokerId, 2);
        
        if (!profile.stripe_customer_id) {
            throw new Error('BILLING_VIOLATION: No Stripe customer ID found.');
        }

        // 2. Create Draft Escrow State
        const { data: escrow, error } = await db.from('hc_escrows').insert({
            job_id: jobId,
            payer_id: brokerId,
            amount: amount,
            status: 'PENDING_FUNDS'
        }).select().single();

        if (error || !escrow) throw new Error('Database Failure on Escrow Draft');

        // 3. Initiate Pre-Auth via Idempotent Wrapper (Manual Capture)
        const pi = await createIdempotentPaymentIntent({
            escrowId: escrow.id,
            amount: amount,
            customerId: profile.stripe_customer_id,
            captureMethod: 'manual',
            metadata: { job_id: jobId }
        });

        // 4. Store Gateway Ref
        await db.from('hc_escrows').update({
            gateway_reference_id: pi.id
        }).eq('id', escrow.id);

        return pi;
    }

    /**
     * OPUS-02 RULE: Idempotent Webhook Guardrail.
     * Verifies we haven't already processed this state for this gateway_reference.
     */
    static async checkIdempotency(gatewayReferenceId: string, expectedStatus: string): Promise<boolean> {
        const db = getAdminDb();
        const { data } = await db.from('hc_escrows')
            .select('status')
            .eq('gateway_reference_id', gatewayReferenceId)
            .single();
            
        // If it already matches the expected target status, we consider it handled (idempotent OK).
        // e.g. if we get payment_intent.amount_capturable_updated, we set status = 'FUNDED'.
        // If it's already 'FUNDED', return true (skip).
        if (data && data.status === expectedStatus) {
            console.log(`[Idempotency Check] Skipped tracking for ${gatewayReferenceId} as it is already ${expectedStatus}`);
            return true; 
        }
        return false;
    }

    /**
     * OPUS-02 RULE: Payout Failure Push Path
     */
    static async handleTransferFailure(transferId: string, reason: string) {
        const db = getAdminDb();
        
        // Mark failed
        await db.from('hc_payouts')
            .update({ status: 'FAILED', failure_reason: reason })
            .eq('gateway_reference_id', transferId);
            
        // In a real implementation: Trigger FCM Push & Email via GlobalEventBus
        // GlobalEventBus.emit(OS_EVENTS.PAYOUT_FAILED, { transferId, reason });
        console.warn(`[Payout Failed] Alerting operator for transfer ${transferId}. Reason: ${reason}`);
    }

    /**
     * OPUS-02 RULE: Dispute Auto-Resolution Dependency Chain.
     */
    static async resolveDispute(escrowId: string) {
        const db = getAdminDb();
        
        const { data: escrow } = await db.from('hc_escrows').select('*').eq('id', escrowId).single();
        if (!escrow) throw new Error('Escrow not found');
        if (escrow.status !== 'DISPUTED') throw new Error('Escrow must be DISPUTED to resolve');

        const { data: job } = await db.from('jobs').select('id, damage_claim_amount').eq('id', escrow.job_id).single();
        const { data: bol } = await db.from('hc_documents').select('status').eq('job_id', escrow.job_id).eq('type', 'bol').single();
        const { data: geo } = await db.from('job_milestones').select('gps_verified').eq('job_id', escrow.job_id).single();

        const bolPresent = !!bol;
        const gpsVerified = !!geo?.gps_verified;
        const damageAmount = job?.damage_claim_amount || 0;

        // Auto-resolve logic
        let resolutionState: 'SETTLED' | 'REFUNDED' | 'ESCALATED_TO_HUMAN' = 'ESCALATED_TO_HUMAN';
        
        if (damageAmount > 5000) {
            resolutionState = 'ESCALATED_TO_HUMAN';
        } else if (!bolPresent || !gpsVerified) {
            // Broker wins -> Escrow Refunded
            resolutionState = 'REFUNDED';
        } else if (bolPresent && gpsVerified && damageAmount === 0) {
            // Operator wins -> Escrow Settled
            resolutionState = 'SETTLED';
        }

        if (resolutionState === 'ESCALATED_TO_HUMAN') {
            await db.from('hc_escrows').update({ status: 'FROZEN' }).eq('id', escrowId);
            console.log(`[Dispute Resolution] Escrow ${escrowId} ESCALATED to admin tribunal.`);
            // GlobalEventBus.emit(OS_EVENTS.DISPUTE_ESCALATED, { escrowId });
        } else {
            await db.from('hc_escrows').update({ status: resolutionState }).eq('id', escrowId);
            console.log(`[Dispute Resolution] Escrow ${escrowId} AUTO-RESOLVED as ${resolutionState}.`);
            // GlobalEventBus.emit(OS_EVENTS.DISPUTE_RESOLVED, { escrowId, outcome: resolutionState });
        }

        return resolutionState;
    }
}

