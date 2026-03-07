// ═══════════════════════════════════════════════════════════════════════════════
// DATA MARKETPLACE API — Checkout Session Creator
// POST /api/data/checkout — Creates Stripe checkout session for data purchase
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/enterprise/self-serve-marketplace';
import type { DataProductSku } from '@/lib/enterprise/self-serve-marketplace';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sku, billing_interval, email, customer_id, country_code } = body;

        if (!sku || !email) {
            return NextResponse.json(
                { error: 'Missing required fields: sku, email' },
                { status: 400 },
            );
        }

        const validSkus: DataProductSku[] = [
            'operations_optimizer', 'pricing_intelligence',
            'risk_command', 'enterprise_full_signal',
        ];
        if (!validSkus.includes(sku)) {
            return NextResponse.json(
                { error: `Invalid SKU. Valid options: ${validSkus.join(', ')}` },
                { status: 400 },
            );
        }

        const result = await createCheckoutSession({
            sku,
            billingInterval: billing_interval || 'monthly',
            customerEmail: email,
            customerId: customer_id,
            countryCode: country_code || 'US',
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/data/success`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/data`,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[data/checkout] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 },
        );
    }
}
