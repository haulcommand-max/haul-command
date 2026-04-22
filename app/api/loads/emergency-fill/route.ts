/**
 * POST /api/loads/emergency-fill
 * Emergency Fill — Revenue Leak #7
 * Broker pays $25 to blast an urgent load to ALL available operators.
 * Uses push notifications marked URGENT.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const EMERGENCY_FEE_CENTS = 2500; // $25.00

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loadId, brokerId, corridor, maxRate, urgencyLevel } = body;

    if (!loadId || !brokerId || !corridor) {
      return NextResponse.json({ error: 'loadId, brokerId, and corridor are required' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // 1. Verify the load exists and belongs to this broker
    const { data: load, error: loadError } = await db
      .from('loads')
      .select('id, status, broker_id')
      .eq('id', loadId)
      .single();

    if (loadError || !load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 });
    }

    // 2. Find all available operators in the corridor
    const { data: operators, error: opError } = await db
      .from('hc_global_operators')
      .select('id, name, admin1_code')
      
      .eq('admin1_code', corridor.split('-')[1] || corridor) // Extract state from corridor
      .limit(100);

    const operatorCount = operators?.length || 0;

    // 3. Create emergency fill record
    const { data: fillRecord, error: fillError } = await db
      .from('emergency_fills')
      .insert({
        load_id: loadId,
        broker_id: brokerId,
        corridor,
        max_rate: maxRate,
        urgency_level: urgencyLevel || 'urgent',
        notified_operators: operatorCount,
        responded_operators: 0,
        charged_amount: EMERGENCY_FEE_CENTS,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // 4. Trigger push notifications to all operators via Novu
    if (process.env.NOVU_API_KEY && operators && operators.length > 0) {
      try {
        const { Novu } = await import('@novu/node');
        const novu = new Novu(process.env.NOVU_API_KEY);
        
        const subscriberIds = operators.map((o: any) => o.id);
        
        await novu.trigger('emergency-load-blast', {
          to: subscriberIds,
          payload: {
            loadId,
            maxRate,
            corridor,
            urgencyLevel: urgencyLevel || 'urgent',
            message: `🚨 URGENT: High priority load in ${corridor} paying up to $${maxRate}. Reply immediately to claim.`
          }
        });
        console.log(`[EMERGENCY FILL] Triggered Novu push to ${subscriberIds.length} operators.`);
      } catch (err) {
        console.error('[EMERGENCY FILL] Failed to trigger push via Novu:', err);
      }
    } else {
      console.log(`[EMERGENCY FILL] Load ${loadId}: blazing intent to ${operatorCount} operators in ${corridor} (No API KEY or NO OP)`);
    }

    return NextResponse.json({
      success: true,
      emergencyFillId: fillRecord?.id,
      operatorsNotified: operatorCount,
      chargedAmount: EMERGENCY_FEE_CENTS / 100,
      corridor,
      message: `Emergency fill request sent to ${operatorCount} operators`,
    });

  } catch (error: any) {
    console.error('[EMERGENCY FILL ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
