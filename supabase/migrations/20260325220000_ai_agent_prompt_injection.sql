-- ================================================================================
-- Migration: 20260325220000_ai_agent_prompt_injection.sql
-- Description: Injects the dynamic Cole Gordon / Alex Becker voice prompts and 
--              follow-up timelines into Supabase. (Upgrades existing missing_tables)
-- ================================================================================

-- Create specific matrix for LLM Prompts if it doesn't exist from the earlier Vapi sprint
CREATE TABLE IF NOT EXISTS public.hc_ai_voice_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_name VARCHAR(100) NOT NULL,
    country_codes TEXT[] NOT NULL,
    elevenlabs_voice_id VARCHAR(255) NOT NULL,
    system_prompt TEXT NOT NULL,
    objection_matrix JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hc_follow_up_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_trigger INTEGER NOT NULL,
    contact_method VARCHAR(50) NOT NULL, -- 'SMS_NOVU' or 'VOICE_LIVEKIT'
    psychological_angle VARCHAR(255) NOT NULL,
    script_template TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the "Mack" US Persona
INSERT INTO public.hc_ai_voice_personas (persona_name, country_codes, elevenlabs_voice_id, system_prompt, objection_matrix)
VALUES (
    'Mack (US/CA Heavy Haul Dispatch)',
    ARRAY['+1'],
    'elevenlabs_mack_usa_texas',
    'You are Mack, a tired but professional dispatcher. Use takeaway psychology. Never say "buy" or "subscribe".',
    '{"robot": "Laugh and deny. Say you are just dialing through the system.", "cost": "It is completely free to verify."}'
) ON CONFLICT DO NOTHING;

-- Seed the Follow-Up Sequence (Day 14, 17, 30, 60)
INSERT INTO public.hc_follow_up_matrix (day_trigger, contact_method, psychological_angle, script_template)
VALUES 
    (14, 'SMS_NOVU', 'Proof of Value', 'Your verified profile received {views} views. Verify to unlock.'),
    (17, 'VOICE_LIVEKIT', 'Urgent Loss Aversion', 'Hey I texted you 3 days ago. Verify tonight or lose rank.'),
    (30, 'SMS_NOVU', 'FOMO Proof', 'A ${escrow_amount} load just cleared in your county. You missed it.'),
    (60, 'VOICE_LIVEKIT', 'The Takeaway (Becker)', 'Pulling your priority status today. Ignore if retired.')
ON CONFLICT DO NOTHING;
