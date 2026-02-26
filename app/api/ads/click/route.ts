export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createHash } from 'crypto';

/**
 * POST /api/ads/click — Records ad click with fraud signals
 * 
 * Feeds Layer 5 fraud pipeline:
 * - IP hash for reputation tracking
 * - User agent hash for bot detection
 * - Session ID for anomaly scoring
 * - Deduplicates: 1 click per user per creative per hour
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { creative_id, placement_id, session_id } = body;

        if (!creative_id || !placement_id) {
            return NextResponse.json({ error: 'Missing creative_id or placement_id' }, { status: 400 });
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Extract fraud signals from request
        const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
        const ip = forwarded.split(',')[0]?.trim() || 'unknown';
        const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);
        const userAgent = req.headers.get('user-agent') || '';
        const uaHash = createHash('sha256').update(userAgent).digest('hex').slice(0, 16);

        // ── Layer 5: Quick fraud checks before recording ──

        // 1. Bot heuristic: no user-agent = likely bot
        if (!userAgent || userAgent.length < 10) {
            // Record but flag
            await supabase.from('ad_traffic_events').insert({
                event_type: 'click',
                creative_id,
                placement_id,
                user_id: user?.id || null,
                ip_hash: ipHash,
                user_agent_hash: uaHash,
                session_id: session_id || null,
                is_valid: false,
                fraud_reason: 'bot_no_ua',
            });
            return NextResponse.json({ recorded: false, reason: 'invalid' });
        }

        // 2. IP reputation check
        const { data: ipRep } = await supabase
            .from('ad_ip_reputation')
            .select('is_blocked, reputation_score')
            .eq('ip_hash', ipHash)
            .maybeSingle();

        if (ipRep?.is_blocked) {
            await supabase.from('ad_traffic_events').insert({
                event_type: 'click',
                creative_id,
                placement_id,
                user_id: user?.id || null,
                ip_hash: ipHash,
                user_agent_hash: uaHash,
                session_id: session_id || null,
                is_valid: false,
                fraud_reason: 'blocked_ip',
            });
            return NextResponse.json({ recorded: false, reason: 'blocked' });
        }

        // 3. Rapid click detection: check for click on same creative within 5 seconds
        const fiveSecsAgo = new Date(Date.now() - 5000).toISOString();
        const { data: recentRapid } = await supabase
            .from('ad_traffic_events')
            .select('id')
            .eq('creative_id', creative_id)
            .eq('event_type', 'click')
            .or(`user_id.eq.${user?.id || ''},ip_hash.eq.${ipHash}`)
            .gt('occurred_at', fiveSecsAgo)
            .limit(1);

        if (recentRapid && recentRapid.length > 0) {
            await supabase.from('ad_traffic_events').insert({
                event_type: 'click',
                creative_id,
                placement_id,
                user_id: user?.id || null,
                ip_hash: ipHash,
                user_agent_hash: uaHash,
                session_id: session_id || null,
                is_valid: false,
                fraud_reason: 'rapid_click',
            });
            return NextResponse.json({ recorded: false, reason: 'duplicate' });
        }

        // 4. Hourly dedup (billing dedup, not fraud)
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const { data: recent } = await supabase
            .from('ad_clicks')
            .select('id')
            .eq('creative_id', creative_id)
            .eq('user_id', user?.id || '')
            .gt('clicked_at', oneHourAgo)
            .limit(1);

        if (recent && recent.length > 0) {
            return NextResponse.json({ recorded: false, reason: 'hourly_dedup' });
        }

        // ── Record valid click ──
        await supabase.from('ad_clicks').insert({
            creative_id,
            placement_id,
            user_id: user?.id || null,
        });

        // Record traffic event (valid)
        await supabase.from('ad_traffic_events').insert({
            event_type: 'click',
            creative_id,
            placement_id,
            user_id: user?.id || null,
            ip_hash: ipHash,
            user_agent_hash: uaHash,
            session_id: session_id || null,
            fraud_score: ipRep?.reputation_score ? Math.max(0, 100 - (ipRep.reputation_score || 50)) : 0,
            is_valid: true,
        });

        // Update IP reputation: last_seen
        await supabase.from('ad_ip_reputation').upsert({
            ip_hash: ipHash,
            last_seen_at: new Date().toISOString(),
            total_events: 1,
        }, { onConflict: 'ip_hash' });

        return NextResponse.json({ recorded: true });
    } catch (error) {
        console.error('Ad click error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
