import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { partner, userId, source, url } = await req.json();
    if (!partner) return NextResponse.json({ error: 'partner required' }, { status: 400 });

    // In production, persist to Supabase affiliate_clicks table
    // For now, log and acknowledge
    console.log(`[affiliate] click: ${partner} from ${source || 'direct'} user=${userId || 'anon'}`);

    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ error: 'tracking failed' }, { status: 500 });
  }
}
