import { uib } from './IntelligenceBus';

interface CallContext {
    callerId: string;
    loadDetails: any; // { origin, dest, dimensions }
    offeredRate: number;
}

export class VapiBrokerBlocker {

    // Core Rate Matrix (P6 Baseline)
    private static readonly BASELINE_RPM = 4.50;
    private static readonly MIN_ACCEPTABLE_RPM = 3.85;

    public static async handleInboundCall(context: CallContext) {
        console.log(`[VAPI BLOCKER] Call from ${context.callerId}. Rate Offer: $${context.offeredRate}/mile`);

        // 1. Rate Check
        if (context.offeredRate < this.MIN_ACCEPTABLE_RPM) {
            return this.negotiateUp(context);
        }

        // 2. Accept
        return this.acceptLoad(context);
    }

    private static negotiateUp(context: CallContext) {
        console.log(`[VAPI BLOCKER] REJECTING LOWBALL. Countering with $${this.BASELINE_RPM}`);

        // This would return a Vapi JSON Instructions payload
        return {
            action: 'SAY',
            text: `I cannot accept ${context.offeredRate}. Our fleet baseline for this corridor is ${this.BASELINE_RPM} per mile due to bridge friction. Do you want to book at ${this.BASELINE_RPM}?`
        };
    }

    private static acceptLoad(context: CallContext) {
        console.log(`[VAPI BLOCKER] RATE ACCEPTED. Dispatching to Control Tower.`);

        // Emit Ingestion Signal for the Load
        uib.emitSignal({
            id: `vapi-load-${Date.now()}`,
            type: 'ING-S',
            source: 'vapi-ai-voice',
            payload: {
                ...context.loadDetails,
                rate: context.offeredRate,
                status: 'BOOKED_WAITING_DISPATCH'
            },
            hash: 'sha256-placeholder',
            timestamp: Date.now(),
            sqs: 0.85 // Voice deals are verified but need contract
        });

        return {
            action: 'TRANSFER',
            destination: 'DISPATCH_HUMAN_P1'
        };
    }
}
