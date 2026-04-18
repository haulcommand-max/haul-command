/**
 * Haul Command Unified Checkout Gateway
 * Includes Dynamic Corridor-Aware Pricing Logic
 */
import { createPayment as createCryptoPayment, NOWPaymentResult } from './nowpayments';

export interface CheckoutRequest {
    userId: string;
    orderId: string;
    baseAmountUsd: number;
    statesCrossed: number; // For Dynamic Routing Pricing
    paymentMethod: 'stripe' | 'crypto';
    cryptoCurrency?: string;
}

export class CheckoutGateway {
    
    // MSB Tax/Fee Routing Logic (Route-Aware Markup)
    static calculateEscrowFee(statesCrossed: number): number {
        if (statesCrossed === 1) return 15.00; // Standard Flatbed run
        if (statesCrossed > 1) return 15 + (statesCrossed * 10); // Superload dynamic risk premium
        return 15.00;
    }

    static async initiate(req: CheckoutRequest) {
        const escrowFee = this.calculateEscrowFee(req.statesCrossed);
        const finalAmountUsd = req.baseAmountUsd + escrowFee;

        if (req.paymentMethod === 'stripe') {
            return {
                type: 'stripe',
                checkoutUrl: `https://checkout.stripe.com/c/pay/${req.orderId}`,
                amountUsd: finalAmountUsd,
                feeCaptured: escrowFee
            };
        } else if (req.paymentMethod === 'crypto') {
            if (!req.cryptoCurrency) throw new Error("cryptoCurrency required");

            const cryptoRes: NOWPaymentResult = await createCryptoPayment({
                priceAmountUsd: finalAmountUsd,
                payCurrency: req.cryptoCurrency,
                orderId: req.orderId,
                orderDescription: "Escrow Deposit",
                ipnCallbackUrl: `https://api.haulcommand.com/webhooks/nowpayments`
            });

            return {
                type: 'crypto',
                payAddress: cryptoRes.pay_address,
                payAmount: cryptoRes.pay_amount,
                feeCaptured: escrowFee,
                invoiceUrl: cryptoRes.invoice_url
            };
        }
        
        throw new Error("Invalid payment method.");
    }
}
