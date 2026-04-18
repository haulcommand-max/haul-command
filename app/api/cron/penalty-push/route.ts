import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPush } from '@/lib/push-admin';

// Task 10: Impending Penalty Push Engine
// Runs daily. Finds all hc_global_training_authority records exactly 7 days from expiration.
// Task 11: Realtime Presence Ghosting Purge

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Check authorization via chron header or bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow bypass for internal test environments but not production
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized CRON execution' }, { status: 401 });
      }
  }

  const results = {
    penalty_warnings_sent: 0,
    ghosted_drivers_purged: 0,
    errors: [] as string[]
  };

  try {
    // ============================================================================
    // PART 1: Impending Penalty Push Engine (Task 10)
    // ============================================================================
    // Calculate the target timestamp (exactly 7 days from now)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    // Convert to ISO strings for Date range matching
    const startOfTargetDay = new Date(sevenDaysFromNow.setHours(0,0,0,0)).toISOString();
    const endOfTargetDay = new Date(sevenDaysFromNow.setHours(23,59,59,999)).toISOString();

    // Query 120-country global authority table for expiring certificates
    const { data: expiringAuths, error: authError } = await supabaseAdmin
      .from('hc_global_training_authority')
      .select('operator_id, jurisdiction_code, expiration_date')
      .gte('expiration_date', startOfTargetDay)
      .lte('expiration_date', endOfTargetDay)
      .eq('status', 'certified');

    if (authError) throw new Error(`Auth Query Error: ${authError.message}`);

    if (expiringAuths && expiringAuths.length > 0) {
      // Find FCM Push Tokens for these operators
      const operatorIds = [...new Set(expiringAuths.map(a => a.operator_id))];
      
      const { data: subscribers, error: pushError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('user_id, fcm_token')
        .in('user_id', operatorIds)
        .eq('bad_token', false);
        
      if (!pushError && subscribers) {
        // Map tokens by user ID for quick lookup
        const tokenMap = new Map();
        subscribers.forEach(sub => {
            if (!tokenMap.has(sub.user_id)) tokenMap.set(sub.user_id, []);
            tokenMap.get(sub.user_id).push(sub.fcm_token);
        });

        // Loop through expiring records and dispatch FCM notifications
        for (const auth of expiringAuths) {
            const tokens = tokenMap.get(auth.operator_id) || [];
            for (const token of tokens) {
                const sent = await sendPush({
                    token,
                    title: '⚠️ Imminent Ranking Penalty',
                    body: `Your ${auth.jurisdiction_code} certification expires in 7 days. You will lose +35 Trust Score and Enterprise Load Board access. Tap to renew now.`,
                    data: {
                        type: 'penalty_warning',
                        jurisdiction: auth.jurisdiction_code,
                        action_url: `/dashboard/training/${auth.jurisdiction_code}/renew`
                    }
                });
                
                if (sent) results.penalty_warnings_sent++;
            }
        }
      }
    }

    // ============================================================================
    // PART 2: Realtime Presence Ghosting Purge (Task 11)
    // ============================================================================
    // Identify operators who are showing as "Available Now" but haven't sent a realtime heartbeat in > 15 minutes.
    // In actual Firebase Realtime DB this operates on onDisconnect(), but as a DB cleanup measure here:
    
    // Wait, the Firebase RTDB handles the immediate ping logic, but we must purge Supabase radar.
    const staleThreshold = new Date();
    staleThreshold.setMinutes(staleThreshold.getMinutes() - 15);

    const { data: purgedDrivers, error: purgeError } = await supabaseAdmin
        .from('hc_operator_locations')
        .update({ radar_status: 'offline' })
        .eq('radar_status', 'available')
        .lt('last_heartbeat_at', staleThreshold.toISOString())
        .select('operator_id');
        
    if (purgeError) throw new Error(`Ghosting Purge Error: ${purgeError.message}`);
    
    if (purgedDrivers) {
        results.ghosted_drivers_purged = purgedDrivers.length;
    }

    return NextResponse.json({ success: true, results });

  } catch (err: any) {
    results.errors.push(err.message);
    return NextResponse.json({ success: false, results }, { status: 500 });
  }
}
