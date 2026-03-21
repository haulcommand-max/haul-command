/**
 * HC Pay — Wallet Ledger
 *
 * The ledger is append-only. Every function here INSERTs — never UPDATEs or DELETEs.
 * Reversals are their own entries (refund_issued).
 *
 * The hc_pay_write_ledger_entry Postgres function uses FOR UPDATE row locking —
 * concurrent payments to the same wallet are safe.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface LedgerEntryParams {
    walletId: string;
    userId: string;
    entryType: string;
    amountUsd: number;
    direction: 'credit' | 'debit';
    referenceType?: string;
    referenceId?: string;
    counterpartyUserId?: string;
    feeUsd?: number;
    cryptoCoin?: string;
    cryptoNetwork?: string;
    cryptoAmount?: number;
    cryptoRateUsd?: number;
    nowpaymentsPaymentId?: string;
    stripePaymentIntentId?: string;
    note?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Write a ledger entry and update the wallet balance atomically.
 * Uses a Postgres function with FOR UPDATE row locking.
 * Returns the new ledger entry ID.
 */
export async function writeLedgerEntry(params: LedgerEntryParams): Promise<string> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('hc_pay_write_ledger_entry', {
        p_wallet_id: params.walletId,
        p_user_id: params.userId,
        p_entry_type: params.entryType,
        p_amount_usd: params.amountUsd,
        p_direction: params.direction,
        p_reference_type: params.referenceType ?? null,
        p_reference_id: params.referenceId ?? null,
        p_counterparty_user_id: params.counterpartyUserId ?? null,
        p_fee_usd: params.feeUsd ?? 0,
        p_crypto_coin: params.cryptoCoin ?? null,
        p_crypto_network: params.cryptoNetwork ?? null,
        p_crypto_amount: params.cryptoAmount ?? null,
        p_crypto_rate_usd: params.cryptoRateUsd ?? null,
        p_nowpayments_payment_id: params.nowpaymentsPaymentId ?? null,
        p_stripe_payment_intent_id: params.stripePaymentIntentId ?? null,
        p_note: params.note ?? null,
        p_metadata: params.metadata ?? {},
    });

    if (error) throw new Error(`[HC Pay] Ledger write failed: ${error.message}`);
    return data as string;
}

/**
 * Get a user's wallet. Returns null if not found.
 */
export async function getWallet(userId: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('hc_pay_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        // Wallet might not exist yet (edge case: migration not run)
        if (error.code === 'PGRST116') return null;
        throw new Error(`[HC Pay] getWallet failed: ${error.message}`);
    }

    return data;
}

/**
 * Get or create a wallet for a user.
 * The trigger should auto-create, but this is a safety net.
 */
export async function getOrCreateWallet(userId: string) {
    const existing = await getWallet(userId);
    if (existing) return existing;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('hc_pay_wallets')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) throw new Error(`[HC Pay] Wallet creation failed: ${error.message}`);
    return data;
}

/**
 * Get paginated ledger history for a user.
 */
export async function getLedgerHistory(
    userId: string,
    limit = 50,
    offset = 0,
) {
    const supabase = getSupabaseAdmin();
    const { data, error, count } = await supabase
        .from('hc_pay_ledger')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw new Error(`[HC Pay] getLedgerHistory failed: ${error.message}`);
    return { entries: data ?? [], total: count ?? 0 };
}

/**
 * Record HC Pay revenue.
 */
export async function recordRevenue(params: {
    source: 'crypto_fee' | 'card_fee' | 'quickpay_fee' | 'float_yield' | 'intelligence_api';
    amountUsd: number;
    ledgerEntryId?: string;
    payerUserId?: string;
    referenceType?: string;
    referenceId?: string;
}) {
    const supabase = getSupabaseAdmin();
    await supabase.from('hc_pay_revenue').insert({
        source: params.source,
        amount_usd: params.amountUsd,
        ledger_entry_id: params.ledgerEntryId ?? null,
        payer_user_id: params.payerUserId ?? null,
        reference_type: params.referenceType ?? null,
        reference_id: params.referenceId ?? null,
    });
}
