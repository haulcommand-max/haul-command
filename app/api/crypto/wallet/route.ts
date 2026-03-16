import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const supabaseAdmin = getSupabaseAdmin();

const NP_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const NP_BASE_URL = 'https://api.nowpayments.io/v1';

/**
 * POST /api/crypto/wallet
 * Create/link a crypto wallet for an operator profile
 * Body: { operator_id, wallet_address, preferred_crypto }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { operator_id, wallet_address, preferred_crypto = 'usdt' } = body;

        if (!operator_id) {
            return NextResponse.json({ error: 'operator_id required' }, { status: 400 });
        }

        // Validate the crypto is in our preferred list
        const PREFERRED_CRYPTOS = [
            'btc', 'eth', 'usdt', 'usdc', 'ltc', 'xrp',
            'sol', 'matic', 'bnb', 'trx', 'doge', 'ada',
        ];

        if (!PREFERRED_CRYPTOS.includes(preferred_crypto.toLowerCase())) {
            return NextResponse.json({
                error: `Unsupported crypto. Choose from: ${PREFERRED_CRYPTOS.join(', ')}`,
            }, { status: 400 });
        }

        // Update operator profile with crypto details
        const { data, error } = await supabaseAdmin
            .from('operators')
            .update({
                crypto_wallet_address: wallet_address || null,
                preferred_crypto: preferred_crypto.toLowerCase(),
                crypto_enabled: true,
            })
            .eq('id', operator_id)
            .select('id, company_name, crypto_wallet_address, preferred_crypto, crypto_enabled')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            operator: data,
            message: `Crypto wallet linked. You can now receive payments in ${preferred_crypto.toUpperCase()}.`,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

/**
 * GET /api/crypto/wallet?operator_id=xxx
 * Get operator's crypto wallet status
 */
export async function GET(req: NextRequest) {
    const operatorId = req.nextUrl.searchParams.get('operator_id');
    if (!operatorId) {
        return NextResponse.json({ error: 'operator_id required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('operators')
        .select('id, company_name, crypto_wallet_address, preferred_crypto, crypto_enabled, nowpayments_sub_id')
        .eq('id', operatorId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get available currencies for them
    const preferredCurrencies = [
        { id: 'btc', name: 'Bitcoin', icon: '₿' },
        { id: 'eth', name: 'Ethereum', icon: 'Ξ' },
        { id: 'usdt', name: 'Tether USDT', icon: '₮' },
        { id: 'usdc', name: 'USD Coin', icon: '$' },
        { id: 'ltc', name: 'Litecoin', icon: 'Ł' },
        { id: 'xrp', name: 'XRP', icon: '✕' },
        { id: 'sol', name: 'Solana', icon: '◎' },
        { id: 'matic', name: 'Polygon', icon: '⬡' },
        { id: 'bnb', name: 'BNB', icon: '◆' },
        { id: 'trx', name: 'TRON', icon: '⟁' },
        { id: 'doge', name: 'Dogecoin', icon: 'Ð' },
        { id: 'ada', name: 'Cardano', icon: '₳' },
    ];

    return NextResponse.json({
        success: true,
        wallet: data,
        available_currencies: preferredCurrencies,
    });
}
