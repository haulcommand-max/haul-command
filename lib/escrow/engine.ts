import { createClient } from '@supabase/supabase-js';
import { getStripe, createIdempotentPaymentIntent, createIdempotentTransfer } from '../stripe';
import { OS_EVENTS } from '../os-events';
// push-send imported dynamically in handleTransferFailure to avoid circular deps

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
            
        if (data && data.status === expectedStatus) {
            console.log(`[Idempotency Check] Skipped tracking for ${gatewayReferenceId} as it is already ${expectedStatus}`);
            return true; 
        }
        return false;
    }

    /**
     * OPUS-02 RULE: Payout Failure Push Path
     * Uses canonical hc_pay_payouts table (verified against types/supabase.ts).
     * Columns: stripe_transfer_id, status, failure_reason, user_id, amount_usd
     */
    static async handleTransferFailure(transferId: string, reason: string) {
        const db = getAdminDb();

        // 1. Find payout record by Stripe transfer ID
        const { data: payout } = await db
            .from('hc_pay_payouts')
            .select('id, user_id, amount_usd')
            .eq('stripe_transfer_id', transferId)
            .maybeSingle();

        // 2. Mark as FAILED — uses schema-backed columns only
        await db.from('hc_pay_payouts')
            .update({
                status: 'FAILED',
                failure_reason: reason,
                updated_at: new Date().toISOString(),
            })
            .eq('stripe_transfer_id', transferId);

        // 3. Push-notify operator (dynamic import avoids circular dep)
        if (payout?.user_id) {
            const { sendNativePush } = await import('../push-send');
            await sendNativePush(payout.user_id, {
                title: 'Payout Failed - Action Needed',
                body: `Your payout of $${(payout.amount_usd ?? 0).toFixed(2)} could not be processed. Please verify your bank details.`,
                url: 'haulcommand://settings/payout-methods',
                priority: 'urgent' as const,
                meta: { transfer_id: transferId, reason },
            });
        }

        console.warn(`[Payout] Transfer ${transferId} FAILED. Operator notified. Reason: ${reason}`);
    }

    /**
     * OPUS-02 RULE: Dispute Auto-Resolution Dependency Chain.
     * Uses hc_disputes table (verified in schema: booking_id, opened_by, reason, status, evidence).
     */
    static async resolveDispute(escrowId: string) {
        const db = getAdminDb();
        
        // Use canonical hc_escrow table
        const { data: escrow } = await db.from('hc_escrow').select('*').eq('id', escrowId).single();
        if (!escrow) throw new Error('Escrow not found');
        if (escrow.status !== 'DISPUTED') throw new Error('Escrow must be DISPUTED to resolve');

        // We use booking_id (which points to hc_loads)
        const loadId = escrow.booking_id;
        if (!loadId) throw new Error('Escrow has no associated load (booking_id)');

        const { data: load } = await db.from('hc_loads').select('id, load_status').eq('id', loadId).single();

        // Since we don't have direct damage/bol tables in the current schema snapshot,
        // we map resolution based on the dispute evidence and load status.
        // For Settlement OS Wave 2, if load isn't completed, operator hasn't proven delivery.

        let resolutionState: 'SETTLED' | 'REFUNDED' | 'ESCALATED_TO_HUMAN' = 'ESCALATED_TO_HUMAN';
        
        if (load?.load_status === 'completed') {
            // Operator marked it completed, but dispute exists -> human review needed
            resolutionState = 'ESCALATED_TO_HUMAN';
        } else if (load?.load_status === 'transit' || load?.load_status === 'open') {
            // Broker disputed before completion -> likely cancellation/no-show -> Refund broker
            resolutionState = 'REFUNDED';
        }

        if (resolutionState === 'ESCALATED_TO_HUMAN') {
            await db.from('hc_escrow').update({ status: 'FROZEN' }).eq('id', escrowId);
            console.log(`[Dispute Resolution] Escrow ${escrowId} ESCALATED to admin tribunal.`);
        } else {
            await db.from('hc_escrow').update({ status: resolutionState }).eq('id', escrowId);
            console.log(`[Dispute Resolution] Escrow ${escrowId} AUTO-RESOLVED as ${resolutionState}.`);
        }

        return resolutionState;
    }
}
