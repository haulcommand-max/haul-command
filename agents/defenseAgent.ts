import { createClient } from '@supabase/supabase-js';

// Execute the agent via node, no bundler needed
const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("Missing SUPABASE ENV keys required for Defense Agent");
  process.exit(1);
}

const supabase = createClient(URL, KEY);

/**
 * 🤖 AGENT-DRIVEN DEFENSE LOOP
 * Scans the last 15 minutes of traffic in `request_log`
 * Groups by IP and identifies aggressive scrape signatures.
 * Pushes aggressive IPs to the `blocked_ips` table dynamically.
 */
export async function runDefenseAgent() {
  console.log("🛡️ Running Defense Agent heuristics...");

  // Capture logs from the last 15 minutes
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: logs, error } = await supabase
    .from("request_log")
    .select("*")
    .gte('created_at', fifteenMinsAgo)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error || !logs) {
    console.error("Failed to query request_log:", error);
    return;
  }

  const ipCounts: Record<string, { total: number, bots: number }> = {};

  // Analyze request velocity and known bot signatures
  logs.forEach((log) => {
    if (!ipCounts[log.ip]) {
      ipCounts[log.ip] = { total: 0, bots: 0 };
    }
    ipCounts[log.ip].total += 1;
    if (log.is_bot) ipCounts[log.ip].bots += 1;
  });

  let blockedCount = 0;

  for (const ip in ipCounts) {
    const metrics = ipCounts[ip];
    let reason = null;

    // RULE 1: Velocity Rule -> > 150 requests in 15 minutes
    if (metrics.total >= 150) {
      reason = `Excessive scrape velocity (${metrics.total} reqs in 15m)`;
    } 
    // RULE 2: Aggressive Bot Rule -> > 20 requests with a bot UA
    else if (metrics.bots >= 20) {
      reason = `Aggressive Bot User-Agent detection footprint (${metrics.bots} reqs)`;
    }

    if (reason) {
      // Add to blocked_ips if not already there
      const res = await supabase.from("blocked_ips").upsert({
        ip,
        reason: reason
      }, { onConflict: 'ip' });
      
      if (!res.error) {
         console.log(`🚫 BANNED IP [${ip}] -> ${reason}`);
         blockedCount++;
      }
    }
  }

  console.log(`✅ Defense scan complete. Banned ${blockedCount} new hostile IPs.`);
}

// Support direct execution via Node
if (require.main === module) {
  runDefenseAgent().catch(console.error);
}
