import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/motive/oauth'
import { syncDrivers, syncVehicles } from '@/lib/motive/sync'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?motive=error`)
  }

  try {
    const { operatorId } = await exchangeCodeForTokens(code, state)

    // Kick off initial sync
    const [driverCount, vehicleCount] = await Promise.all([
      syncDrivers(operatorId),
      syncVehicles(operatorId),
    ])

    // Mark operator ELD verified
    await supabase.from('hc_claims')
      .update({ eld_verified: true, updated_at: new Date().toISOString() })
      .eq('operator_id', operatorId)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?motive=connected&drivers=${driverCount}&vehicles=${vehicleCount}`
    )
  } catch (err) {
    console.error('Motive OAuth callback error:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?motive=error`)
  }
}
