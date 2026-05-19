import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email } = await req.json().catch(() => ({}))
    const operatorId = user.id

    // Check if already has an account
    const { data: existing } = await supabase
      .from('hc_stripe_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('operator_id', operatorId)
      .single()

    let accountId = existing?.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: email || user.email || undefined,
        metadata: { hc_operator_id: operatorId },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      accountId = account.id

      const { error } = await supabase.from('hc_stripe_accounts').upsert({
        operator_id: operatorId,
        stripe_account_id: accountId,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        created_at: new Date().toISOString(),
      }, { onConflict: 'operator_id' })

      if (error) {
        console.error('[stripe/connect/onboard] upsert failed:', error)
        return NextResponse.json({ error: 'Connect account recording failed' }, { status: 500 })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.haulcommand.com'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/payments?onboard=refresh`,
      return_url: `${baseUrl}/dashboard/payments?onboard=complete`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('[stripe/connect/onboard] failed:', error)
    return NextResponse.json({ error: 'Connect onboarding failed' }, { status: 500 })
  }
}
