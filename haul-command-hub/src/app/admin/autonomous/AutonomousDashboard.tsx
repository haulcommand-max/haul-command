'use client';

import { useState, useEffect, useCallback } from 'react';

interface AgentStatus {
  id: number;
  name: string;
  swarm: string;
  enabled: boolean;
  killed: boolean;
  totalRuns: number;
  successRate: number;
  lastRunAt: string | null;
  avgDurationMs: number;
  totalTokens: number;
  totalCostUSD: number;
  totalRevenueImpact: number;
}

interface SwarmData {
  [key: string]: AgentStatus[];
}

interface DashboardData {
  name: string;
  version: string;
  totalAgents: number;
  registeredAgents: number;
  activeAgents: number;
  killedAgents: number;
  agents: AgentStatus[];
  swarms: SwarmData;
}

const SWARM_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  revenue:          { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: '🟢' },
  dispatch:         { bg: 'bg-blue-500/10',  border: 'border-blue-500/20',  text: 'text-blue-400',  icon: '📞' },
  supply:           { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', icon: '📦' },
  control:          { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    icon: '🛡️' },
  permit:           { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', icon: '📋' },
  expansion:        { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-400',   icon: '🌐' },
  broker_relations: { bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   text: 'text-pink-400',   icon: '🤝' },
  finance:          { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: '💵' },
  analytics:        { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', icon: '📊' },
};

export default function AutonomousDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedSwarm, setSelectedSwarm] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/autonomous/handle-event');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10_000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading Agent Swarm Status...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-red-400 font-bold text-lg mb-2">Connection Failed</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button onClick={fetchData} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalRevenue = data?.agents.reduce((sum, a) => sum + (a.totalRevenueImpact || 0), 0) || 0;
  const totalCost = data?.agents.reduce((sum, a) => sum + (a.totalCostUSD || 0), 0) || 0;
  const totalRuns = data?.agents.reduce((sum, a) => sum + (a.totalRuns || 0), 0) || 0;
  const avgSuccessRate = data?.agents.length
    ? data.agents.reduce((sum, a) => sum + (a.successRate || 0), 0) / data.agents.length
    : 0;

  const filteredAgents = selectedSwarm
    ? data?.agents.filter(a => a.swarm === selectedSwarm) || []
    : data?.agents || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-xl">🧠</div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Autonomous Command Center</h1>
              <p className="text-gray-500 text-xs">
                {data?.registeredAgents || 0} of {data?.totalAgents || 72} agents registered ·
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                autoRefresh
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-white/5 text-gray-500 border border-white/10'
              }`}
            >
              {autoRefresh ? '● LIVE' : '○ PAUSED'}
            </button>
            <button
              onClick={fetchData}
              className="bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent/20 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Active Agents"
            value={`${data?.activeAgents || 0}`}
            sub={`${data?.killedAgents || 0} killed`}
            color="text-green-400"
            bg="bg-green-500/5"
          />
          <KPICard
            label="Total Runs"
            value={totalRuns.toLocaleString()}
            sub={`${(avgSuccessRate * 100).toFixed(1)}% success`}
            color="text-blue-400"
            bg="bg-blue-500/5"
          />
          <KPICard
            label="Revenue Impact"
            value={`$${totalRevenue.toLocaleString()}`}
            sub="Tracked by agents"
            color="text-accent"
            bg="bg-accent/5"
          />
          <KPICard
            label="Agent Cost"
            value={`$${totalCost.toFixed(4)}`}
            sub={totalRevenue > 0 ? `${Math.round(totalRevenue / Math.max(totalCost, 0.01))}:1 ROI` : 'N/A'}
            color="text-purple-400"
            bg="bg-purple-500/5"
          />
        </div>

        {/* Swarm Filter Bar */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSwarm(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !selectedSwarm
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-white/[0.03] text-gray-500 border border-white/5 hover:bg-white/[0.06]'
            }`}
          >
            ALL ({data?.agents.length || 0})
          </button>
          {Object.entries(data?.swarms || {}).map(([swarm, agents]) => {
            const colors = SWARM_COLORS[swarm] || SWARM_COLORS.revenue;
            const arr = agents as AgentStatus[];
            return (
              <button
                key={swarm}
                onClick={() => setSelectedSwarm(selectedSwarm === swarm ? null : swarm)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedSwarm === swarm
                    ? `${colors.bg} ${colors.text} ${colors.border} border`
                    : 'bg-white/[0.03] text-gray-500 border border-white/5 hover:bg-white/[0.06]'
                }`}
              >
                <span>{colors.icon}</span>
                {swarm.replace('_', ' ')} ({arr.length})
              </button>
            );
          })}
        </div>

        {/* Agent Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">Agent</th>
                  <th className="text-left px-4 py-3 font-medium">Swarm</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Runs</th>
                  <th className="text-right px-4 py-3 font-medium">Success</th>
                  <th className="text-right px-4 py-3 font-medium">Avg Time</th>
                  <th className="text-right px-4 py-3 font-medium">Cost</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                  <th className="text-right px-4 py-3 font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => {
                  const colors = SWARM_COLORS[agent.swarm] || SWARM_COLORS.revenue;
                  const roi = agent.totalCostUSD > 0
                    ? Math.round(agent.totalRevenueImpact / agent.totalCostUSD)
                    : agent.totalRevenueImpact > 0 ? Infinity : 0;

                  return (
                    <tr key={agent.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{agent.id}</td>
                      <td className="px-4 py-3 font-bold text-white">{agent.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text} ${colors.border} border`}>
                          {colors.icon} {agent.swarm}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {agent.killed ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Killed" />
                        ) : agent.enabled ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Active" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-600" title="Disabled" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">{agent.totalRuns}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-xs ${
                          agent.successRate >= 0.95 ? 'text-green-400' :
                          agent.successRate >= 0.80 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {(agent.successRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                        {agent.avgDurationMs ? `${agent.avgDurationMs}ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                        ${agent.totalCostUSD.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right text-accent font-mono text-xs font-bold">
                        {agent.totalRevenueImpact > 0 ? `$${agent.totalRevenueImpact.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {roi === Infinity ? (
                          <span className="text-green-400 font-mono text-xs font-bold">∞</span>
                        ) : roi > 0 ? (
                          <span className="text-green-400 font-mono text-xs">{roi}:1</span>
                        ) : (
                          <span className="text-gray-600 font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-xs py-4">
          Haul Command Autonomous System v{data?.version || '1.0'} · {data?.totalAgents || 72} Agents · 9 Swarms ·
          Powered by OpenAI + Claude + Gemini
        </div>
      </main>
    </div>
  );
}

function KPICard({ label, value, sub, color, bg }: {
  label: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <div className={`${bg} border border-white/[0.06] rounded-2xl p-5`}>
      <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
      <p className={`text-2xl font-black tracking-tight ${color}`}>{value}</p>
      <p className="text-gray-600 text-[10px] mt-0.5">{sub}</p>
    </div>
  );
}
