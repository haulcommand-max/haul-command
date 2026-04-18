-- =====================================================================
-- Haul Command Command Layer: Industry Operating System Schema
-- Generated: 2026-04-12
-- Inspired by: Paperclip (github.com/paperclipai/paperclip) + GSD
-- Purpose: The control-plane tables for the HC Command Layer.
--          Paperclip uses company→agents→issues→heartbeats→approvals→budgets.
--          HC adapts this as: network→markets→agents→workers→heartbeats→
--                             tasks→approvals→runs→proof_packets→money_events.
--
-- UPGRADE PATH: os_event_log remains the canonical event bus.
--               hc_cron_audit remains the cron run tracker.
--               hc_readiness_gates maps to approval gates.
--               hc_content_generation_queue is absorbed into the task system.
--
-- Mode: ADDITIVE ONLY — no existing tables modified.
-- =====================================================================
begin;

-- =====================================================================
-- 1) AGENT REGISTRY
-- Paperclip equivalent: agents table (adapter_type, role, budget, status)
-- HC adaptation: industry-function agents, not generic corporate roles
-- =====================================================================
create table if not exists public.hc_command_agents (
    id              uuid primary key default gen_random_uuid(),
    slug            text not null unique,
    name            text not null,
    -- Industry function, not corporate role
    domain          text not null,
    -- Paperclip adapter_type equivalent: what runtime executes this agent
    adapter_type    text not null default 'worker' check (adapter_type in (
        'worker',       -- deterministic automation (cron, trigger, queue)
        'agent',        -- reasoning layer (Claude, GPT, Gemini)
        'hybrid',       -- worker + agent fallback
        'webhook',      -- external HTTP callback
        'human'         -- human-supervised step
    )),
    -- Agent capabilities description (Paperclip: capabilities field)
    description     text,
    -- Paperclip: reports_to agent_id for org chart
    reports_to      uuid references public.hc_command_agents(id),
    -- Budget: Paperclip tracks monthly cents. HC tracks tokens + business outcomes.
    budget_monthly_cents    integer default 0,
    budget_spent_cents      integer default 0,
    -- HC-specific: business outcome tracking (Paperclip doesn't have this)
    revenue_generated_cents integer default 0,
    leads_generated         integer default 0,
    tasks_completed         integer default 0,
    tasks_failed            integer default 0,
    -- Paperclip: status enum
    status          text not null default 'active' check (status in (
        'active', 'idle', 'running', 'paused', 'error', 'terminated'
    )),
    -- Markets this agent operates in (HC-specific, Paperclip has no geography)
    markets         text[] default '{}',
    -- Config payload (adapter-specific settings)
    config          jsonb default '{}',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_command_agents_domain
    on public.hc_command_agents (domain);

create index if not exists idx_command_agents_status
    on public.hc_command_agents (status)
    where status = 'active';

-- =====================================================================
-- 2) HEARTBEAT DEFINITIONS
-- Paperclip equivalent: heartbeat triggers (schedule, assignment, mention, manual, approval)
-- HC adaptation: market heartbeats, not just agent heartbeats
-- =====================================================================
create table if not exists public.hc_command_heartbeats (
    id              uuid primary key default gen_random_uuid(),
    slug            text not null unique,
    name            text not null,
    -- Which agent owns this heartbeat
    agent_id        uuid references public.hc_command_agents(id),
    -- Paperclip trigger types + HC market triggers
    trigger_type    text not null check (trigger_type in (
        'schedule',         -- periodic timer (like Paperclip)
        'event',            -- os_event_log event match
        'threshold',        -- metric crosses boundary
        'assignment',       -- task assigned (like Paperclip)
        'manual',           -- human clicks invoke (like Paperclip)
        'approval',         -- approval resolved (like Paperclip)
        'market_signal',    -- market state change (HC-specific)
        'webhook'           -- external webhook trigger
    )),
    -- Cron expression for schedule triggers (e.g., '0 */4 * * *' = every 4 hours)
    cron_expression text,
    schedule text,
    expected_interval interval,
    alert_after interval,
    -- Event type filter for event triggers (e.g., 'trust.updated')
    event_filter    text,
    -- Threshold config for threshold triggers
    threshold_config jsonb,
    -- What this heartbeat does when triggered
    action_type     text not null check (action_type in (
        'scan',         -- read-only observation
        'analyze',      -- compute derived state
        'propose',      -- suggest action (needs approval)
        'execute',      -- auto-execute (within guardrails)
        'alert',        -- notify human
        'publish'       -- update public surface
    )),
    -- Guardrails: what this heartbeat is allowed to do
    can_write       boolean default false,
    can_notify      boolean default true,
    can_spend       boolean default false,
    max_spend_cents integer default 0,
    -- Is this heartbeat active?
    enabled         boolean default true,
    -- Last run tracking
    last_run_at     timestamptz,
    last_run_status text,
    run_count       integer default 0,
    created_at      timestamptz not null default now()
);

create index if not exists idx_heartbeats_agent
    on public.hc_command_heartbeats (agent_id);

create index if not exists idx_heartbeats_schedule
    on public.hc_command_heartbeats (cron_expression)
    where trigger_type = 'schedule' and enabled = true;

-- =====================================================================
-- 3) TASK QUEUE
-- Paperclip equivalent: issues table (title, description, status, priority, assignee, parent)
-- HC adaptation: adds market context, proof requirements, money tracking
-- Absorbs hc_content_generation_queue pattern into unified task system
-- =====================================================================
create table if not exists public.hc_command_tasks (
    id              uuid primary key default gen_random_uuid(),
    -- Paperclip: title, description
    title           text not null,
    description     text,
    -- Paperclip: status lifecycle (backlog→todo→in_progress→in_review→done|blocked)
    status          text not null default 'backlog' check (status in (
        'backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled'
    )),
    -- Paperclip: priority (1=highest)
    priority        integer not null default 5 check (priority between 1 and 10),
    -- Paperclip: assignee (one agent at a time — single-assignee, atomic checkout)
    assigned_to     uuid references public.hc_command_agents(id),
    -- Paperclip: parent issue for hierarchy tracing back to company goal
    parent_task_id  uuid references public.hc_command_tasks(id),
    -- HC-specific: which heartbeat created this task
    created_by_heartbeat uuid references public.hc_command_heartbeats(id),
    -- HC-specific: domain and market context (Paperclip has no geography)
    domain          text,
    market          text,           -- e.g., 'US-TX', 'AU', 'I-10 corridor'
    -- HC-specific: target entity (what broker/operator/corridor/page is this about)
    target_entity_type  text,       -- 'broker', 'operator', 'corridor', 'page', 'listing'
    target_entity_id    uuid,
    -- HC-specific: proof requirements
    requires_proof  boolean default false,
    proof_packet_id uuid,
    -- HC-specific: money tracking
    revenue_impact_cents integer default 0,
    cost_cents           integer default 0,
    -- Execution metadata
    attempts        integer default 0,
    max_attempts    integer default 3,
    error_message   text,
    result          jsonb,
    -- Timestamps
    started_at      timestamptz,
    completed_at    timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_command_tasks_status
    on public.hc_command_tasks (status, priority desc, created_at asc)
    where status in ('backlog', 'todo');

create index if not exists idx_command_tasks_assigned
    on public.hc_command_tasks (assigned_to, status)
    where assigned_to is not null;

create index if not exists idx_command_tasks_domain
    on public.hc_command_tasks (domain, market);

create index if not exists idx_command_tasks_parent
    on public.hc_command_tasks (parent_task_id);

-- =====================================================================
-- 4) APPROVAL GATES
-- Paperclip equivalent: governance system (hiring agents, CEO strategy, board overrides)
-- HC adaptation: industry-specific approval rules
-- UPGRADE: hc_readiness_gates already exists — this extends the concept
-- =====================================================================
create table if not exists public.hc_command_approvals (
    id              uuid primary key default gen_random_uuid(),
    -- What triggered this approval request
    task_id         uuid references public.hc_command_tasks(id),
    agent_id        uuid references public.hc_command_agents(id),
    heartbeat_id    uuid references public.hc_command_heartbeats(id),
    -- What kind of approval (Paperclip: hiring, strategy, override)
    approval_type   text not null check (approval_type in (
        'pricing_change',       -- rate/price modification
        'public_publish',       -- content going public
        'customer_comms',       -- outbound message to customer
        'financial_action',     -- payment, refund, recovery
        'compliance_action',    -- permit, regulatory
        'agent_budget_increase',-- Paperclip: budget override
        'agent_hire',           -- Paperclip: hiring approval
        'strategy_change',      -- Paperclip: CEO strategy
        'data_delete',          -- destructive data action
        'market_launch'         -- new market activation
    )),
    -- What is being proposed
    proposal        jsonb not null,
    -- Resolution
    status          text not null default 'pending' check (status in (
        'pending', 'approved', 'rejected', 'expired', 'withdrawn'
    )),
    resolved_by     text,       -- 'william' or 'system_auto' or agent slug
    resolution_note text,
    -- Auto-approve rules
    auto_approve_if jsonb,      -- conditions under which this can auto-approve
    expires_at      timestamptz,
    resolved_at     timestamptz,
    created_at      timestamptz not null default now()
);

create index if not exists idx_approvals_pending
    on public.hc_command_approvals (created_at desc)
    where status = 'pending';

-- =====================================================================
-- 5) RUN LOG
-- Paperclip equivalent: run records (result, costs, session state)
-- HC adaptation: adds business outcome capture
-- UPGRADE: extends hc_cron_audit + hc_edge_execution_log patterns
-- =====================================================================
create table if not exists public.hc_command_runs (
    id              uuid primary key default gen_random_uuid(),
    -- What ran
    agent_id        uuid references public.hc_command_agents(id),
    heartbeat_id    uuid references public.hc_command_heartbeats(id),
    task_id         uuid references public.hc_command_tasks(id),
    -- Paperclip: run result capture
    status          text not null default 'running' check (status in (
        'running', 'completed', 'failed', 'cancelled', 'timeout'
    )),
    -- Paperclip: cost tracking (provider, model, tokens, cost)
    provider        text,           -- 'anthropic', 'openai', 'google', 'worker'
    model           text,           -- 'claude-sonnet-4-6', 'gpt-4o', 'worker'
    input_tokens    integer default 0,
    output_tokens   integer default 0,
    cost_cents      integer default 0,
    -- HC-specific: business outcome capture (Paperclip stops at cost)
    revenue_generated_cents integer default 0,
    leads_generated         integer default 0,
    entities_processed      integer default 0,
    pages_published         integer default 0,
    notifications_sent      integer default 0,
    -- Execution details
    duration_ms     integer,
    result          jsonb,
    error_message   text,
    -- Audit trail
    started_at      timestamptz not null default now(),
    completed_at    timestamptz
);

create index if not exists idx_runs_agent
    on public.hc_command_runs (agent_id, started_at desc);

create index if not exists idx_runs_recent
    on public.hc_command_runs (started_at desc);

-- =====================================================================
-- 6) PROOF PACKETS
-- Paperclip has audit trails. HC needs proof-first operations.
-- This is where HC 15X surpasses Paperclip.
-- =====================================================================
create table if not exists public.hc_command_proof_packets (
    id              uuid primary key default gen_random_uuid(),
    packet_type     text not null check (packet_type in (
        'gps_trace',        -- GPS proof of escort route
        'communication',    -- message/call log evidence
        'invoice',          -- billing/payment proof
        'late_payment',     -- recovery evidence
        'compliance',       -- permit/regulatory compliance
        'escort_completion',-- service completion proof
        'trust_verification',-- identity/credential verification
        'dispute_evidence', -- dispute resolution evidence
        'market_snapshot'   -- market state at time of action
    )),
    -- What entity this proof is for
    entity_type     text not null,
    entity_id       uuid,
    -- Compiled evidence
    evidence        jsonb not null default '{}',
    -- Verification
    verified        boolean default false,
    verified_by     text,
    verified_at     timestamptz,
    -- Link to task/run that produced this
    task_id         uuid references public.hc_command_tasks(id),
    run_id          uuid references public.hc_command_runs(id),
    created_at      timestamptz not null default now()
);

create index if not exists idx_proof_packets_entity
    on public.hc_command_proof_packets (entity_type, entity_id);

-- =====================================================================
-- 7) PLAYBOOKS (Portable templates)
-- Paperclip equivalent: company templates / import-export
-- HC adaptation: market playbooks, not company templates
-- =====================================================================
create table if not exists public.hc_command_playbooks (
    id              uuid primary key default gen_random_uuid(),
    slug            text not null unique,
    name            text not null,
    playbook_type   text not null check (playbook_type in (
        'market_launch',        -- launch a new country/state/city
        'corridor_activation',  -- activate a new corridor
        'broker_acquisition',   -- broker onboarding playbook
        'operator_activation',  -- operator onboarding playbook
        'compliance_setup',     -- regulatory setup per jurisdiction
        'rescue_services',      -- urgent/rescue service activation
        'training_program',     -- certification program launch
        'sponsor_program',      -- AdGrid slot activation
        'data_product',         -- data product launch
        'content_campaign'      -- content pillar campaign
    )),
    -- Template content: agents to create, heartbeats to activate, tasks to seed
    template        jsonb not null default '{}',
    -- Which markets this has been deployed to
    deployed_markets text[] default '{}',
    -- Metadata
    version         integer default 1,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- =====================================================================
-- 8) MONEY EVENTS
-- Paperclip tracks cost only. HC tracks full revenue lifecycle.
-- =====================================================================
create table if not exists public.hc_command_money_events (
    id              uuid primary key default gen_random_uuid(),
    event_type      text not null check (event_type in (
        'revenue_earned',       -- subscription, booking, premium
        'revenue_pending',      -- invoiced, not yet collected
        'cost_incurred',        -- API cost, infrastructure cost
        'recovery_sent',        -- late payment notice sent
        'recovery_collected',   -- late payment collected
        'refund_issued',        -- refund processed
        'sponsor_payment',      -- AdGrid sponsor payment
        'data_product_sale',    -- data product purchase
        'affiliate_commission', -- affiliate referral payment
        'claim_conversion'      -- free→paid conversion
    )),
    amount_cents    integer not null,
    currency        text default 'USD',
    -- Source tracing
    agent_id        uuid references public.hc_command_agents(id),
    task_id         uuid references public.hc_command_tasks(id),
    run_id          uuid references public.hc_command_runs(id),
    -- What entity/market generated this
    entity_type     text,
    entity_id       uuid,
    market          text,
    -- Metadata
    metadata        jsonb default '{}',
    created_at      timestamptz not null default now()
);

create index if not exists idx_money_events_type
    on public.hc_command_money_events (event_type, created_at desc);

create index if not exists idx_money_events_agent
    on public.hc_command_money_events (agent_id, created_at desc);

create index if not exists idx_money_events_market
    on public.hc_command_money_events (market, created_at desc);

-- =====================================================================
-- RLS: All command layer tables — service-role only (internal infrastructure)
-- Admin can read for dashboard
-- =====================================================================
alter table public.hc_command_agents enable row level security;
alter table public.hc_command_heartbeats enable row level security;
alter table public.hc_command_tasks enable row level security;
alter table public.hc_command_approvals enable row level security;
alter table public.hc_command_runs enable row level security;
alter table public.hc_command_proof_packets enable row level security;
alter table public.hc_command_playbooks enable row level security;
alter table public.hc_command_money_events enable row level security;

commit;
