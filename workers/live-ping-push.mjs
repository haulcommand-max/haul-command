#!/usr/bin/env node
/**
 * Haul Command — Live Ping Push Notification Worker
 * 
 * Processes pending live ping notifications from hc_live_ping_notifications.
 * For each pending notification:
 * 1. Finds brokers/dispatchers within the radius who have push tokens
 * 2. Sends Firebase Cloud Messaging push notifications
 * 3. Updates the notification status to 'sent' or 'failed'
 * 
 * Usage:
 *   node workers/live-ping-push.mjs
 *   node workers/live-ping-push.mjs --dry-run
 *   node workers/live-ping-push.mjs --poll  (continuous polling mode)
 * 
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   FIREBASE_SERVICE_ACCOUNT_JSON (base64 encoded)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const POLL_MODE = args.includes('--poll');
const POLL_INTERVAL_MS = 5000; // 5 seconds

/**
 * Find push token recipients within radius of the operator
 */
async function findNearbyRecipients(lat, lng, radiusMiles) {
  if (!lat || !lng) return [];
  
  // Find users with push tokens who have recent activity in the area
  const { data: tokens } = await supabase
    .from('hc_push_subscriptions')
    .select('user_id, fcm_token, platform')
    .eq('is_active', true)
    .not('fcm_token', 'is', null);
  
  // For now, return all active push subscribers
  // Future: filter by lat/lng proximity using a spatial query
  return tokens || [];
}

/**
 * Send Firebase Cloud Messaging push notification
 */
async function sendFCMPush(fcmToken, payload) {
  const FIREBASE_KEY = process.env.FIREBASE_SERVER_KEY;
  
  if (!FIREBASE_KEY) {
    console.log('    ⚠ FIREBASE_SERVER_KEY not set, skipping FCM push');
    return false;
  }
  
  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FIREBASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-72.png',
          click_action: payload.url || 'https://www.haulcommand.com/directory',
          tag: `live-ping-${payload.operatorId}`,
        },
        data: {
          type: 'operator_went_live',
          operator_id: payload.operatorId,
          operator_name: payload.operatorName,
          lat: String(payload.lat || ''),
          lng: String(payload.lng || ''),
        },
        // Collapse duplicate pings from same operator
        collapse_key: `live-${payload.operatorId}`,
        // TTL: 30 minutes (live ping expires fast)
        time_to_live: 1800,
      }),
    });
    
    return res.ok;
  } catch (err) {
    console.error(`    ❌ FCM error: ${err.message}`);
    return false;
  }
}

/**
 * Process one batch of pending notifications
 */
async function processPendingNotifications() {
  const { data: pending, error } = await supabase
    .from('hc_live_ping_notifications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);
  
  if (error) {
    console.error('❌ Failed to fetch pending notifications:', error.message);
    return 0;
  }
  
  if (!pending || pending.length === 0) return 0;
  
  let processed = 0;
  
  for (const notif of pending) {
    console.log(`\n📡 Processing: ${notif.operator_name} went live`);
    console.log(`   Location: ${notif.operator_lat}, ${notif.operator_lng}`);
    console.log(`   Radius: ${notif.radius_miles} miles`);
    
    if (DRY_RUN) {
      console.log('   ⏭ SKIP (dry run)');
      processed++;
      continue;
    }
    
    try {
      // Find nearby recipients
      const recipients = await findNearbyRecipients(
        notif.operator_lat,
        notif.operator_lng,
        notif.radius_miles
      );
      
      console.log(`   📬 Found ${recipients.length} push subscribers`);
      
      if (recipients.length === 0) {
        await supabase
          .from('hc_live_ping_notifications')
          .update({ status: 'skipped', sent_at: new Date().toISOString(), recipients: 0 })
          .eq('id', notif.id);
        processed++;
        continue;
      }
      
      // Send push to each recipient
      let sent = 0;
      for (const recipient of recipients) {
        const success = await sendFCMPush(recipient.fcm_token, {
          title: `🟢 ${notif.operator_name} is Available Now`,
          body: `An escort operator just went live near your area. Tap to view their profile and book directly.`,
          url: `https://www.haulcommand.com/directory`,
          operatorId: notif.operator_id,
          operatorName: notif.operator_name,
          lat: notif.operator_lat,
          lng: notif.operator_lng,
        });
        if (success) sent++;
      }
      
      // Update notification status
      await supabase
        .from('hc_live_ping_notifications')
        .update({
          status: sent > 0 ? 'sent' : 'failed',
          sent_at: new Date().toISOString(),
          recipients: sent,
        })
        .eq('id', notif.id);
      
      console.log(`   ✅ Sent to ${sent}/${recipients.length} recipients`);
      processed++;
      
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      await supabase
        .from('hc_live_ping_notifications')
        .update({ status: 'failed', sent_at: new Date().toISOString() })
        .eq('id', notif.id);
      processed++;
    }
  }
  
  return processed;
}

// ─── Main ──────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Haul Command — Live Ping Push Worker');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${POLL_MODE ? ' (polling)' : ''}`);
  console.log('═══════════════════════════════════════════');
  
  if (POLL_MODE) {
    console.log(`\n  Polling every ${POLL_INTERVAL_MS / 1000}s for new live pings...\n`);
    while (true) {
      const count = await processPendingNotifications();
      if (count > 0) console.log(`  Batch complete: ${count} processed`);
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
  } else {
    const count = await processPendingNotifications();
    console.log(`\n  Total processed: ${count}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
