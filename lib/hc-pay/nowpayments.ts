/**
 * HC Pay — NOWPayments API Client
 *
 * Pure REST — zero npm packages needed.
 * Handles payment creation, status checks, currency listing, and IPN verification.
 *
 * NOWPayments offers 350+ cryptos at 0.5% processing fee.
 * HC Pay charges 1.5% on top → 1.0% spread = HC Pay profit.
 */

const BASE_URL = process.env.NOWPAYMENTS_SANDBOX === 'true'
    ? 'https://api-sandbox.nowpayments.io/v1'
    : 'https://api.nowpayments.io/v1';

function getHeaders(): Record<string, string> {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) throw new Error('[HC Pay] Missing NOWPAYMENTS_API_KEY');
    return {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
    };
}

// ── Types ──

export interface CreatePaymentParams {
    priceAmountUsd: number;
    payCurrency: string;       // NOWPayments coin code: 'btcln', 'ada', 'usdttrc20'
    orderId: string;           // internal reference: 'hold_request:uuid:user_uuid'
    orderDescription: string;
    ipnCallbackUrl: string;
    successUrl?: string;
    cancelUrl?: string;
}

export interface NOWPaymentResult {
    payment_id: string;
    payment_status: string;
    pay_address: string;
    pay_amount: number;
    pay_currency: string;
    price_amount: number;
    price_currency: string;
    created_at: string;
    expiration_estimate_date: string;
    invoice_url?: string;
}

export interface NOWPaymentStatus {
    payment_id: string;
    payment_status: string;
    pay_address: string;
    pay_amount: number;
    actually_paid: number;
    pay_currency: string;
    price_amount: number;
    price_currency: string;
    outcome_amount?: number;
    outcome_currency?: string;
}

// ── API Functions ──

/**
 * Create a new crypto payment via NOWPayments.
 * Returns the pay address and amount the user needs to send.
 */
export async function createPayment(params: CreatePaymentParams): Promise<NOWPaymentResult> {
    const res = await fetch(`${BASE_URL}/payment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            price_amount: params.priceAmountUsd,
            price_currency: 'usd',
            pay_currency: params.payCurrency,
            order_id: params.orderId,
            order_description: params.orderDescription,
            ipn_callback_url: params.ipnCallbackUrl,
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            is_fixed_rate: true,      // lock rate for 20 minutes
            is_fee_paid_by_user: false, // HC Pay covers network fees
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[NOWPayments] createPayment failed (${res.status}): ${errText}`);
    }

    return res.json();
}

/**
 * Check the status of an existing payment.
 */
export async function getPaymentStatus(paymentId: string): Promise<NOWPaymentStatus> {
    const res = await fetch(`${BASE_URL}/payment/${paymentId}`, {
        headers: getHeaders(),
    });

    if (!res.ok) {
        throw new Error(`[NOWPayments] getPaymentStatus failed: ${paymentId}`);
    }

    return res.json();
}

/**
 * Get the minimum payment amount for a given currency.
 */
export async function getMinimumAmount(
    currencyFrom: string,
    currencyTo: string = 'usd',
): Promise<{ min_amount: number }> {
    const res = await fetch(
        `${BASE_URL}/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`,
        { headers: getHeaders() },
    );

    if (!res.ok) throw new Error(`[NOWPayments] getMinimumAmount failed`);
    return res.json();
}

/**
 * Get estimated price for a payment (conversion rate preview).
 */
export async function getEstimatedPrice(
    amountUsd: number,
    currencyTo: string,
): Promise<{ estimated_amount: number }> {
    const res = await fetch(
        `${BASE_URL}/estimate?amount=${amountUsd}&currency_from=usd&currency_to=${currencyTo}`,
        { headers: getHeaders() },
    );

    if (!res.ok) throw new Error(`[NOWPayments] getEstimatedPrice failed`);
    return res.json();
}

/**
 * Get all available currencies from NOWPayments (350+).
 * Cache this response — it doesn't change often.
 */
let _currencyCache: string[] | null = null;
let _currencyCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getAvailableCurrencies(): Promise<string[]> {
    if (_currencyCache && Date.now() - _currencyCacheTime < CACHE_TTL) {
        return _currencyCache;
    }

    const res = await fetch(`${BASE_URL}/currencies`, {
        headers: getHeaders(),
    });

    if (!res.ok) {
        // Return cached or empty
        return _currencyCache ?? [];
    }

    const data = await res.json();
    const currencies: string[] = data.currencies ?? [];
    _currencyCache = currencies;
    _currencyCacheTime = Date.now();
    return currencies;
}

/**
 * Verify the IPN (Instant Payment Notification) signature.
 * MUST be called on every incoming webhook before processing.
 *
 * NOWPayments signs with HMAC-SHA512 using your IPN secret.
 */
export async function verifyIpnSignature(
    rawBody: string,
    receivedSig: string,
): Promise<boolean> {
    const secret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (!secret) {
        console.error('[HC Pay] Missing NOWPAYMENTS_IPN_SECRET — cannot verify IPN');
        return false;
    }

    try {
        // Sort the JSON keys before hashing (NOWPayments requirement)
        const parsed = JSON.parse(rawBody);
        const sorted = sortObjectKeys(parsed);
        const sortedBody = JSON.stringify(sorted);

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-512' },
            false,
            ['sign'],
        );
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(sortedBody));
        const computed = Buffer.from(sig).toString('hex');
        return computed === receivedSig;
    } catch (err) {
        console.error('[HC Pay] IPN signature verification error:', err);
        return false;
    }
}

/**
 * Sort object keys alphabetically (recursive) — required by NOWPayments HMAC.
 */
function sortObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sortObjectKeys);
    return Object.keys(obj)
        .sort()
        .reduce((acc: any, key: string) => {
            acc[key] = sortObjectKeys(obj[key]);
            return acc;
        }, {});
}
