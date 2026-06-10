import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        const [wallets, ledger] = await Promise.all([
            supabase.from('v_hc_wallet_rows').select('*').limit(100),
            supabase.from('v_hc_wallet_log').select('*').limit(100),
        ]);

        return NextResponse.json({
            ok: true,
            wallets: wallets.data || [],
            ledger: ledger.data || [],
            errors: [wallets.error?.message, ledger.error?.message].filter(Boolean),
        });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Wallet summary failed', details: error?.message }, { status: 500 });
    }
}
