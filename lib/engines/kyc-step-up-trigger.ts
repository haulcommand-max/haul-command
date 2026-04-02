/**
 * HAUL COMMAND: KYC STEP-UP TRIGGER (PENDING EDGE FUNCTION DEPLOYMENT)
 * Auto-flags users for Level-Up reviews when they hit earning thresholds.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function checkKycStepUpRequirements(userId: string) {
  // Pull Operator Core Data
  const { data: kyc } = await supabase.from('kyc_verifications').select('*').eq('user_id', userId).single();
  const { data: earnings } = await supabase.rpc('get_total_driver_earnings', { u_id: userId });

  if (!kyc || !earnings) return;

  // Target KYC Level 2 if earnings exceed $500 threshold
  if (kyc.level < 2 && earnings.total_cents > 50000) {
    console.log(`[KYC_ENGINE] User ${userId} exceeded $500 threshold. Triggering L2 Step-Up.`);
    await supabase.from('notification_events').insert({
      user_id: userId,
      type: 'KYC_WARN',
      title: 'Earnings Threshold Reached',
      body: 'You must upgrade to KYC Level 2 (Stripe Link + ID Verification) to accept further jobs over $500.'
    });

    await supabase.from('kyc_verifications').update({ status: 'PENDING', level: 2 }).eq('id', kyc.id);
  }
}
