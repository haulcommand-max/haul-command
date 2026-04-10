/**
 * Haul Command Unified Checkout Gateway
 * 
 * Supports two strict parallel paths per architectural spec:
 * 1. Stripe (Fiat, Cards, CashApp, Apple Pay, Google Pay)
 * 2. NOWPayments (Crypto: ADA, BTC, and 350+ coins)
 */

import { createPayment as createCryptoPayment, NOWPaymentResult } from './nowpayments';

export interface CheckoutRequest {
    userId: string;
    orderId: string;
    amountUsd: number;
    description: string;
    paymentMethod: 'stripe' | 'crypto';
    cryptoCurrency?: string; // e.g., 'ada', 'btc'
}

export class CheckoutGateway {
    static async initiate(req: CheckoutRequest) {
        if (req.paymentMethod === 'stripe') {
            // Initiate Stripe Checkout session
            // Requires 'stripe' package, simplified for architecture mapping
            // It will natively support CashApp and other local payment interfaces
            return {
                type: 'stripe',
                checkoutUrl: `https://checkout.stripe.com/c/pay/${req.orderId}`,
                amountUsd: req.amountUsd
            };
        } else if (req.paymentMethod === 'crypto') {
            if (!req.cryptoCurrency) {
                throw new Error("cryptoCurrency is required for crypto payments");
            }
            const cryptoRes: NOWPaymentResult = await createCryptoPayment({
                priceAmountUsd: req.amountUsd,
                payCurrency: req.cryptoCurrency, // NowPayments code (ada, btc, etc.)
                orderId: req.orderId,
                orderDescription: req.description,
                ipnCallbackUrl: `https://api.haulcommand.com/webhooks/nowpayments`
            });

            return {
                type: 'crypto',
                payAddress: cryptoRes.pay_address,
                payAmount: cryptoRes.pay_amount,
                payCurrency: cryptoRes.pay_currency,
                invoiceUrl: cryptoRes.invoice_url
            };
        }
        
        throw new Error("Invalid payment method selected.");
    }
}
