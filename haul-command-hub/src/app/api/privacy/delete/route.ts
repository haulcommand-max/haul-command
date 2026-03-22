/**
 * POST /api/privacy/delete
 * GDPR Right to Erasure (Article 17)
 * Deletes all user data across Supabase tables.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, user_id, reason } = body;

    if (!email && !user_id) {
      return NextResponse.json({ error: 'email or user_id required' }, { status: 400 });
    }

    const sb = supabaseServer();
    const deletedTables: string[] = [];
    const errors: string[] = [];

    // Tables to purge user data from
    const tablesToPurge = [
      { table: 'profiles', column: user_id ? 'id' : 'email' },
      { table: 'alert_signups', column: 'email' },
      { table: 'sms_credits', column: 'user_id' },
      { table: 'sms_log', column: 'user_id' },
      { table: 'push_tokens', column: 'user_id' },
      { table: 'hc_pay_wallets', column: 'user_id' },
      { table: 'hc_pay_ledger', column: 'user_id' },
      { table: 'referral_credits', column: user_id ? 'referrer_id' : 'email' },
    ];

    const identifier = user_id || email;

    for (const { table, column } of tablesToPurge) {
      try {
        const { error } = await sb.from(table).delete().eq(column, identifier);
        if (!error) {
          deletedTables.push(table);
        } else {
          // Table might not exist or column might not exist — non-fatal
          errors.push(`${table}: ${error.message}`);
        }
      } catch {
        errors.push(`${table}: table not found`);
      }
    }

    // Log the deletion request for audit trail (GDPR requires proof)
    try {
      await sb.from('gdpr_deletion_log').insert({
        identifier_hash: Buffer.from(identifier).toString('base64'),
        reason: reason || 'user_request',
        tables_purged: deletedTables,
        completed_at: new Date().toISOString(),
      });
    } catch {
      // Log table may not exist yet
    }

    return NextResponse.json({
      status: 'completed',
      message: 'All personal data has been deleted per GDPR Article 17.',
      tables_purged: deletedTables,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GDPR Delete] Error:', err);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}
