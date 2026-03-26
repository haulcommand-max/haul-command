import { NextRequest, NextResponse, NextFetchEvent } from "next/server"

// Edge runtime safe imports
export const config = {
  // Only apply to API routes (scraping targets). Add more paths if needed.
  matcher: ['/api/:path*'],
};

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const ua = req.headers.get("user-agent") || ""

  // basic bot detection based on headless agents
  const isBot =
    ua.includes("Headless") ||
    ua.includes("Python") ||
    ua.includes("curl") ||
    ua.includes("scrapy") ||
    ua.includes("bot") ||
    ua.includes("spider")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return NextResponse.next();

  // 1. Block known bad IPs
  // We query PostgREST directly (Vercel Edge-compatible)
  try {
    const blockedRes = await fetch(`${supabaseUrl}/rest/v1/blocked_ips?select=id&ip=eq.${encodeURIComponent(ip)}`, {
      method: "GET",
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      signal: AbortSignal.timeout(800)
    });
    
    if (blockedRes.ok) {
      const blockedData = await blockedRes.json();
      if (blockedData.length > 0) {
         // Auto-ban response
         return new NextResponse("Blocked by Anti-Gravity Defense System.", { status: 403 })
      }
    }
  } catch (e) {
    // Fail open if the query times out or fails (so site doesn't crash)
  }

  // Vercel Edge IP Geolocation (Zero latency or cost)
  const country = req.headers.get("x-vercel-ip-country") || "US";
  const city = req.headers.get("x-vercel-ip-city") || "Unknown";
  
  // Try to parse headers safely or default to null
  const latStr = req.headers.get("x-vercel-ip-latitude");
  const lngStr = req.headers.get("x-vercel-ip-longitude");
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  // 2. Log request (Fire-and-forget using waitUntil to not slow down the response)
  ev.waitUntil(
    fetch(`${supabaseUrl}/rest/v1/request_log`, {
      method: "POST",
      body: JSON.stringify({
        ip,
        user_agent: ua,
        path: req.nextUrl.pathname,
        is_bot: isBot,
        country,
        city,
        latitude,
        longitude
      }),
      headers: { 
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      }
    }).catch(() => {})
  );

  // 3. Tarpit known aggressive bots heavily
  if (isBot) {
    // Artificial latency (Honeypot/Tarpitting strategy)
    // Next.js Vercel free tier may timeout at 10s. We add 1.5s delay.
    await new Promise((r) => setTimeout(r, 1500))
  }

  return NextResponse.next()
}
