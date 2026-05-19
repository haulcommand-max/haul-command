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

    const { amount, currency = 'usd', load_id, description } = await req.json()
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: 'valid amount required' }, { status: 400 })
    }

    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      setup_future_usage: 'off_session',
      metadata: { operator_id: user.id, load_id, description },
      description,
    })

    const { error } = await supabase.from('hc_payment_intents').insert({
      stripe_payment_intent_id: pi.id,
      amount,
      currency,
      operator_id: user.id,
      load_id,
      status: pi.status,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[payments/intent] insert failed:', error)
      return NextResponse.json({ error: 'Payment intent recording failed' }, { status: 500 })
    }

    return NextResponse.json({ client_secret: pi.client_secret })
  } catch (error) {
    console.error('[payments/intent] failed:', error)
    return NextResponse.json({ error: 'Payment intent failed' }, { status: 500 })
  }
}
