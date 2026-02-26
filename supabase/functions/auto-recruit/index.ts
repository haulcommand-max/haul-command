import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Auto-Recruit Weak Zones — Edge Function
 * 
 * Detects dead/weak corridors from the supply heatmap and
 * auto-generates recruitment campaigns with unique invite links.
 * 
 * Trigger via: POST /functions/v1/auto-recruit
 */

function generateInviteCode(corridorName: string): string {
    const slug = corridorName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8)
    const rand = Math.random().toString(36).slice(2, 6)
    return `hc-${slug}-${rand}`
}

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const baseUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://haulcommand.com'

        // ── Step 1: Refresh the materialized view ──
        await supabase.rpc('refresh_corridor_supply_heatmap').catch(() => {
            // Fallback: the view might not have the refresh RPC, that's OK
            console.warn('Materialized view refresh skipped (no RPC available)')
        })

        // ── Step 2: Find weak/dead zones without active campaigns ──
        const { data: weakZones } = await supabase
            .from('corridor_supply_heatmap')
            .select('corridor_id, corridor_name, supply_tier, available_escorts, recent_fill_failures')
            .in('supply_tier', ['dead_zone', 'weak'])

        if (!weakZones || weakZones.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                campaigns_created: 0,
                message: 'All corridors have adequate supply'
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        // ── Step 3: Check for existing active campaigns ──
        const corridorIds = weakZones.map(z => z.corridor_id)
        const { data: existingCampaigns } = await supabase
            .from('recruit_campaigns')
            .select('corridor_id')
            .in('corridor_id', corridorIds)
            .eq('status', 'active')

        const existingSet = new Set((existingCampaigns || []).map(c => c.corridor_id))
        const newZones = weakZones.filter(z => !existingSet.has(z.corridor_id))

        if (newZones.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                campaigns_created: 0,
                message: 'All weak zones already have active campaigns'
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        // ── Step 4: Create campaign records ──
        const campaigns = newZones.map(zone => {
            const inviteCode = generateInviteCode(zone.corridor_name)
            return {
                corridor_id: zone.corridor_id,
                corridor_name: zone.corridor_name,
                supply_tier: zone.supply_tier,
                invite_code: inviteCode,
                invite_url: `${baseUrl}/referral?code=${inviteCode}&corridor=${encodeURIComponent(zone.corridor_name)}`,
                source: 'auto',
                status: 'active'
            }
        })

        const { data: created, error: insertErr } = await supabase
            .from('recruit_campaigns')
            .insert(campaigns)
            .select('id, corridor_name, supply_tier, invite_code')

        if (insertErr) {
            throw insertErr
        }

        return new Response(JSON.stringify({
            success: true,
            campaigns_created: created?.length || 0,
            campaigns: created,
            weak_zones_total: weakZones.length,
            already_covered: existingSet.size
        }), { headers: { 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('Auto-recruit error:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
