import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const operator_id = req.nextUrl.searchParams.get('operator_id')
  if (!operator_id) return NextResponse.json({ error: 'operator_id required' }, { status: 400 })

  const { data } = await supabase
    .from('hc_stripe_accounts')
    .select('*')
    .eq('operator_id', operator_id)
    .single()

  if (!data) return NextResponse.json({ connected: false })

  const liveAccount = await stripe.accounts.retrieve(data.stripe_account_id)

  // Sync latest status back to DB
  await supabase.from('hc_stripe_accounts').upsert({
    operator_id,
    stripe_account_id: data.stripe_account_id,
    charges_enabled: liveAccount.charges_enabled,
    payouts_enabled: liveAccount.payouts_enabled,
    details_submitted: liveAccount.details_submitted,
    requirements: liveAccount.requirements,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'operator_id' })

  return NextResponse.json({
    connected: true,
    charges_enabled: liveAccount.charges_enabled,
    payouts_enabled: liveAccount.payouts_enabled,
    requirements: liveAccount.requirements?.currently_due ?? [],
  })
}
