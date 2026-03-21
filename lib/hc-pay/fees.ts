/**
 * HC Pay — Fee Calculation Engine
 *
 * Revenue model:
 *   Crypto: charge 1.5%, pay NOWPayments 0.5%, keep 1.0%
 *   Card:   charge 3.4%, pay Stripe 2.9% + $0.30, keep ~0.5% + spread
 *   QuickPay: 2.5% on instant payouts
 *
 * This is the Stripe business model applied to Haul Command.
 */

const CRYPTO_HC_FEE = parseFloat(process.env.HC_PAY_FEE_CRYPTO ?? '0.015');   // 1.5%
const CARD_HC_FEE   = parseFloat(process.env.HC_PAY_FEE_CARD   ?? '0.034');   // 3.4%
const QUICKPAY_FEE  = parseFloat(process.env.HC_PAY_QUICKPAY_FEE ?? '0.025'); // 2.5%

const NOWPAYMENTS_COST = 0.005;  // 0.5% — what NOWPayments charges us
const STRIPE_COST_PCT  = 0.029;  // 2.9% — what Stripe charges us
const STRIPE_COST_FLAT = 0.30;   // $0.30 per Stripe transaction

export interface FeeBreakdown {
    grossUsd: number;            // what the payer sends
    hcPayFeeUsd: number;         // HC Pay's total fee collected
    railCostUsd: number;         // what we pay the underlying network
    netToOperatorUsd: number;    // what the payee receives
    hcPaySpreadUsd: number;      // HC Pay's actual profit (fee - rail cost)
    feePercentage: number;       // percentage fee shown to user
}

/**
 * Calculate crypto payment fees.
 * HC Pay charges 1.5%, pays NOWPayments 0.5%, keeps 1.0%.
 */
export function calcCryptoFees(grossUsd: number): FeeBreakdown {
    const hcPayFeeUsd   = roundMoney(grossUsd * CRYPTO_HC_FEE);
    const railCostUsd   = roundMoney(grossUsd * NOWPAYMENTS_COST);
    const netToOperator = roundMoney(grossUsd - hcPayFeeUsd);
    return {
        grossUsd,
        hcPayFeeUsd,
        railCostUsd,
        netToOperatorUsd: netToOperator,
        hcPaySpreadUsd: roundMoney(hcPayFeeUsd - railCostUsd),
        feePercentage: CRYPTO_HC_FEE * 100,
    };
}

/**
 * Calculate card payment fees.
 * HC Pay charges 3.4%, pays Stripe 2.9% + $0.30, keeps the spread.
 */
export function calcCardFees(grossUsd: number): FeeBreakdown {
    const hcPayFeeUsd   = roundMoney(grossUsd * CARD_HC_FEE);
    const railCostUsd   = roundMoney((grossUsd * STRIPE_COST_PCT) + STRIPE_COST_FLAT);
    const netToOperator = roundMoney(grossUsd - hcPayFeeUsd);
    return {
        grossUsd,
        hcPayFeeUsd,
        railCostUsd,
        netToOperatorUsd: netToOperator,
        hcPaySpreadUsd: roundMoney(hcPayFeeUsd - railCostUsd),
        feePercentage: CARD_HC_FEE * 100,
    };
}

/**
 * Calculate QuickPay instant payout fee.
 * 2.5% of the requested amount.
 */
export function calcQuickPayFee(balanceUsd: number): {
    fee: number;
    net: number;
    feePercentage: number;
} {
    const fee = roundMoney(balanceUsd * QUICKPAY_FEE);
    return {
        fee,
        net: roundMoney(balanceUsd - fee),
        feePercentage: QUICKPAY_FEE * 100,
    };
}

/**
 * Get the fee config for display purposes.
 */
export function getFeeSchedule() {
    return {
        crypto: { percentage: CRYPTO_HC_FEE * 100, label: `${(CRYPTO_HC_FEE * 100).toFixed(1)}%` },
        card:   { percentage: CARD_HC_FEE * 100, label: `${(CARD_HC_FEE * 100).toFixed(1)}%` },
        quickpay: { percentage: QUICKPAY_FEE * 100, label: `${(QUICKPAY_FEE * 100).toFixed(1)}%` },
    };
}

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}
