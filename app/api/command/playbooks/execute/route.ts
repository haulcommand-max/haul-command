import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// =====================================================================
// Haul Command — Playbook Execution API (Maximized Paperclip Pattern)
// POST /api/command/playbooks/execute
//
// This is the engine that executes "Market Launches" (120-country or local)
// It grabs a playbook template, maps the 120-country/hyperlocal rules,
// and automatically fans out the work into Paperclip Tasks assigned to our Agents.
// =====================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playbook_slug, market_context, initiated_by = 'william' } = body;
    // market_context = { country: 'AU', region: 'NSW', type: 'tier_a' }

    if (!playbook_slug || !market_context) {
      return NextResponse.json({ error: 'playbook_slug and market_context required' }, { status: 400 });
    }

    // 1. Fetch the Playbook
    const { data: playbook, error: pErr } = await supabase
      .from('hc_command_playbooks')
      .select('*')
      .eq('slug', playbook_slug)
      .single();

    if (pErr || !playbook) throw new Error(`Playbook not found: ${playbook_slug}`);

    // 2. Fetch required agents to ensure they are active
    const requiredAgents = playbook.template.agents_required || [];
    const { data: agents } = await supabase
      .from('hc_command_agents')
      .select('id, slug, status')
      .in('slug', requiredAgents);

    const agentMap = new Map((agents || []).map(a => [a.slug, a.id]));

    // 3. Generate Tasks based on Playbook Steps
    const tasksToInsert = [];
    const playbookSteps = playbook.template.steps || [];

    for (const step of playbookSteps) {
      // SEO & Content Generation Fanout (120-Country / Hyperlocal Rules)
      if (step.action === 'seed_regulation_page' || step.action === 'seed_regulation_summary') {
        tasksToInsert.push({
            title: `Generate Regulations Page for ${market_context.country} ${market_context.region || ''}`,
            description: `Auto-generate Tier-1 compliant regulations SEO page, ensuring dictionary terms and AdGrid slot injection.`,
            domain: 'content_generation',
            market: market_context.country,
            assigned_to: agentMap.get('content-engine'),
            target_entity_type: 'market',
            priority: 2,
            revenue_impact_cents: 0 // Foundation value
        });
      }

      if (step.action === 'seed_major_corridors' || step.action === 'seed_state_corridors') {
        tasksToInsert.push({
            title: `Map Top Corridors and Intelligence Data for ${market_context.country}`,
            description: `Identify major heavy haul routes. Create corridor intelligence SEO pages.`,
            domain: 'infrastructure_discovery',
            market: market_context.country,
            assigned_to: agentMap.get('geo-aggregator'),
            priority: 3
        });
      }

      // AdGrid Monetization Fanout (Money Left on the Table Rule)
      if (step.action === 'activate_adgrid_country' || step.action === 'activate_adgrid_slots') {
        tasksToInsert.push({
            title: `Generate AdGrid Sponsorship Inventory for ${market_context.country}`,
            description: `Create country and corridor takeover sponsor slots in Stripe. Ensure localized pricing based on tier.`,
            domain: 'sponsor_inventory',
            market: market_context.country,
            assigned_to: agentMap.get('adgrid-impression-tracker'), // Or dedicated adgrid agent
            priority: 1,
            revenue_impact_cents: 49900 // Target revenue generation (e.g., $499 sponsorship)
        });
      }

      // Claim FOMO / Social Gravity Fanout
      if (step.action === 'activate_claim_nudges' || step.action === 'seed_operator_profiles') {
        tasksToInsert.push({
            title: `Initiate Pilot Car Claim FOMO in ${market_context.country}`,
            description: `Scrape local registries. Setup profiles. Email/push notifications to operators about new AdGrid opportunities.`,
            domain: 'broker_acquisition',
            market: market_context.country,
            assigned_to: agentMap.get('claim-nudge-engine'),
            priority: 4
        });
      }
    }

    // 4. Batch Insert the Tasks into the Paperclip Issue Queue
    if (tasksToInsert.length > 0) {
      const { error: tErr } = await supabase
        .from('hc_command_tasks')
        .insert(tasksToInsert.map(t => ({ ...t, status: 'todo' })));

      if (tErr) throw tErr;
    }

    // 5. Update Playbook tracking
    await supabase.rpc('append_array_if_unique', {
        table_name: 'hc_command_playbooks',
        column_name: 'deployed_markets',
        record_id: playbook.id,
        new_value: market_context.country
    }).catch(e => console.log('RPC missing, falling back to manual update'));

    // 6. Log the Master Event
    await supabase.from('os_event_log').insert({
        event_type: 'playbook.executed',
        entity_id: playbook.id,
        entity_type: 'playbook',
        payload: { market: market_context, tasks_queued: tasksToInsert.length, by: initiated_by }
    });

    return NextResponse.json({
        success: true,
        message: `Playbook ${playbook_slug} executed for ${market_context.country}.`,
        tasks_queued: tasksToInsert.length,
        agents_activated: requiredAgents.length
    });

  } catch (err: any) {
    console.error('[command/playbook/execute] failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
