-- =====================================================================
-- Haul Command Command Layer — Board RPCs
-- RPCs consumed by /api/command/board for dashboard aggregation.
-- Mode: ADDITIVE ONLY
-- =====================================================================
begin;

-- =====================================================================
-- 1) command_task_stats — Aggregate task counts by status
-- =====================================================================
create or replace function public.command_task_stats()
returns jsonb
language plpgsql
security definer
as $$
declare
    v_result jsonb;
begin
    select jsonb_build_object(
        'backlog',      count(*) filter (where status = 'backlog'),
        'todo',         count(*) filter (where status = 'todo'),
        'in_progress',  count(*) filter (where status = 'in_progress'),
        'in_review',    count(*) filter (where status = 'in_review'),
        'done',         count(*) filter (where status = 'done'),
        'blocked',      count(*) filter (where status = 'blocked'),
        'cancelled',    count(*) filter (where status = 'cancelled'),
        'total',        count(*),
        'high_priority', count(*) filter (where priority <= 3 and status not in ('done','cancelled')),
        'by_domain', (
            select coalesce(jsonb_object_agg(domain, cnt), '{}')
            from (
                select domain, count(*) as cnt
                from public.hc_command_tasks
                where status not in ('done', 'cancelled')
                group by domain
            ) sub
        )
    )
    into v_result
    from public.hc_command_tasks;

    return v_result;
end;
$$;

-- =====================================================================
-- 2) command_money_stats — Revenue/cost rollup since a given date
-- =====================================================================
create or replace function public.command_money_stats(p_since timestamptz default now() - interval '30 days')
returns jsonb
language plpgsql
security definer
as $$
declare
    v_result jsonb;
begin
    select jsonb_build_object(
        'revenue_30d_cents', coalesce(sum(amount_cents) filter (where event_type in ('revenue_earned','recovery_collected','sponsor_payment','data_product_sale','affiliate_commission','claim_conversion')), 0),
        'cost_30d_cents',    coalesce(sum(amount_cents) filter (where event_type = 'cost_incurred'), 0),
        'pending_30d_cents', coalesce(sum(amount_cents) filter (where event_type = 'revenue_pending'), 0),
        'refunds_30d_cents', coalesce(sum(amount_cents) filter (where event_type = 'refund_issued'), 0),
        'net_30d_cents',     coalesce(
            sum(case
                when event_type in ('revenue_earned','recovery_collected','sponsor_payment','data_product_sale','affiliate_commission','claim_conversion') then amount_cents
                when event_type in ('cost_incurred','refund_issued') then -amount_cents
                else 0
            end), 0
        ),
        'by_type', (
            select coalesce(jsonb_object_agg(event_type, total_cents), '{}')
            from (
                select event_type, sum(amount_cents) as total_cents
                from public.hc_command_money_events
                where created_at >= p_since
                group by event_type
            ) sub
        ),
        'by_market', (
            select coalesce(jsonb_object_agg(market, total_cents), '{}')
            from (
                select coalesce(market, 'global') as market, sum(amount_cents) as total_cents
                from public.hc_command_money_events
                where created_at >= p_since
                  and event_type in ('revenue_earned','recovery_collected','sponsor_payment','data_product_sale','affiliate_commission')
                group by market
            ) sub
        ),
        'top_agents', (
            select coalesce(jsonb_agg(row_to_json(sub)), '[]')
            from (
                select a.slug as agent_slug, a.name as agent_name,
                       sum(m.amount_cents) as total_cents,
                       count(*) as event_count
                from public.hc_command_money_events m
                join public.hc_command_agents a on a.id = m.agent_id
                where m.created_at >= p_since
                  and m.event_type in ('revenue_earned','recovery_collected','sponsor_payment','data_product_sale')
                group by a.slug, a.name
                order by total_cents desc
                limit 10
            ) sub
        ),
        'period_start', p_since,
        'period_end', now()
    )
    into v_result
    from public.hc_command_money_events
    where created_at >= p_since;

    return v_result;
end;
$$;

-- =====================================================================
-- 3) command_agent_health — Per-agent health snapshot
-- =====================================================================
create or replace function public.command_agent_health(p_agent_slug text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_result jsonb;
begin
    select coalesce(jsonb_agg(row_to_json(sub)), '[]')
    into v_result
    from (
        select
            a.slug,
            a.name,
            a.domain,
            a.status,
            a.adapter_type,
            a.tasks_completed,
            a.tasks_failed,
            a.revenue_generated_cents,
            a.leads_generated,
            a.budget_monthly_cents,
            a.budget_spent_cents,
            (select count(*) from hc_command_heartbeats h where h.agent_id = a.id and h.enabled) as active_heartbeats,
            (select max(h.last_run_at) from hc_command_heartbeats h where h.agent_id = a.id) as last_heartbeat_at,
            (select count(*) from hc_command_runs r where r.agent_id = a.id and r.status = 'running') as active_runs,
            (select count(*) from hc_command_runs r where r.agent_id = a.id and r.started_at > now() - interval '24 hours') as runs_24h,
            (select count(*) from hc_command_runs r where r.agent_id = a.id and r.status = 'failed' and r.started_at > now() - interval '24 hours') as failures_24h,
            (select count(*) from hc_command_tasks t where t.assigned_to = a.id and t.status = 'in_progress') as tasks_in_progress,
            case
                when a.status = 'error' then 'critical'
                when a.status = 'paused' then 'paused'
                when (select count(*) from hc_command_runs r where r.agent_id = a.id and r.status = 'failed' and r.started_at > now() - interval '1 hour') > 3 then 'degraded'
                when (select max(h.last_run_at) from hc_command_heartbeats h where h.agent_id = a.id and h.enabled) < now() - interval '2 hours' then 'stale'
                else 'healthy'
            end as health_status
        from public.hc_command_agents a
        where (p_agent_slug is null or a.slug = p_agent_slug)
        order by a.domain, a.slug
    ) sub;

    return v_result;
end;
$$;

-- =====================================================================
-- 4) command_complete_run — Mark a run finished and update agent stats
-- =====================================================================
create or replace function public.command_complete_run(
    p_run_id uuid,
    p_status text default 'completed',
    p_cost_cents integer default 0,
    p_revenue_cents integer default 0,
    p_leads integer default 0,
    p_entities_processed integer default 0,
    p_pages_published integer default 0,
    p_result jsonb default null,
    p_error_message text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_run record;
    v_duration_ms integer;
begin
    -- Get the run
    select * into v_run from public.hc_command_runs where id = p_run_id;
    if not found then
        return jsonb_build_object('error', 'Run not found');
    end if;

    -- Calculate duration
    v_duration_ms := extract(epoch from (now() - v_run.started_at)) * 1000;

    -- Update run
    update public.hc_command_runs set
        status = p_status,
        cost_cents = p_cost_cents,
        revenue_generated_cents = p_revenue_cents,
        leads_generated = p_leads,
        entities_processed = p_entities_processed,
        pages_published = p_pages_published,
        duration_ms = v_duration_ms,
        result = p_result,
        error_message = p_error_message,
        completed_at = now()
    where id = p_run_id;

    -- Update agent stats
    if v_run.agent_id is not null then
        update public.hc_command_agents set
            tasks_completed = tasks_completed + case when p_status = 'completed' then 1 else 0 end,
            tasks_failed = tasks_failed + case when p_status = 'failed' then 1 else 0 end,
            revenue_generated_cents = revenue_generated_cents + p_revenue_cents,
            leads_generated = leads_generated + p_leads,
            budget_spent_cents = budget_spent_cents + p_cost_cents,
            status = case when p_status = 'failed' and (
                select count(*) from hc_command_runs
                where agent_id = v_run.agent_id and status = 'failed'
                  and started_at > now() - interval '1 hour'
            ) > 5 then 'error' else 'active' end,
            updated_at = now()
        where id = v_run.agent_id;
    end if;

    -- Update heartbeat last run status
    if v_run.heartbeat_id is not null then
        update public.hc_command_heartbeats set
            last_run_status = p_status
        where id = v_run.heartbeat_id;
    end if;

    -- Log to OS event bus
    insert into os_event_log (event_type, entity_id, entity_type, payload)
    values (
        'run.' || p_status,
        p_run_id,
        'run',
        jsonb_build_object(
            'agent_id', v_run.agent_id,
            'heartbeat_id', v_run.heartbeat_id,
            'duration_ms', v_duration_ms,
            'cost_cents', p_cost_cents,
            'revenue_cents', p_revenue_cents,
            'leads', p_leads
        )
    );

    return jsonb_build_object(
        'status', p_status,
        'duration_ms', v_duration_ms,
        'cost_cents', p_cost_cents,
        'revenue_cents', p_revenue_cents
    );
end;
$$;

commit;
