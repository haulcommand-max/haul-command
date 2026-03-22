/**
 * POST /api/privacy/export
 * GDPR Right to Portability (Article 20)
 * Exports all user data as JSON.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, user_id } = body;

    if (!email && !user_id) {
      return NextResponse.json({ error: 'email or user_id required' }, { status: 400 });
    }

    const sb = supabaseServer();
    const identifier = user_id || email;
    const exportData: Record<string, unknown> = {
      export_date: new Date().toISOString(),
      data_controller: 'Haul Command LLC',
      contact: 'privacy@haulcommand.com',
    };

    // Tables to export
    const tables = [
      { table: 'profiles', column: user_id ? 'id' : 'email', label: 'profile' },
      { table: 'hc_places', column: user_id ? 'owner_id' : 'email', label: 'business_listings' },
      { table: 'alert_signups', column: 'email', label: 'alert_subscriptions' },
      { table: 'sms_log', column: 'user_id', label: 'sms_history' },
      { table: 'hc_pay_wallets', column: 'user_id', label: 'wallet' },
      { table: 'hc_pay_ledger', column: 'user_id', label: 'transactions' },
      { table: 'ad_campaigns', column: user_id ? 'owner_id' : 'email', label: 'ad_campaigns' },
      { table: 'referral_credits', column: user_id ? 'referrer_id' : 'email', label: 'referral_credits' },
    ];

    for (const { table, column, label } of tables) {
      try {
        const { data } = await sb.from(table).select('*').eq(column, identifier);
        if (data && data.length > 0) {
          exportData[label] = data;
        }
      } catch {
        // Table may not exist
      }
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="haulcommand-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (err) {
    console.error('[GDPR Export] Error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
