/**
 * Earnings Service — Supabase-backed operator earnings tracking.
 * 
 * Replaces localStorage-based earnings with persistent Supabase storage.
 * Reads from `operator_earnings` table (materialized from jobs + payouts).
 * Provides hooks for dashboard, sparkline, export, and lifetime totals.
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

// ── Types ──────────────────────────────────────────────────────────────

export interface EarningsRecord {
  id: string;
  user_id: string;
  job_id: string | null;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  currency: string;
  source: 'job_completion' | 'payout' | 'bonus' | 'referral' | 'adjustment';
  status: 'pending' | 'confirmed' | 'paid' | 'failed';
  corridor_id?: string;
  corridor_label?: string;
  origin_state?: string;
  destination_state?: string;
  created_at: string;
  confirmed_at?: string;
  paid_at?: string;
  metadata?: Record<string, unknown>;
}

export interface EarningsSummary {
  lifetime_cents: number;
  lifetime_jobs: number;
  this_week_cents: number;
  this_week_jobs: number;
  last_week_cents: number;
  last_week_jobs: number;
  this_month_cents: number;
  this_month_jobs: number;
  last_month_cents: number;
  last_month_jobs: number;
  avg_per_job_cents: number;
  currency: string;
}

export interface DailyEarning {
  date: string; // YYYY-MM-DD
  total_cents: number;
  job_count: number;
}

export interface SparklineData {
  days: DailyEarning[];
  trend_pct: number; // vs previous period
  peak_day: DailyEarning | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function weekStart(weeksAgo: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - weeksAgo * 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthStart(monthsAgo: number = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function formatCents(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCentsExact(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// ── Client-Side Service ──────────────────────────────────────────────────

export class EarningsService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Fetch full earnings summary for the current user.
   * Falls back to `jobs` table if `operator_earnings` doesn't exist yet.
   */
  async getSummary(userId: string): Promise<EarningsSummary> {
    const now = new Date();
    const thisWeekStart = weekStart(0);
    const lastWeekStart = weekStart(1);
    const thisMonthStart = monthStart(0);
    const lastMonthStart = monthStart(1);

    // Try operator_earnings table first
    const { data: earnings, error } = await this.supabase
      .from('operator_earnings')
      .select('amount_cents, fee_cents, net_cents, currency, status, created_at')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'paid']);

    if (!error && earnings && earnings.length > 0) {
      return this.buildSummaryFromEarnings(earnings, thisWeekStart, lastWeekStart, thisMonthStart, lastMonthStart);
    }

    // Fallback: use jobs table (existing pattern from OperatorEarningsCard)
    return this.buildSummaryFromJobs(userId, thisWeekStart, lastWeekStart, thisMonthStart, lastMonthStart);
  }

  private buildSummaryFromEarnings(
    earnings: any[],
    thisWeekStart: string,
    lastWeekStart: string,
    thisMonthStart: string,
    lastMonthStart: string,
  ): EarningsSummary {
    const confirmed = earnings.filter(e => ['confirmed', 'paid'].includes(e.status));
    const thisWeek = confirmed.filter(e => e.created_at >= thisWeekStart);
    const lastWeek = confirmed.filter(e => e.created_at >= lastWeekStart && e.created_at < thisWeekStart);
    const thisMonth = confirmed.filter(e => e.created_at >= thisMonthStart);
    const lastMonth = confirmed.filter(e => e.created_at >= lastMonthStart && e.created_at < thisMonthStart);

    const sum = (arr: any[]) => arr.reduce((s, e) => s + (e.net_cents || e.amount_cents || 0), 0);

    const lifetimeCents = sum(confirmed);
    return {
      lifetime_cents: lifetimeCents,
      lifetime_jobs: confirmed.length,
      this_week_cents: sum(thisWeek),
      this_week_jobs: thisWeek.length,
      last_week_cents: sum(lastWeek),
      last_week_jobs: lastWeek.length,
      this_month_cents: sum(thisMonth),
      this_month_jobs: thisMonth.length,
      last_month_cents: sum(lastMonth),
      last_month_jobs: lastMonth.length,
      avg_per_job_cents: confirmed.length > 0 ? Math.round(lifetimeCents / confirmed.length) : 0,
      currency: confirmed[0]?.currency ?? 'USD',
    };
  }

  private async buildSummaryFromJobs(
    userId: string,
    thisWeekStart: string,
    lastWeekStart: string,
    thisMonthStart: string,
    lastMonthStart: string,
  ): Promise<EarningsSummary> {
    const { data: jobs } = await this.supabase
      .from('jobs')
      .select('job_id, agreed_rate_total, currency, completed_at')
      .contains('assigned_escort_ids', [userId])
      .eq('status', 'completed');

    const all = jobs ?? [];
    const sumRate = (arr: any[]) => arr.reduce((s, j) => s + Math.round(Number(j.agreed_rate_total ?? 0) * 100), 0);

    const thisWeek = all.filter(j => j.completed_at >= thisWeekStart);
    const lastWeek = all.filter(j => j.completed_at >= lastWeekStart && j.completed_at < thisWeekStart);
    const thisMonth = all.filter(j => j.completed_at >= thisMonthStart);
    const lastMonth = all.filter(j => j.completed_at >= lastMonthStart && j.completed_at < thisMonthStart);

    const lifetimeCents = sumRate(all);
    return {
      lifetime_cents: lifetimeCents,
      lifetime_jobs: all.length,
      this_week_cents: sumRate(thisWeek),
      this_week_jobs: thisWeek.length,
      last_week_cents: sumRate(lastWeek),
      last_week_jobs: lastWeek.length,
      this_month_cents: sumRate(thisMonth),
      this_month_jobs: thisMonth.length,
      last_month_cents: sumRate(lastMonth),
      last_month_jobs: lastMonth.length,
      avg_per_job_cents: all.length > 0 ? Math.round(lifetimeCents / all.length) : 0,
      currency: all[0]?.currency ?? 'USD',
    };
  }

  /**
   * Get 7-day sparkline data for the earnings chart
   */
  async getSparkline(userId: string, days: number = 7): Promise<SparklineData> {
    const startDate = daysAgo(days * 2); // fetch 2x for trend comparison

    // Try operator_earnings first
    const { data: earnings, error } = await this.supabase
      .from('operator_earnings')
      .select('net_cents, amount_cents, created_at')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'paid'])
      .gte('created_at', startDate)
      .order('created_at', { ascending: true });

    let records = earnings ?? [];

    // Fallback to jobs if no operator_earnings
    if (error || records.length === 0) {
      const { data: jobs } = await this.supabase
        .from('jobs')
        .select('agreed_rate_total, completed_at')
        .contains('assigned_escort_ids', [userId])
        .eq('status', 'completed')
        .gte('completed_at', startDate)
        .order('completed_at', { ascending: true });

      records = (jobs ?? []).map(j => ({
        net_cents: Math.round(Number(j.agreed_rate_total ?? 0) * 100),
        amount_cents: Math.round(Number(j.agreed_rate_total ?? 0) * 100),
        created_at: j.completed_at,
      }));
    }

    // Group by day
    const dayMap = new Map<string, DailyEarning>();
    for (let i = 0; i < days * 2; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayMap.set(key, { date: key, total_cents: 0, job_count: 0 });
    }

    for (const r of records) {
      const key = new Date(r.created_at).toISOString().split('T')[0];
      const existing = dayMap.get(key);
      if (existing) {
        existing.total_cents += r.net_cents || r.amount_cents || 0;
        existing.job_count += 1;
      }
    }

    const allDays = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const currentPeriod = allDays.slice(-days);
    const previousPeriod = allDays.slice(0, days);

    const currentTotal = currentPeriod.reduce((s, d) => s + d.total_cents, 0);
    const previousTotal = previousPeriod.reduce((s, d) => s + d.total_cents, 0);
    const trendPct = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

    const peakDay = currentPeriod.reduce<DailyEarning | null>(
      (peak, d) => (!peak || d.total_cents > peak.total_cents ? d : peak),
      null,
    );

    return {
      days: currentPeriod,
      trend_pct: trendPct,
      peak_day: peakDay && peakDay.total_cents > 0 ? peakDay : null,
    };
  }

  /**
   * Get recent earnings for export
   */
  async getExportData(userId: string, startDate?: string, endDate?: string): Promise<EarningsRecord[]> {
    let query = this.supabase
      .from('operator_earnings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Fallback to jobs
      let jobQuery = this.supabase
        .from('jobs')
        .select('job_id, agreed_rate_total, currency, completed_at, origin_state, destination_state')
        .contains('assigned_escort_ids', [userId])
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (startDate) jobQuery = jobQuery.gte('completed_at', startDate);
      if (endDate) jobQuery = jobQuery.lte('completed_at', endDate);

      const { data: jobs } = await jobQuery;
      return (jobs ?? []).map(j => ({
        id: j.job_id,
        user_id: userId,
        job_id: j.job_id,
        amount_cents: Math.round(Number(j.agreed_rate_total ?? 0) * 100),
        fee_cents: 0,
        net_cents: Math.round(Number(j.agreed_rate_total ?? 0) * 100),
        currency: j.currency ?? 'USD',
        source: 'job_completion' as const,
        status: 'paid' as const,
        origin_state: j.origin_state,
        destination_state: j.destination_state,
        created_at: j.completed_at,
      }));
    }

    return data;
  }
}

// ── Server-Side Functions ──────────────────────────────────────────────

export async function getServerEarningsSummary(userId: string): Promise<EarningsSummary | null> {
  const supabase = createServerClient();

  const { data: jobs } = await supabase
    .from('jobs')
    .select('job_id, agreed_rate_total, currency, completed_at')
    .contains('assigned_escort_ids', [userId])
    .eq('status', 'completed');

  if (!jobs || jobs.length === 0) return null;

  const sumRate = (arr: any[]) => arr.reduce((s, j) => s + Math.round(Number(j.agreed_rate_total ?? 0) * 100), 0);
  const lifetimeCents = sumRate(jobs);

  const twStart = weekStart(0);
  const lwStart = weekStart(1);
  const tmStart = monthStart(0);
  const lmStart = monthStart(1);

  const tw = jobs.filter(j => j.completed_at >= twStart);
  const lw = jobs.filter(j => j.completed_at >= lwStart && j.completed_at < twStart);
  const tm = jobs.filter(j => j.completed_at >= tmStart);
  const lm = jobs.filter(j => j.completed_at >= lmStart && j.completed_at < tmStart);

  return {
    lifetime_cents: lifetimeCents,
    lifetime_jobs: jobs.length,
    this_week_cents: sumRate(tw),
    this_week_jobs: tw.length,
    last_week_cents: sumRate(lw),
    last_week_jobs: lw.length,
    this_month_cents: sumRate(tm),
    this_month_jobs: tm.length,
    last_month_cents: sumRate(lm),
    last_month_jobs: lm.length,
    avg_per_job_cents: jobs.length > 0 ? Math.round(lifetimeCents / jobs.length) : 0,
    currency: jobs[0]?.currency ?? 'USD',
  };
}
