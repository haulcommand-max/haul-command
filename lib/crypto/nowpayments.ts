/**
 * HAUL COMMAND: NOWPayments Crypto Service
 * Handles crypto checkout, IPN webhooks, and legality checks.
 * White-label + affiliate double-dip built in.
 */

const NP_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const NP_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const NP_BASE_URL = 'https://api.nowpayments.io/v1';

interface CreatePaymentParams {
    price_amount: number;
    price_currency: string;    // 'usd', 'eur', etc.
    pay_currency?: string;     // 'btc', 'eth', 'usdt', etc.
    order_id: string;
    order_description: string;
    ipn_callback_url: string;
    case?: 'success' | 'fail';
}

interface CryptoPaymentResponse {
    payment_id: string;
    payment_status: string;
    pay_address: string;
    pay_amount: number;
    pay_currency: string;
    price_amount: number;
    price_currency: string;
    purchase_id: string;
    created_at: string;
    error?: string;
}

export async function createCryptoPayment(params: CreatePaymentParams): Promise<CryptoPaymentResponse> {
    if (!NP_API_KEY) {
        throw new Error('NOWPAYMENTS_API_KEY not configured');
    }

    const res = await fetch(`${NP_BASE_URL}/payment`, {
        method: 'POST',
        headers: {
            'x-api-key': NP_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...params,
            is_fee_paid_by_user: true, // ZERO cost processing — fee paid by customer
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`NOWPayments error ${res.status}: ${err}`);
    }

    return res.json();
}

export async function getPaymentStatus(paymentId: string): Promise<CryptoPaymentResponse> {
    if (!NP_API_KEY) throw new Error('NOWPAYMENTS_API_KEY not configured');

    const res = await fetch(`${NP_BASE_URL}/payment/${paymentId}`, {
        headers: { 'x-api-key': NP_API_KEY },
    });

    return res.json();
}

export async function getAvailableCurrencies(): Promise<string[]> {
    if (!NP_API_KEY) return ['btc', 'eth', 'usdt', 'usdc'];

    const res = await fetch(`${NP_BASE_URL}/currencies`, {
        headers: { 'x-api-key': NP_API_KEY },
    });

    const data = await res.json();
    return data.currencies || [];
}

export async function getMinimumPaymentAmount(currencyFrom: string, currencyTo: string): Promise<number> {
    if (!NP_API_KEY) return 0;

    const res = await fetch(
        `${NP_BASE_URL}/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`,
        { headers: { 'x-api-key': NP_API_KEY } }
    );

    const data = await res.json();
    return data.min_amount || 0;
}

export async function getEstimatedPrice(amount: number, currencyFrom: string, currencyTo: string) {
    if (!NP_API_KEY) return null;

    const res = await fetch(
        `${NP_BASE_URL}/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`,
        { headers: { 'x-api-key': NP_API_KEY } }
    );

    return res.json();
}

/**
 * Verify IPN callback signature from NOWPayments
 */
export function verifyIPNSignature(body: string, signature: string): boolean {
    if (!NP_IPN_SECRET) return false;

    // NOWPayments uses HMAC-SHA512
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha512', NP_IPN_SECRET);

    // Sort the JSON keys before hashing (NOWPayments requirement)
    const sorted = JSON.stringify(JSON.parse(body), Object.keys(JSON.parse(body)).sort());
    hmac.update(sorted);
    const computed = hmac.digest('hex');

    return computed === signature;
}

/**
 * Check if crypto payments are legal in a country
 */
export async function checkCryptoLegality(countryCode: string) {
    const { supabaseServer } = await import('@/lib/supabase/server');
    const supabase = supabaseServer();

    const { data } = await supabase
        .from('hc_crypto_legality')
        .select('*')
        .eq('country_code', countryCode)
        .single();

    if (!data) {
        return { allowed: false, reason: 'Country not in legality matrix' };
    }

    if (data.crypto_status === 'banned') {
        return { allowed: false, reason: `Crypto banned in ${countryCode}: ${data.notes}` };
    }

    if (data.crypto_status === 'restricted') {
        return {
            allowed: true,
            restricted: true,
            stablecoin_only: data.stablecoin_ok && !data.btc_ok,
            requires_kyc: data.requires_kyc,
            notes: data.notes,
            regulatory_body: data.regulatory_body,
        };
    }

    return {
        allowed: true,
        restricted: false,
        stablecoin_ok: data.stablecoin_ok,
        btc_ok: data.btc_ok,
        eth_ok: data.eth_ok,
        requires_kyc: data.requires_kyc,
        notes: data.notes,
    };
}
