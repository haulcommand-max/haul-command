import { UIBSignal } from '../intelligence/IntelligenceBus';

/**
 * Rapid! PayCard Connector
 * 
 * Purpose: Interfaces with Rapid! API for Earned Wage Access (EWA) and Instant Payouts.
 * " The Financial Rail "
 */
export class RapidPayConnector {
    private apiKey: string;
    private baseUrl: string = 'https://api.rapidpaycard.com/v1';

    constructor() {
        this.apiKey = process.env.RAPID_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[Rapid! Connector] No API Key found. Connector is dormant.');
        }
    }

    /**
     * Issues an instant payout to a provider's card
     */
    async issuePayout(providerId: string, amount: number, reference: string): Promise<boolean> {
        if (!this.apiKey) return false;
        console.log(`[Rapid!] Issuing Payout: $${amount} to ${providerId} (Ref: ${reference})`);

        // Mock API Call
        return true;
    }

    /**
     * Handles FIN-S Signals to trigger payouts
     */
    async handleSignal(signal: UIBSignal) {
        if (signal.type === 'FIN-S' && signal.payload.action === 'SETTLE_JOB') {
            console.log(`[Rapid!] Settlement Triggered for Job ${signal.payload.jobId}`);
            await this.issuePayout(signal.payload.providerId, signal.payload.amount, signal.payload.jobId);
        }
    }

    /**
     * Phase 2: Instant Onboarding
     * Issues a virtual card to a new Provider immediately upon verification.
     */
    async issueVirtualCard(provider: { id: string, name: string, email: string }): Promise<string> {
        if (!this.apiKey) return 'ERROR_NO_KEY';

        console.log(`[Rapid!] Issuing Virtual Card for: ${provider.name} (${provider.id})`);
        // Mock Response: Returns a masked Card ID
        return `CARD-${provider.id.substring(0, 4)}-XXXX`;
    }
}
