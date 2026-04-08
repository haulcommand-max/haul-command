import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET  /v1/skills/{skill_key} — Get skill detail with contracts
// POST /v1/skills/{skill_key}/run — Execute a skill
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
    _req: NextRequest,
    { params }: { params: { skill_key: string } },
) {
    try {
        const db = supabase();
        const { skill_key } = params;

        const { data: skill, error } = await db
            .from('hc_skills')
            .select('*')
            .eq('skill_key', skill_key)
            .single();

        if (error || !skill) {
            return NextResponse.json({ error: `Skill '${skill_key}' not found` }, { status: 404 });
        }

        // Fetch input/output contracts if they exist
        const { data: inputContract } = await db
            .from('hc_skill_input_contracts')
            .select('contract')
            .eq('skill_id', skill.id)
            .maybeSingle();

        const { data: outputContract } = await db
            .from('hc_skill_output_contracts')
            .select('contract')
            .eq('skill_id', skill.id)
            .maybeSingle();

        return NextResponse.json({
            skill_key: skill.skill_key,
            display_name: skill.display_name,
            description: skill.description,
            operating_group: skill.operating_group,
            skill_type: skill.skill_type,
            is_enabled: skill.is_enabled,
            version: skill.version,
            cost_tier: skill.cost_tier,
            input_contract: inputContract?.contract || null,
            output_contract: outputContract?.contract || null,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
