import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * COMPLIANCE SCANNER CRON — TASK 2 (Cron Endpoint)
 * 
 * GET /api/cron/compliance-scanner?days=30
 *
 * Scans for credentials expiring within N days and:
 * 1. Returns operators at risk of auto-suspension
 * 2. Can be called by Vercel Cron to trigger email alerts
 * 3. Auto-expires credentials that have passed their expiration_date
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days') || '30', 10);

    const supabase = createClient();

    // Step 1: Scan for expiring credentials
    const { data: expiring, error: scanError } = await supabase.rpc('scan_expiring_credentials', {
      p_days_ahead: daysAhead,
    });

    if (scanError) {
      console.error('[Compliance Scanner] Scan error:', scanError);
      return NextResponse.json({ error: 'Scan failed', details: scanError.message }, { status: 500 });
    }

    // Step 2: Auto-expire credentials past their expiration date
    // This triggers the compliance_auto_suspend trigger
    const { data: autoExpired, error: expireError } = await supabase
      .from('hc_credential_wallets')
      .update({ verification_status: 'expired', updated_at: new Date().toISOString() })
      .eq('verification_status', 'verified')
      .lt('expiration_date', new Date().toISOString().split('T')[0])
      .select('id, company_id, document_type, expiration_date');

    if (expireError) {
      console.error('[Compliance Scanner] Auto-expire error:', expireError);
    }

    // Step 3: Categorize results
    const critical = (expiring || []).filter((e: any) => e.days_until_expiry <= 7);
    const warning = (expiring || []).filter((e: any) => e.days_until_expiry > 7 && e.days_until_expiry <= 14);
    const upcoming = (expiring || []).filter((e: any) => e.days_until_expiry > 14);

    return NextResponse.json({
      scanned_at: new Date().toISOString(),
      days_ahead: daysAhead,
      auto_expired_count: autoExpired?.length || 0,
      auto_expired: autoExpired || [],
      summary: {
        critical_count: critical.length,
        warning_count: warning.length,
        upcoming_count: upcoming.length,
        total: (expiring || []).length,
      },
      critical,
      warning,
      upcoming,
    });
  } catch (err) {
    console.error('[Compliance Scanner] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
