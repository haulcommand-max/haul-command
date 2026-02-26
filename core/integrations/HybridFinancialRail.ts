import { UIBSignal } from '../intelligence/IntelligenceBus';

/**
 * Hybrid Financial Connector
 * 
 * Purpose: Manages the transition from Stripe (Phase 1) to Rapid! PayCard (Phase 2).
 * Phase 1: Stripe for everything.
 * Phase 2: Stripe Ingress -> Rapid! Egress.
 */
export class FinancialRail {
    private stripeKey: string;
    private rapidKey: string;
    private mode: 'PHASE_1' | 'PHASE_2' = 'PHASE_1'; // Configurable via ENV

    constructor() {
        this.stripeKey = process.env.STRIPE_SECRET_KEY || '';
        this.rapidKey = process.env.RAPID_API_KEY || '';

        // Auto-detect phase based on keys
        if (this.stripeKey && this.rapidKey) {
            this.mode = 'PHASE_2';
        }
    }

    /**
     * Process a payment from a Carrier (Ingress)
     */
    async chargeCustomer(customerId: string, amount: number): Promise<boolean> {
        console.log(`[Finance] Charging ${customerId} $${amount} via Stripe...`);
        // Mock Stripe Charge
        return true;
    }

    /**
     * Payout to a Provider (Egress)
     */
    async payoutProvider(providerId: string, amount: number): Promise<boolean> {
        if (this.mode === 'PHASE_1') {
            console.log(`[Finance: Phase 1] Queuing Stripe Connect Payout to ${providerId}`);
            return true;
        } else {
            console.log(`[Finance: Phase 2] Instant Rapid! Transfer to ${providerId}`);
            // Mock Rapid! Transfer
            return true;
        }
    }

    /**
     * Handles FIN-S Signals
     */
    async handleSignal(signal: UIBSignal) {
        if (signal.type === 'FIN-S') {
            const { action, amount, partyId } = signal.payload;

            if (action === 'CHARGE_CARRIER') {
                await this.chargeCustomer(partyId, amount);
            } else if (action === 'PAY_PROVIDER') {
                await this.payoutProvider(partyId, amount);
            }
        }
    }
}
