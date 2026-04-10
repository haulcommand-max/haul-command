-- HAUL COMMAND TRAINING OS, COMPLIANCE, AND REPORT CARD SCHEMA (v1)

CREATE TABLE IF NOT EXISTS hc_training_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    primary_role text,
    secondary_roles text[],
    home_country_code text DEFAULT 'US',
    home_region_code text,
    active_market_codes text[],
    availability_status text DEFAULT 'OFFLINE',
    first_job_goal_date timestamptz,
    accelerator_enrolled_at timestamptz,
    accelerator_phase text DEFAULT 'Launch',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_report_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    profile_completeness int DEFAULT 0,
    training_completion_percent int DEFAULT 0,
    first_14_day_percent int DEFAULT 0,
    starter_packet_status text DEFAULT 'INCOMPLETE',
    broker_ready_status text DEFAULT 'NOT_READY',
    readiness_score numeric DEFAULT 0,
    trust_score numeric DEFAULT 0,
    packet_completeness_score numeric DEFAULT 0,
    response_quality_score numeric DEFAULT 0,
    current_rank_slug text DEFAULT 'rookie',
    current_certificate_tier text DEFAULT 'none',
    next_best_actions jsonb DEFAULT '[]',
    last_diagnostic_summary jsonb DEFAULT '{}',
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_career_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    hall_command_id text UNIQUE NOT NULL,
    display_name text,
    badges jsonb DEFAULT '[]',
    certificates jsonb DEFAULT '[]',
    specializations jsonb DEFAULT '[]',
    training_hours numeric DEFAULT 0,
    jobs_completed int DEFAULT 0,
    markets_active int DEFAULT 0,
    career_milestones jsonb DEFAULT '[]',
    share_slug text UNIQUE,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_accelerator_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    phase text,
    event_payload jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_diagnostics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    opportunity_ref text,
    diagnostic_type text,
    likely_reason text,
    recommended_fix text,
    linked_module_slug text,
    linked_upgrade_slug text,
    severity text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    certificate_type text,
    tier text,
    country_code text,
    track_slug text,
    issued_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    verification_slug text UNIQUE,
    metadata jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS hc_training_country_overlays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code text NOT NULL,
    region_code text,
    authority_type text,
    authority_name text,
    local_terminology jsonb DEFAULT '{}',
    requirements jsonb DEFAULT '{}',
    notes jsonb DEFAULT '{}',
    version int DEFAULT 1,
    last_verified_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_training_lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_slug text NOT NULL,
    module_slug text NOT NULL,
    lesson_slug text NOT NULL,
    title text NOT NULL,
    free_or_paid text DEFAULT 'free',
    video_url text,
    transcript text,
    lesson_markdown text,
    downloadables jsonb DEFAULT '[]',
    visual_assets jsonb DEFAULT '[]',
    country_overlay_supported boolean DEFAULT true,
    faq jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS hc_training_user_lesson_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id uuid REFERENCES hc_training_lessons(id),
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    progress_percent int DEFAULT 0,
    notes jsonb DEFAULT '{}'
);
