create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'hc_signal_status') then
    create type public.hc_signal_status as enum (
      'queued',
      'processed',
      'failed',
      'expired',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hc_packet_status') then
    create type public.hc_packet_status as enum (
      'draft',
      'qa_pending',
      'review_required',
      'approved',
      'scheduled',
      'published',
      'failed',
      'retired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hc_distribution_status') then
    create type public.hc_distribution_status as enum (
      'queued',
      'scheduled',
      'published',
      'failed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hc_publish_mode') then
    create type public.hc_publish_mode as enum (
      'autopublish',
      'draft_only',
      'manual_review'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hc_risk_level') then
    create type public.hc_risk_level as enum (
      'low',
      'medium',
      'high'
    );
  end if;
end
$$;
