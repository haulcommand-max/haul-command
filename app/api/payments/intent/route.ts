import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { amount, currency = 'usd', operator_id, load_id, description } = await req.json()

  const pi = await stripe.paymentIntents.create({
    amount,
    currency,
    setup_future_usage: 'off_session',
    metadata: { operator_id, load_id, description },
    description,
  })

  await supabase.from('hc_payment_intents').insert({
    stripe_payment_intent_id: pi.id,
    amount,
    currency,
    operator_id,
    load_id,
    status: pi.status,
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ client_secret: pi.client_secret })
}
