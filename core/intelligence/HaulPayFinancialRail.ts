import { uib } from './IntelligenceBus';

interface PaymentRequest {
    jobId: string;
    amount: number;
    payeeId: string; // e.g., 'ods-001'
    trigger: string; // 'DELIVERY_CONFIRMED'
}

export class HaulPayFinancialRail {

    // Mock Ledger
    private static ledger = new Map<string, number>();

    public static settle(jobId: string, req: PaymentRequest) {
        console.log(`[HAUL PAY] Processing Settlement for Job ${jobId} ($${req.amount} to ${req.payeeId})`);

        // 1. Validate Trigger
        if (req.trigger !== 'DELIVERED_EVIDENCE') {
            console.log(`[HAUL PAY] HOLDING FUNDS. Trigger '${req.trigger}' is not valid for release.`);
            return { status: 'HELD', reason: 'INVALID_TRIGGER' };
        }

        // 2. Execute Transfer (Mock)
        const currentBalance = this.ledger.get(req.payeeId) || 0;
        this.ledger.set(req.payeeId, currentBalance + req.amount);

        console.log(`[HAUL PAY] $$$ INSTANT TRANSFER COMPLETE $$$. New Balance for ${req.payeeId}: $${this.ledger.get(req.payeeId)}`);

        // 3. Emit FIN-S (Financial Signal)
        uib.emitSignal({
            id: `fin-${Date.now()}`,
            type: 'FIN-S',
            source: 'haul-pay-rail',
            payload: {
                jobId,
                amount: req.amount,
                payee: req.payeeId,
                status: 'PAID',
                timestamp: Date.now()
            },
            hash: 'sha256-placeholder', // In real life, this is the Block Hash
            timestamp: Date.now(),
            sqs: 1.0
        });

        return { status: 'PAID', txId: `tx-${Date.now()}` };
    }
}
