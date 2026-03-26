import Stripe from 'stripe';
import axios from 'axios';

/**
 * HAUL COMMAND: THE CARDANO (ADA) PHASE-GATE
 * Execution: Do NOT launch Native Tokens until the business is highly profitable.
 * Condition 1: Stripe MRR > $5,000.00
 * Condition 2: ADA 30-Day Market Trend is Positive (Bullish).
 * Initial Supply: 100,000,000 HTK (Haul Tokens) instead of 10 Billion to create early scarcity.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY;

export async function checkCardanoLaunchConditions() {
    console.log('[Phase-Gate] Checking Financial Prerequisites for blockchain deployment...');

    // 1. Calculate Monthly Recurring Revenue (MRR) from Stripe
    const { data: subscriptions } = await stripe.subscriptions.list({ status: 'active', limit: 100 });
    let totalMRR_Cents = 0;

    for (const sub of subscriptions) {
        if (sub.items.data[0].price.unit_amount) {
            totalMRR_Cents += sub.items.data[0].price.unit_amount;
        }
    }
    
    const mrrTotal = totalMRR_Cents / 100;
    console.log(`[Phase-Gate] Current Stripe MRR: $${mrrTotal}`);

    if (mrrTotal < 5000) {
        console.warn('❌ [Phase-Gate] FAILED: MRR is below $5,000 target. Keeping Cardano deployment disabled.');
        return false;
    }

    // 2. Check CoinMarketCap to ensure we don't launch in a bear market
    try {
        const cmcResponse = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
            params: { symbol: 'ADA' },
            headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY }
        });

        const adaData = cmcResponse.data.data.ADA;
        const trend30Day = adaData.quote.USD.percent_change_30d;

        if (trend30Day < 0) {
            console.warn(`❌ [Phase-Gate] FAILED: Cardano market trend is down (${trend30Day}%). Delaying token generation event to protect initial valuation.`);
            return false;
        }

        console.log(`✅ [Phase-Gate] PASSED: MRR is $${mrrTotal} AND Cardano market is up (${trend30Day}%).`);

        // 3. Initiate the Minting Protocol trigger (Handled internally by the Cardano CLI Node)
        // INITIAL SUPPLY REDUCED TO 100 MILLION HTK per Commander's orders.
        console.log('🚀 [Phase-Gate] TRIGGERING 100M MINT VIA SMART CONTRACT ESCROW SERVER...');
        // await triggerCardanoMint(100000000); 

        return true;

    } catch (e) {
        console.error('Failed to communicate with CoinMarketCap Oracle.', e.message);
        return false;
    }
}

// checkCardanoLaunchConditions();
