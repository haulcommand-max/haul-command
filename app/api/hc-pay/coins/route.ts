/**
 * GET /api/hc-pay/coins
 *
 * Returns coin list with country-specific defaults.
 * Also fetches full NOWPayments currency list for "300+ more" drawer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoinsForCountry, ALL_STATIC_COINS } from '@/lib/hc-pay/coins';
import { getAvailableCurrencies } from '@/lib/hc-pay/nowpayments';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const country = (searchParams.get('country') ?? 'US').toUpperCase();

    const defaults = getCoinsForCountry(country);

    let allAvailable: string[] = [];
    try {
        allAvailable = await getAvailableCurrencies();
    } catch {
        // Non-fatal — static defaults still work
    }

    return NextResponse.json({
        defaults,
        staticCoins: ALL_STATIC_COINS,
        totalAvailable: allAvailable.length || 350,
        allCurrencyCodes: allAvailable,
        country,
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
    });
}
