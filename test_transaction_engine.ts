import { TransactionEngine } from './core/finance/TransactionEngine';
import { uib } from './core/intelligence/IntelligenceBus';

// Mock UIB emission to avoid errors if UIB isn't fully initialized or connected
uib.emitSignal = (signal: any) => {
    console.log(`[MOCK UIB] Emitted: ${signal.type} | Priority: ${signal.priority} | Net: ${signal.payload.net || signal.payload.payout}`);
};

async function testMonetization() {
    console.log('--- Testing Transaction Engine ---');
    const engine = new TransactionEngine();

    // Test 1: Standard Dispatch Fee
    console.log('\nTest 1: Dispatch Fee ($1000 Load)');
    const tx = await engine.processDispatchFee({
        job_id: 'JOB-TEST-001',
        payer_id: 'BROKER-TEST',
        payee_id: 'DRIVER-TEST',
        amount: 1000,
        type: 'DISPATCH_FEE'
    });

    if (tx.fee === 150 && tx.net === 850) {
        console.log('PASS: Fee is 15% ($150)');
    } else {
        console.error(`FAIL: Expected fee $150, got $${tx.fee}`);
    }

    // Test 2: Quick Pay
    console.log('\nTest 2: Quick Pay Request (on previous tx)');
    const qp = await engine.processQuickPay({
        transaction_id: tx.transaction_id,
        driver_id: 'DRIVER-TEST'
    }, tx);

    // Net was 850. 5% of 850 = 42.50. Payout = 807.50
    if (qp.fee === 42.50 && qp.payout === 807.50) {
        console.log('PASS: Quick Pay Fee is 5% of Net ($42.50)');
    } else {
        console.error(`FAIL: Expected fee $42.50, got $${qp.fee}. Payout $${qp.payout}`);
    }
}

testMonetization();
