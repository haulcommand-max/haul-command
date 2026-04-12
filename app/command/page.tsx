'use client';
// =====================================================================
// Haul Command â€” Command Layer Board Dashboard
// app/command/page.tsx
//
// The nerve center. Shows every agent, heartbeat, market mode, money flow,
// coverage gap, approval queue, and run history in one premium dashboard.
// Consumes GET /api/command/board
// =====================================================================

import { useEffect, useState, useCallback } from 'react';

interface BoardData {
  timestamp: string;
  system_status: string;
  agents: any;
  heartbeats: any;
  tasks: any;
  approvals: any;
  runs: any;
  money: any;
  readiness: any;
  recent_events: any[];
  market_modes: any;
  coverage_gaps: any;
  revenue_streams: any[];
}

export default function CommandBoardPage() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'money' | 'markets' | 'runs'>('overview');

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/command/board');
      if (!res.ok) throw new Error(`Board API returned ${res.status}`);
      const data = await res.json();
      setBoard(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchBoard]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchBoard} />;
  if (!board) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>âš¡ Command Center</h1>
          <span style={{
            ...styles.statusBadge,
            background: board.system_status === 'healthy' ? '#10b981' : '#ef4444',
          }}>
            {board.system_status === 'healthy' ? 'â— HEALTHY' : 'â— DEGRADED'}
          </span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.timestamp}>
            Last sync: {new Date(board.timestamp).toLocaleTimeString()}
          </span>
          <button style={styles.refreshBtn} onClick={fetchBoard}>â†» Refresh</button>
        </div>
      </header>

      {/* KPI Strip */}
      <div style={styles.kpiStrip}>
        <KPICard label="Agents" value={board.agents.rollup.total} sub={`${board.agents.rollup.active} active`} color="#6366f1" />
        <KPICard label="Heartbeats" value={board.heartbeats.health.total} sub={`${board.heartbeats.health.stale} stale`} color={board.heartbeats.health.stale > 0 ? '#f59e0b' : '#10b981'} />
        <KPICard label="Runs (100)" value={board.runs.total} sub={`${board.runs.success_rate}% success`} color={board.runs.success_rate >= 90 ? '#10b981' : '#ef4444'} />
        <KPICard label="Pending Tasks" value={board.tasks.todo ?? 0} sub={`${board.tasks.in_progress ?? 0} in progress`} color="#8b5cf6" />
        <KPICard label="Approvals" value={board.approvals.pending_count} sub="awaiting action" color={board.approvals.pending_count > 0 ? '#f59e0b' : '#10b981'} />
        <KPICard label="Markets" value={board.market_modes?.total_markets ?? 0} sub={`${board.market_modes?.live_markets ?? 0} live`} color="#06b6d4" />
        <KPICard label="Coverage Gaps" value={board.coverage_gaps?.total_unresolved ?? 0} sub={`${board.coverage_gaps?.critical ?? 0} critical`} color={board.coverage_gaps?.critical > 0 ? '#ef4444' : '#10b981'} />
        <KPICard label="Revenue (30d)" value={`$${((board.money?.revenue_30d_cents ?? 0) / 100).toLocaleString()}`} sub={`Cost: $${((board.money?.cost_30d_cents ?? 0) / 100).toLocaleString()}`} color="#10b981" />
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['overview', 'agents', 'money', 'markets', 'runs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {}),
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {activeTab === 'overview' && <OverviewTab board={board} />}
        {activeTab === 'agents' && <AgentsTab board={board} />}
        {activeTab === 'money' && <MoneyTab board={board} />}
        {activeTab === 'markets' && <MarketsTab board={board} />}
        {activeTab === 'runs' && <RunsTab board={board} />}
      </div>
    </div>
  );
}

// â”€â”€â”€ Tab Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OverviewTab({ board }: { board: BoardData }) {
  return (
    <div style={styles.grid2}>
      {/* Domain Breakdown */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Agent Domains</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Domain</th>
                <th style={styles.th}>Agents</th>
                <th style={styles.th}>Completed</th>
                <th style={styles.th}>Failed</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(board.agents.by_domain || {}).map(([domain, stats]: [string, any]) => (
                <tr key={domain}>
                  <td style={styles.td}><span style={styles.domainBadge}>{domain}</span></td>
                  <td style={styles.td}>{stats.agents}</td>
                  <td style={{ ...styles.td, color: '#10b981' }}>{stats.tasks_completed}</td>
                  <td style={{ ...styles.td, color: stats.tasks_failed > 0 ? '#ef4444' : '#6b7280' }}>{stats.tasks_failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approvals */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>âš ï¸ Pending Approvals</h3>
        {board.approvals.items.length === 0 ? (
          <p style={styles.emptyState}>No pending approvals â€” all clear</p>
        ) : (
          board.approvals.items.slice(0, 5).map((a: any) => (
            <div key={a.id} style={styles.approvalItem}>
              <span style={styles.approvalTitle}>{a.hc_command_tasks?.title || 'Approval'}</span>
              <span style={styles.approvalMeta}>by {a.hc_command_agents?.name}</span>
            </div>
          ))
        )}
      </div>

      {/* Recent Events */}
      <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
        <h3 style={styles.cardTitle}>Recent Events</h3>
        <div style={styles.eventList}>
          {board.recent_events.slice(0, 10).map((evt: any, i: number) => (
            <div key={i} style={styles.eventRow}>
              <span style={styles.eventType}>{evt.event_type}</span>
              <span style={styles.eventEntity}>{evt.entity_type}</span>
              <span style={styles.eventTime}>{new Date(evt.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentsTab({ board }: { board: BoardData }) {
  const agents = board.agents.roster || [];
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Agent Roster ({agents.length})</h3>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Agent</th>
              <th style={styles.th}>Domain</th>
              <th style={styles.th}>Kind</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Health</th>
              <th style={styles.th}>Last Heartbeat</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a: any) => (
              <tr key={a.id}>
                <td style={styles.td}>
                  <strong>{a.name}</strong>
                  <br /><span style={{ fontSize: '11px', color: '#9ca3af' }}>{a.slug}</span>
                </td>
                <td style={styles.td}><span style={styles.domainBadge}>{a.domain}</span></td>
                <td style={styles.td}>{a.kind}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusDot,
                    background: a.status === 'active' ? '#10b981' : a.status === 'paused' ? '#f59e0b' : '#ef4444',
                  }}>{a.status}</span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    color: a.health === 'healthy' ? '#10b981' : a.health === 'degraded' ? '#f59e0b' : '#ef4444',
                  }}>{a.health || 'â€”'}</span>
                </td>
                <td style={{ ...styles.td, fontSize: '12px' }}>
                  {a.last_heartbeat ? new Date(a.last_heartbeat).toLocaleString() : 'â€”'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MoneyTab({ board }: { board: BoardData }) {
  const streams = board.revenue_streams || [];
  return (
    <div style={styles.grid2}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>ðŸ’° 30-Day Revenue Summary</h3>
        <div style={styles.moneyGrid}>
          <div style={styles.moneyBox}>
            <span style={styles.moneyLabel}>Revenue</span>
            <span style={{ ...styles.moneyValue, color: '#10b981' }}>
              ${((board.money?.revenue_30d_cents ?? 0) / 100).toLocaleString()}
            </span>
          </div>
          <div style={styles.moneyBox}>
            <span style={styles.moneyLabel}>Cost</span>
            <span style={{ ...styles.moneyValue, color: '#ef4444' }}>
              ${((board.money?.cost_30d_cents ?? 0) / 100).toLocaleString()}
            </span>
          </div>
          <div style={styles.moneyBox}>
            <span style={styles.moneyLabel}>Net</span>
            <span style={{ ...styles.moneyValue, color: '#6366f1' }}>
              ${((board.money?.net_30d_cents ?? 0) / 100).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Revenue Streams (from DB Triggers)</h3>
        {streams.length === 0 ? (
          <p style={styles.emptyState}>No money events recorded yet. Revenue will appear after first transaction triggers fire.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Source</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Events</th>
                  <th style={styles.th}>24h</th>
                  <th style={styles.th}>7d</th>
                  <th style={styles.th}>30d</th>
                </tr>
              </thead>
              <tbody>
                {streams.map((s: any, i: number) => (
                  <tr key={i}>
                    <td style={styles.td}><span style={styles.domainBadge}>{s.source}</span></td>
                    <td style={styles.td}>{s.event_type}</td>
                    <td style={styles.td}>{s.event_count}</td>
                    <td style={{ ...styles.td, color: '#10b981' }}>${((s.last_24h_cents ?? 0) / 100).toLocaleString()}</td>
                    <td style={{ ...styles.td, color: '#10b981' }}>${((s.last_7d_cents ?? 0) / 100).toLocaleString()}</td>
                    <td style={{ ...styles.td, color: '#10b981', fontWeight: 700 }}>${((s.last_30d_cents ?? 0) / 100).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketsTab({ board }: { board: BoardData }) {
  const modes = board.market_modes;
  const gaps = board.coverage_gaps;

  return (
    <div style={styles.grid2}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>ðŸŒ Market Modes</h3>
        <div style={styles.modeGrid}>
          {Object.entries(modes?.by_mode || {}).map(([mode, count]: [string, any]) => (
            <div key={mode} style={{
              ...styles.modeChip,
              borderColor: mode === 'live' ? '#10b981' : mode === 'rescue' ? '#ef4444' : mode === 'shortage' ? '#f59e0b' : '#6b7280',
            }}>
              <span style={styles.modeCount}>{count}</span>
              <span style={styles.modeLabel}>{mode}</span>
            </div>
          ))}
        </div>

        {modes?.rescue_markets?.length > 0 && (
          <div style={styles.alertBox}>
            <strong>ðŸš¨ RESCUE MARKETS:</strong>{' '}
            {modes.rescue_markets.join(', ')}
          </div>
        )}

        {modes?.shortage_markets?.length > 0 && (
          <div style={{ ...styles.alertBox, background: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }}>
            <strong>âš ï¸ SHORTAGE:</strong>{' '}
            {modes.shortage_markets.join(', ')}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>ðŸ”´ Coverage Gaps ({gaps?.total_unresolved ?? 0} unresolved)</h3>
        {!gaps?.items?.length ? (
          <p style={styles.emptyState}>No unresolved coverage gaps â€” all markets covered</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Market</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Severity</th>
                  <th style={styles.th}>Country</th>
                </tr>
              </thead>
              <tbody>
                {gaps.items.map((g: any) => (
                  <tr key={g.id}>
                    <td style={styles.td}>{g.market_key}</td>
                    <td style={styles.td}>{g.gap_type}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.severityBadge,
                        background: g.severity === 'critical' ? '#ef4444' : g.severity === 'high' ? '#f59e0b' : '#6b7280',
                      }}>{g.severity}</span>
                    </td>
                    <td style={styles.td}>{g.country_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RunsTab({ board }: { board: BoardData }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Recent Runs</h3>
      <div style={styles.runStats}>
        <span>âœ… {board.runs.completed} completed</span>
        <span>âŒ {board.runs.failed} failed</span>
        <span>ðŸ”„ {board.runs.running} running</span>
        <span>ðŸ“Š {board.runs.success_rate}% success</span>
      </div>
    </div>
  );
}

// â”€â”€â”€ Shared Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KPICard({ label, value, sub, color }: { label: string; value: any; sub: string; color: string }) {
  return (
    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${color}` }}>
      <span style={styles.kpiValue}>{value}</span>
      <span style={styles.kpiLabel}>{label}</span>
      <span style={styles.kpiSub}>{sub}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={styles.spinner} />
        <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading Command Center...</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '18px' }}>âš ï¸ {message}</p>
        <button style={styles.refreshBtn} onClick={onRetry}>â†» Retry</button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#e5e7eb',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '16px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '0.5px',
  },
  timestamp: { color: '#6b7280', fontSize: '13px' },
  refreshBtn: {
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#818cf8',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },

  // KPI Strip
  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  },
  kpiCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiValue: { fontSize: '24px', fontWeight: 800, color: '#fff' },
  kpiLabel: { fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  kpiSub: { fontSize: '11px', color: '#6b7280' },

  // Tabs
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '0',
  },
  tab: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#818cf8',
    borderBottomColor: '#6366f1',
  },

  // Content
  content: { minHeight: '400px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '20px',
  },
  cardTitle: { fontSize: '16px', fontWeight: 700, color: '#e5e7eb', margin: '0 0 16px 0' },

  // Tables
  tableWrap: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th: { textAlign: 'left' as const, padding: '8px 12px', color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' as const },
  td: { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#d1d5db' },

  // Badges
  domainBadge: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
  },
  statusDot: {
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff',
  },
  severityBadge: {
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#fff',
    textTransform: 'uppercase' as const,
  },

  // Approvals
  approvalItem: {
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  approvalTitle: { fontWeight: 600, color: '#e5e7eb' },
  approvalMeta: { fontSize: '12px', color: '#6b7280' },

  // Events
  eventList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  eventRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    fontSize: '13px',
  },
  eventType: { color: '#818cf8', fontWeight: 600, fontSize: '12px' },
  eventEntity: { color: '#6b7280', fontSize: '12px' },
  eventTime: { color: '#4b5563', fontSize: '11px' },

  // Money
  moneyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  moneyBox: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  moneyLabel: { fontSize: '12px', color: '#9ca3af', fontWeight: 600 },
  moneyValue: { fontSize: '22px', fontWeight: 800 },

  // Markets
  modeGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginBottom: '16px' },
  modeChip: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    minWidth: '80px',
  },
  modeCount: { fontSize: '20px', fontWeight: 800, color: '#fff' },
  modeLabel: { fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, fontWeight: 600 },

  // Alerts
  alertBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '13px',
    color: '#fca5a5',
    marginTop: '12px',
  },

  // Runs
  runStats: { display: 'flex', gap: '24px', fontSize: '14px', fontWeight: 600 },

  // Empty state
  emptyState: { color: '#6b7280', fontStyle: 'italic', padding: '20px 0' },

  // Spinner
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(99, 102, 241, 0.2)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 1s linear infinite',
  },
};