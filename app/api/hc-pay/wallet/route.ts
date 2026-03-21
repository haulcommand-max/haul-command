/**
 * GET /api/hc-pay/wallet
 *
 * Returns authenticated user's HC Pay wallet balance + ledger history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getOrCreateWallet, getLedgerHistory } from '@/lib/hc-pay/ledger';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
        const offset = parseInt(searchParams.get('offset') ?? '0');

        const [wallet, history] = await Promise.all([
            getOrCreateWallet(user.id),
            getLedgerHistory(user.id, limit, offset),
        ]);

        return NextResponse.json({
            wallet: {
                id: wallet.id,
                balanceUsd: parseFloat(wallet.balance_usd),
                pendingUsd: parseFloat(wallet.pending_usd),
                lifetimeEarnedUsd: parseFloat(wallet.lifetime_earned_usd),
                lifetimePaidUsd: parseFloat(wallet.lifetime_paid_usd),
                currency: wallet.currency,
                isFrozen: wallet.is_frozen,
            },
            history: history.entries.map((e: any) => ({
                id: e.id,
                type: e.entry_type,
                amount: parseFloat(e.amount_usd),
                direction: e.direction,
                balanceAfter: parseFloat(e.balance_after),
                fee: parseFloat(e.fee_usd || 0),
                coin: e.crypto_coin,
                network: e.crypto_network,
                referenceType: e.reference_type,
                referenceId: e.reference_id,
                note: e.note,
                createdAt: e.created_at,
            })),
            pagination: { limit, offset, total: history.total, hasMore: offset + limit < history.total },
        });
    } catch (err: any) {
        console.error('[HC Pay Wallet]', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
