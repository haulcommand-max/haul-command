import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Enterprise Compliance Gateway API ($2,500/mo TMS Integration)
// Route: POST /api/enterprise/compliance-gateway/verify
// Use Case: A broker's external TMS (Motive, Samsara) automatically pings this API 
// before a load dispatcher can physically assign a load to a requested operator.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Authenticate the Enterprise API Key
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    // Verify the Organization's API Subscription Status
    const { data: org, error: orgError } = await supabaseAdmin
      .from('hc_enterprise_organizations')
      .select('id, name, is_verified, api_subscription_status')
      .eq('api_key', apiKey)
      .single();

    if (orgError || !org || org.api_subscription_status !== 'active') {
      return NextResponse.json({ 
        error: 'Forbidden: Invalid API Key or Inactive Enterprise Tier. Upgrade to the $2,500/mo Gateway plan to unlock.' 
      }, { status: 403 });
    }

    // 2. Parse the Dispatch Request
    const body = await req.json();
    const { operator_id, jurisdiction_code, load_id } = body;

    if (!operator_id || !jurisdiction_code) {
      return NextResponse.json({ error: 'Bad Request: Missing operator_id or jurisdiction_code' }, { status: 400 });
    }

    // 3. Verify Operator's Jurisdiction Compliance
    // We check the master truth table for the requested country/state combination
    const { data: authority, error: authError } = await supabaseAdmin
      .from('hc_global_training_authority')
      .select('status, expiration_date')
      .eq('operator_id', operator_id)
      .eq('jurisdiction_code', jurisdiction_code)
      .single();

    if (authError || !authority) {
      // 4a. HARD BLOCK: Operator has no record in this jurisdiction.
      return NextResponse.json({
        allowed: false,
        reason: 'operator_not_certified',
        message: `Operator ${operator_id} does not hold a valid certification for jurisdiction ${jurisdiction_code}.`,
        resolution_url: `https://haulcommand.com/training/${jurisdiction_code}`
      });
    }

    // Check expiration
    const isExpired = new Date(authority.expiration_date) < new Date();
    if (isExpired || authority.status !== 'certified') {
      // 4b. HARD BLOCK: Certification expired or revoked.
      return NextResponse.json({
        allowed: false,
        reason: 'certification_expired_or_invalid',
        message: `Operator certification for ${jurisdiction_code} expired on ${authority.expiration_date}.`,
        resolution_url: `https://haulcommand.com/training/${jurisdiction_code}/renew`
      });
    }

    // 5. SUCCESS: Operator is verified and cleared for dispatch.
    // Log the successful API check into the analytics engine for usage billing
    await supabaseAdmin.from('hc_enterprise_api_logs').insert({
        enterprise_org_id: org.id,
        operator_id: operator_id,
        load_id: load_id,
        jurisdiction_checked: jurisdiction_code,
        result: 'cleared'
    });

    return NextResponse.json({
      allowed: true,
      operator_id: operator_id,
      jurisdiction_code: jurisdiction_code,
      status: 'verified_active',
      expiration_date: authority.expiration_date,
      message: 'Operator cleared for dispatch.'
    });

  } catch (error: any) {
    console.error('Compliance Gateway Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
