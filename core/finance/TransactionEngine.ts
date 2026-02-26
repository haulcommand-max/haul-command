import { uib } from '../intelligence/IntelligenceBus';

export interface TransactionRequest {
    job_id: string;
    payer_id: string; // Broker
    payee_id: string; // Driver
    amount: number;
    type: 'DISPATCH_FEE' | 'QUICK_PAY' | 'SUBSCRIPTION';
}

export interface FactoringRequest {
    transaction_id: string;
    driver_id: string;
}

export class TransactionEngine {
    private static FEE_RATE = 0.15; // 15% Default Dispatch Fee
    private static QUICK_PAY_FEE = 0.05; // 5% Additional for Instant Pay

    public async processDispatchFee(request: TransactionRequest) {
        // Calculate standard 15% cut
        const feeAmount = request.amount * TransactionEngine.FEE_RATE;
        const netAmount = request.amount - feeAmount;

        // Emit Signal regarding new revenue event
        uib.emitSignal({
            id: `TX-${Date.now()}`,
            type: 'FIN-S', // Financial Signal
            source: 'TRANSACTION_ENGINE',
            timestamp: Date.now(),
            hash: 'hash-tx-123',
            sqs: 100,
            priority: 'HIGH',
            payload: {
                status: 'PENDING_SETTLEMENT',
                job_id: request.job_id,
                gross: request.amount,
                fee: feeAmount,
                net: netAmount
            }
        });

        console.log(`[TransactionEngine] Processed Dispatch Fee: Gross $${request.amount}, Fee $${feeAmount}, Net $${netAmount}`);
        return {
            transaction_id: `TX-${Date.now()}`,
            gross: request.amount,
            fee: feeAmount,
            net: netAmount,
            status: 'PENDING'
        };
    }

    public async processQuickPay(request: FactoringRequest, originalTransaction: any) {
        // Driver wants money NOW. We take another 5%.
        const speedFee = originalTransaction.net * TransactionEngine.QUICK_PAY_FEE;
        const payout = originalTransaction.net - speedFee;

        uib.emitSignal({
            id: `QP-${Date.now()}`,
            type: 'FIN-S',
            source: 'TRANSACTION_ENGINE',
            timestamp: Date.now(),
            hash: 'hash-qp-123',
            sqs: 100,
            priority: 'CRITICAL', // Immediate payout needed
            payload: {
                status: 'QUICK_PAY_REQUESTED',
                driver_id: request.driver_id,
                original_net: originalTransaction.net,
                speed_fee: speedFee,
                payout: payout
            }
        });

        console.log(`[TransactionEngine] Quick Pay Requested: Original Net $${originalTransaction.net}, Speed Fee $${speedFee}, Payout $${payout}`);
        return {
            factoring_id: `QP-${Date.now()}`,
            payout: payout,
            fee: speedFee,
            status: 'APPROVED'
        };
    }
}
