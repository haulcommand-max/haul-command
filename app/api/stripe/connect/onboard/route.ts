import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { operator_id, email } = await req.json()
  if (!operator_id) return NextResponse.json({ error: 'operator_id required' }, { status: 400 })

  // Check if already has an account
  const { data: existing } = await supabase
    .from('hc_stripe_accounts')
    .select('stripe_account_id, charges_enabled')
    .eq('operator_id', operator_id)
    .single()

  let accountId = existing?.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { hc_operator_id: operator_id },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    accountId = account.id

    await supabase.from('hc_stripe_accounts').upsert({
      operator_id,
      stripe_account_id: accountId,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      created_at: new Date().toISOString(),
    }, { onConflict: 'operator_id' })
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?onboard=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?onboard=complete`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
