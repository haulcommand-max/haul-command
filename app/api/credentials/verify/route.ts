import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * CREDENTIAL VERIFICATION API — TASK 1
 * 
 * POST /api/credentials/verify
 * Body: { company_id, required_types? }
 * 
 * Calls the verify_operator_credentials RPC which checks each required
 * credential type against the proof chain. Returns a structured result
 * indicating which credentials are valid, expired, or missing, along
 * with their proof hashes for tamper detection.
 */
export async function POST(request: Request) {
  try {
    const { company_id, required_types } = await request.json();

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    const supabase = createClient();

    // Call the verification RPC
    const { data, error } = await supabase.rpc('verify_operator_credentials', {
      p_company_id: company_id,
      p_required_types: required_types || ['auto_insurance', 'general_liability', 'state_certification'],
    });

    if (error) {
      console.error('[Credential Verify] RPC error:', error);
      return NextResponse.json({ error: 'Verification failed', details: error.message }, { status: 500 });
    }

    // Log the verification request
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('hc_verification_requests').insert({
        requester_id: user.id,
        target_company_id: company_id,
        credential_types_checked: required_types || ['auto_insurance', 'general_liability', 'state_certification'],
        all_valid: data?.all_valid ?? false,
        failed_checks: (data?.credentials || []).filter((c: any) => !c.valid),
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[Credential Verify] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
