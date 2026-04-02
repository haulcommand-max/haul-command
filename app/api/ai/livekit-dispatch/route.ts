import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  // CRON job endpoint hitting here daily to dispatch LiveKit calls.
  
  // Basic security, require an auth secret for chron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized dispatch attempt' }, { status: 401 });
  }

  const supabase = createClient();
  
  // 1. Target the incubated (90-day wait) operator profiles
  const { data: readyOperators, error } = await supabase
    .from('vw_livekit_dispatch_ready')
    .select('*')
    .limit(100);

  if (error || !readyOperators) {
    return NextResponse.json({ error: 'Failed to access maturation queue' }, { status: 500 });
  }

  const dispatchResults = [];

  // 2. Dispatch calls via LiveKit AI
  for (const op of readyOperators) {
    try {
      // Logic for LiveKit SIP routing
      const liveKitEndpoint = process.env.LIVEKIT_API_URL + '/twirp/livekit.Egress/StartOutboundCall';
      
      const res = await fetch(liveKitEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LIVEKIT_API_KEY}`
        },
        body: JSON.stringify({
          phoneNumber: op.phone_normalized,
          context: {
            variables: {
              target_name: op.name,
              target_city: op.city,
              known_reviews: op.review_count,
              objective: "verify_availability_and_claim"
            }
          }
        })
      });

      if (res.ok) {
        dispatchResults.push({ id: op.id, status: 'dispatched' });
      } else {
        dispatchResults.push({ id: op.id, status: 'failed_sip' });
      }

      // Small delay between calls
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      dispatchResults.push({ id: op.id, status: 'exception' });
    }
  }

  return NextResponse.json({ 
    success: true, 
    dispatchedCount: dispatchResults.length,
    matrix: dispatchResults 
  });
}
