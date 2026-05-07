import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  Activity, BrainCircuit, Clock, AlertTriangle, CheckCircle2,
  XCircle, Zap, DollarSign, ArrowRight, Server, Cpu,
  Timer, BarChart3
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ══════════════════════════════════════════════════════════════
// HQ AGENTS & SWARMS DASHBOARD
// Per Master Prompt §34-35: Agent swarm runs must be observable.
// Reads from hc_command_agents + hc_command_runs tables.
// ══════════════════════════════════════════════════════════════

export const metadata = {
  title: 'Agents & Swarms | Haul Command HQ',
  description: 'Live run log, cost tracker, and outcome dashboard for all 119 command agents.',
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  active:     { icon: Zap,            color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  running:    { icon: Activity,       color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  idle:       { icon: Clock,          color: 'text-slate-400',   bg: 'bg-slate-400/10' },
  completed:  { icon: CheckCircle2,   color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  failed:     { icon: XCircle,        color: 'text-red-400',     bg: 'bg-red-400/10' },
  error:      { icon: AlertTriangle,  color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  paused:     { icon: Timer,          color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  cancelled:  { icon: XCircle,        color: 'text-slate-500',   bg: 'bg-slate-500/10' },
  timeout:    { icon: AlertTriangle,  color: 'text-red-400',     bg: 'bg-red-400/10' },
  terminated: { icon: XCircle,        color: 'text-red-500',     bg: 'bg-red-500/10' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatCents(cents: number | null): string {
  if (!cents) return '$0';
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AgentsDashboard() {
  const supabase = createServerComponentClient({ cookies });

  // Parallel data fetch
  const [
    { data: agents },
    { data: recentRuns },
    { count: totalRunsToday },
    { data: runStats },
  ] = await Promise.all([
    supabase
      .from('hc_command_agents')
      .select('id, slug, name, domain, adapter_type, status, budget_monthly_cents, budget_spent_cents, revenue_generated_cents, leads_generated, tasks_completed, tasks_failed, markets, updated_at')
      .order('status', { ascending: true })
      .order('tasks_completed', { ascending: false })
      .limit(100),
    supabase
      .from('hc_command_runs')
      .select('id, agent_id, status, provider, model, input_tokens, output_tokens, cost_cents, revenue_generated_cents, entities_processed, duration_ms, error_message, started_at, completed_at')
      .order('started_at', { ascending: false })
      .limit(50),
    supabase
      .from('hc_command_runs')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.rpc('get_agent_run_summary').maybeSingle(),
  ]);

  const safeAgents = agents ?? [];
  const safeRuns = recentRuns ?? [];

  // Compute aggregate metrics
  const activeAgents = safeAgents.filter(a => a.status === 'active' || a.status === 'running').length;
  const totalRevenue = safeAgents.reduce((sum, a) => sum + (a.revenue_generated_cents ?? 0), 0);
  const totalCost = safeAgents.reduce((sum, a) => sum + (a.budget_spent_cents ?? 0), 0);
  const totalLeads = safeAgents.reduce((sum, a) => sum + (a.leads_generated ?? 0), 0);

  const summaryMetrics = [
    { label: 'Active Agents',      value: activeAgents,               icon: BrainCircuit, color: 'text-amber-400',   bg: 'bg-amber-400/10' },
    { label: 'Runs (24h)',         value: totalRunsToday ?? 0,        icon: Activity,     color: 'text-blue-400',    bg: 'bg-blue-400/10' },
    { label: 'Revenue Generated',  value: formatCents(totalRevenue),  icon: DollarSign,   color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Cost',         value: formatCents(totalCost),     icon: BarChart3,    color: 'text-slate-400',   bg: 'bg-slate-400/10' },
    { label: 'Leads Generated',    value: totalLeads,                 icon: Zap,          color: 'text-purple-400',  bg: 'bg-purple-400/10' },
    { label: 'Total Agents',       value: safeAgents.length,          icon: Server,       color: 'text-cyan-400',    bg: 'bg-cyan-400/10' },
  ];

  // Group agents by domain
  const agentsByDomain = safeAgents.reduce<Record<string, typeof safeAgents>>((acc, agent) => {
    const domain = agent.domain || 'uncategorized';
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(agent);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-slate-800/60 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wide text-gradient-gold">
              Agents & Swarms
            </h1>
            <p className="text-slate-400 mt-1">
              Live telemetry for {safeAgents.length} command agents across {Object.keys(agentsByDomain).length} domains.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {activeAgents} LIVE
            </span>
          </div>
        </div>
      </header>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryMetrics.map(metric => (
          <div
            key={metric.label}
            className="p-4 rounded-xl border border-white/5 bg-hc-surface flex flex-col gap-2 hover:border-amber-500/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono">{metric.value}</p>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Runs Log */}
      <div className="rounded-xl border border-white/5 bg-hc-surface overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Recent Run Log
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Last {safeRuns.length} runs
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800/50 text-left">
                <th className="py-3 px-4 text-slate-500 font-semibold">Status</th>
                <th className="py-3 px-4 text-slate-500 font-semibold">Agent</th>
                <th className="py-3 px-4 text-slate-500 font-semibold">Provider</th>
                <th className="py-3 px-4 text-slate-500 font-semibold text-right">Tokens</th>
                <th className="py-3 px-4 text-slate-500 font-semibold text-right">Cost</th>
                <th className="py-3 px-4 text-slate-500 font-semibold text-right">Revenue</th>
                <th className="py-3 px-4 text-slate-500 font-semibold text-right">Duration</th>
                <th className="py-3 px-4 text-slate-500 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {safeRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Activity className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No runs recorded yet</p>
                    <p className="text-[10px] mt-1">Agent runs will appear here as they execute.</p>
                  </td>
                </tr>
              ) : (
                safeRuns.map(run => {
                  const cfg = getStatusConfig(run.status);
                  const StatusIcon = cfg.icon;
                  const agent = safeAgents.find(a => a.id === run.agent_id);
                  const totalTokens = (run.input_tokens ?? 0) + (run.output_tokens ?? 0);
                  const timeAgo = run.started_at
                    ? getTimeAgo(new Date(run.started_at))
                    : '—';

                  return (
                    <tr
                      key={run.id}
                      className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${cfg.bg}`}>
                          <StatusIcon className={`h-3 w-3 ${cfg.color}`} />
                          <span className={`font-mono font-bold text-[10px] ${cfg.color}`}>
                            {run.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-200 font-semibold">
                          {agent?.name ?? run.agent_id?.slice(0, 8) ?? '—'}
                        </span>
                        {agent?.domain && (
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                            {agent.domain}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {run.provider ?? 'worker'}
                        {run.model && (
                          <span className="block text-[10px] text-slate-600 mt-0.5">
                            {run.model}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">
                        {totalTokens > 0 ? totalTokens.toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">
                        {formatCents(run.cost_cents)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={run.revenue_generated_cents ? 'text-emerald-400' : 'text-slate-500'}>
                          {formatCents(run.revenue_generated_cents)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">
                        {formatDuration(run.duration_ms)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono text-[10px]">
                        {timeAgo}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Registry by Domain */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Server className="h-5 w-5 text-cyan-500" />
          Agent Registry
          <span className="text-xs font-mono text-slate-500 ml-2">
            {Object.keys(agentsByDomain).length} domains
          </span>
        </h3>

        {Object.entries(agentsByDomain)
          .sort(([, a], [, b]) => b.length - a.length)
          .map(([domain, domainAgents]) => (
            <div
              key={domain}
              className="rounded-xl border border-white/5 bg-hc-surface overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-slate-800/50 flex justify-between items-center bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    {domain}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {domainAgents.length} agents
                </span>
              </div>
              <div className="divide-y divide-slate-800/30">
                {domainAgents.map(agent => {
                  const cfg = getStatusConfig(agent.status);
                  const StatusIcon = cfg.icon;
                  const roi = agent.budget_spent_cents > 0
                    ? ((agent.revenue_generated_cents / agent.budget_spent_cents) * 100).toFixed(0)
                    : null;

                  return (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2 w-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500 animate-pulse' : agent.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">
                            {agent.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {agent.slug} · {agent.adapter_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right shrink-0">
                        <div className="hidden md:block">
                          <p className="text-xs font-mono text-slate-300">
                            {agent.tasks_completed ?? 0}
                            <span className="text-slate-600"> / </span>
                            <span className="text-red-400">{agent.tasks_failed ?? 0}</span>
                          </p>
                          <p className="text-[10px] text-slate-600">done / fail</p>
                        </div>
                        <div className="hidden lg:block">
                          <p className="text-xs font-mono text-emerald-400">
                            {formatCents(agent.revenue_generated_cents)}
                          </p>
                          <p className="text-[10px] text-slate-600">revenue</p>
                        </div>
                        {roi && (
                          <div className="hidden lg:block">
                            <p className="text-xs font-mono text-amber-400">{roi}%</p>
                            <p className="text-[10px] text-slate-600">ROI</p>
                          </div>
                        )}
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${cfg.bg}`}>
                          <StatusIcon className={`h-3 w-3 ${cfg.color}`} />
                          <span className={`font-mono font-bold text-[10px] ${cfg.color}`}>
                            {agent.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Time-ago helper ──
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
