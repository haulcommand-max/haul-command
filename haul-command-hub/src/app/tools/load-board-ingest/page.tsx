'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { BatchOutputSummary } from '@/lib/ingestion/load-board';

type SourceType = 'load_alert_board' | 'broker_post_feed' | 'dispatcher_post_feed' | 'operator_group_post' | 'complaint_post' | 'scraped_load_board_history' | 'unknown';

export default function LoadBoardIngestionPage() {
  const [rawText, setRawText] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('load_alert_board');
  const [countryHint, setCountryHint] = useState('');
  const [suppliedDate, setSuppliedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchOutputSummary | null>(null);
  const [error, setError] = useState('');
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  // Auth check
  useEffect(() => {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    sb.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
    });
  }, []);

  const handleIngest = useCallback(async () => {
    if (!rawText.trim()) {
      setError('Paste some load board text first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Get token for auth
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await sb.auth.getSession();

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/ingest/load-board', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          raw_text: rawText,
          source_name: sourceName || null,
          source_type: sourceType,
          country_hint: countryHint || null,
          supplied_date: suppliedDate || null,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const data: BatchOutputSummary = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setLoading(false);
    }
  }, [rawText, sourceName, sourceType, countryHint, suppliedDate]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerBadge}>INTELLIGENCE OPS — v3</div>
        <h1 style={styles.title}>Load Board Ingestion</h1>
        <p style={styles.subtitle}>
          Paste load-board alert text below. Every observation becomes durable market intelligence —
          volume, corridor demand, pricing signals, identity graphs, and monetizable data assets.
        </p>
        {isAuthed === false && (
          <div style={styles.authBanner}>
            ⚠️ Not authenticated. <a href="/login" style={{ color: '#fbbf24', textDecoration: 'underline' }}>Sign in</a> to persist data to Supabase.
          </div>
        )}
      </header>

      {/* Input Section */}
      <section style={styles.inputSection}>
        <div style={styles.configRow}>
          <div style={styles.configField}>
            <label style={styles.label}>Source Name</label>
            <input
              style={styles.input}
              placeholder="e.g. PilotCarloads.com"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
          </div>
          <div style={styles.configField}>
            <label style={styles.label}>Source Type</label>
            <select
              style={styles.select}
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as SourceType)}
            >
              <option value="load_alert_board">Load Alert Board</option>
              <option value="broker_post_feed">Broker Post Feed</option>
              <option value="dispatcher_post_feed">Dispatcher Post Feed</option>
              <option value="operator_group_post">Operator Group Post</option>
              <option value="complaint_post">Complaint Post</option>
              <option value="scraped_load_board_history">Scraped History</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div style={styles.configField}>
            <label style={styles.label}>Country Hint</label>
            <input
              style={styles.input}
              placeholder="e.g. US, CA, AU"
              value={countryHint}
              onChange={(e) => setCountryHint(e.target.value)}
              maxLength={2}
            />
          </div>
          <div style={styles.configField}>
            <label style={styles.label}>Batch Date</label>
            <input
              style={styles.input}
              type="date"
              value={suppliedDate}
              onChange={(e) => setSuppliedDate(e.target.value)}
            />
          </div>
        </div>

        <textarea
          style={styles.textarea}
          placeholder={`Paste load board alerts here...\n\nExample:\nMarch 15, 2026\nLoad Alert!! ABC Transport - Need lead car Dallas, TX to OKC, OK 918-555-1234 QP $500 350 miles\nLoad Alert!! XYZ Logistics chase needed Houston, TX to San Antonio, TX ASAP 832-555-5678 COD`}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={12}
        />

        <div style={styles.actionRow}>
          <button
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            onClick={handleIngest}
            disabled={loading}
          >
            {loading ? <span>⏳</span> : <span>🔍</span>}
            {loading ? ' Processing…' : ' Ingest & Analyze'}
          </button>
          <div style={styles.lineCount}>
            {rawText.split('\n').filter((l) => l.trim()).length} lines ready
          </div>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}
      </section>

      {/* Results */}
      {result && (
        <section style={styles.resultsSection}>
          <h2 style={styles.sectionTitle}>
            Batch Results
            <span style={styles.batchId}>{result.batch_id}</span>
            {result.persisted_to_supabase && (
              <span style={styles.persistBadge}>✅ Persisted to Supabase</span>
            )}
            {!result.persisted_to_supabase && (
              <span style={styles.persistBadgeWarn}>⚠️ In-memory only</span>
            )}
          </h2>

          {/* Summary Cards */}
          <div style={styles.cardGrid}>
            <SummaryCard label="Total Observations" value={result.total_observations} accent="#10b981" />
            <SummaryCard label="Lines Processed" value={result.total_lines_processed} accent="#06b6d4" />
            <SummaryCard label="Partially Parsed" value={result.total_lines_partially_parsed} accent="#f59e0b" />
            <SummaryCard label="Unparsed" value={result.total_unparsed_lines} accent="#ef4444" />
            <SummaryCard label="Board Velocity" value={`${Math.round(result.board_velocity_signal * 100)}%`} accent="#8b5cf6" />
            <SummaryCard label="Orgs Detected" value={result.total_unique_company_candidates} accent="#6366f1" />
            <SummaryCard label="Unique Phones" value={result.total_unique_phones} accent="#14b8a6" />
            <SummaryCard label="Unique Corridors" value={result.total_unique_corridor_pairs} accent="#f97316" />
            <SummaryCard label="Name Variants" value={result.total_unique_name_variants} accent="#ec4899" />
            <SummaryCard label="Price Observations" value={result.total_price_observations} accent="#22c55e" />
            <SummaryCard label="Reputation Flags" value={result.total_reputation_flagged_lines} accent="#ef4444" />
            <SummaryCard label="Truncated Lines" value={result.total_truncated_lines} accent="#64748b" />
          </div>

          {/* Observations by Day */}
          {Object.keys(result.observations_by_day).length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>📅 Observations by Day</h3>
              <div style={styles.dayGrid}>
                {Object.entries(result.observations_by_day)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, count]) => (
                    <div key={date} style={styles.dayCard}>
                      <div style={styles.dayDate}>{date}</div>
                      <div style={styles.dayCount}>{count}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Mixes */}
          <div style={styles.detailGrid}>
            <DetailPanel title="🚛 Service Type Mix" items={
              Object.entries(result.service_type_mix).map(([k, v]) => ({ label: k.replace(/_/g, ' '), value: v }))
            } />
            <DetailPanel title="⚡ Urgency Mix" items={
              Object.entries(result.urgency_mix).map(([k, v]) => ({ label: k.replace(/_/g, ' '), value: v }))
            } />
            <DetailPanel title="💰 Payment Mix" items={
              Object.entries(result.payment_term_mix).map(([k, v]) => ({ label: k.replace(/_/g, ' '), value: v }))
            } />
            <DetailPanel title="👤 Role Mix" items={
              Object.entries(result.role_mix).map(([k, v]) => ({ label: k.replace(/_/g, ' '), value: v }))
            } />
          </div>

          {/* Pricing Intelligence */}
          {result.pricing_summary.total_price_observations > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>💲 Pricing Intelligence</h3>
              <div style={styles.pricingGrid}>
                <div style={styles.pricingCard}>
                  <div style={styles.pricingValue}>{result.pricing_summary.total_price_observations}</div>
                  <div style={styles.pricingLabel}>Price Observations</div>
                </div>
                {result.pricing_summary.avg_quoted_amount && (
                  <div style={styles.pricingCard}>
                    <div style={styles.pricingValue}>${result.pricing_summary.avg_quoted_amount.toFixed(0)}</div>
                    <div style={styles.pricingLabel}>Avg Quoted Amount</div>
                  </div>
                )}
                {result.pricing_summary.avg_pay_per_mile && (
                  <div style={styles.pricingCard}>
                    <div style={styles.pricingValue}>${result.pricing_summary.avg_pay_per_mile.toFixed(2)}/mi</div>
                    <div style={styles.pricingLabel}>Avg Pay Per Mile</div>
                  </div>
                )}
              </div>
              {result.pricing_summary.price_by_corridor.length > 0 && (
                <>
                  <h4 style={{ ...styles.sectionSubtitle, fontSize: '0.8rem', marginTop: '1rem' }}>Price by Corridor</h4>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Corridor</th>
                        <th style={styles.th}>Avg Price</th>
                        <th style={styles.th}>Observations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.pricing_summary.price_by_corridor.map((item, i) => (
                        <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                          <td style={styles.td}>{item.corridor}</td>
                          <td style={styles.tdNum}>${item.avg_price.toFixed(0)}</td>
                          <td style={styles.tdNum}>{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* Top Repeat Names */}
          {result.top_repeat_names.length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>🔁 Top Repeat Names</h3>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Observations</th></tr></thead>
                <tbody>
                  {result.top_repeat_names.map((item, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{item.name}</td>
                      <td style={styles.tdNum}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top Corridors */}
          {result.top_repeat_corridors.length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>🗺️ Top Corridors</h3>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Corridor</th><th style={styles.th}>Volume</th></tr></thead>
                <tbody>
                  {result.top_repeat_corridors.map((item, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{item.corridor}</td>
                      <td style={styles.tdNum}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top Phones */}
          {result.top_repeat_phones.length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>📞 Top Repeat Phones</h3>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Phone</th><th style={styles.th}>Observations</th></tr></thead>
                <tbody>
                  {result.top_repeat_phones.map((item, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{item.phone}</td>
                      <td style={styles.tdNum}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Organizations Detected */}
          {result.new_organizations_detected.length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>🏢 Organizations Detected</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Phones</th>
                    <th style={styles.th}>Corridors</th>
                    <th style={styles.th}>Roles</th>
                    <th style={styles.th}>Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {result.new_organizations_detected.map((org, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{org.display_name}</td>
                      <td style={styles.td}>{org.phones.join(', ') || '—'}</td>
                      <td style={styles.td}>{org.corridors_seen?.length ?? 0}</td>
                      <td style={styles.td}>{org.role_candidates.map((r) => r.role.replace(/_/g, ' ')).join(', ')}</td>
                      <td style={styles.tdNum}>{org.observation_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Risk Signals */}
          {result.new_internal_risk_signals.length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>⚠️ Internal Risk Signals</h3>
              <div style={styles.riskBanner}>
                These signals are internal only and not displayed publicly until verified.
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Target</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Strength</th>
                    <th style={styles.th}>Raw Text</th>
                  </tr>
                </thead>
                <tbody>
                  {result.new_internal_risk_signals.map((sig, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{sig.target_name || '—'}</td>
                      <td style={styles.td}>{sig.signal_type}</td>
                      <td style={styles.td}>{sig.evidence_strength}</td>
                      <td style={{ ...styles.td, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sig.raw_text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Claim Candidates */}
          {result.top_claim_candidates.length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>🎯 Claim Candidates</h3>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Priority Score</th></tr></thead>
                <tbody>
                  {result.top_claim_candidates.map((item, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{item.name}</td>
                      <td style={styles.tdNum}>{(item.score * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Training Updates */}
          {result.training_updates && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>📊 Training & Seed Updates</h3>
              <div style={styles.trainingGrid}>
                <TrainingCard label="Entities Created" value={result.training_updates.entities_created} />
                <TrainingCard label="Aliases Created" value={result.training_updates.aliases_created} />
                <TrainingCard label="Corridors Created" value={result.training_updates.corridors_created} />
                <TrainingCard label="Reputation Obs" value={result.training_updates.reputation_observations_created} />
                <TrainingCard label="Volume Signals" value={result.training_updates.volume_signals_created} />
              </div>
            </div>
          )}

          {/* Monetization Updates */}
          {result.monetization_updates.length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionSubtitle}>💎 Monetization Updates</h3>
              <ul style={styles.updateList}>
                {result.monetization_updates.map((update, i) => (
                  <li key={i} style={styles.updateItem}>{update}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${accent}` }}>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  );
}

function DetailPanel({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div style={styles.detailCard}>
      <h3 style={styles.detailTitle}>{title}</h3>
      {items.map((item, i) => (
        <div key={i} style={styles.detailRow}>
          <span style={styles.detailLabel}>{item.label}</span>
          <div style={styles.detailBarContainer}>
            <div style={{ ...styles.detailBar, width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }} />
          </div>
          <span style={styles.detailValue}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function TrainingCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.trainingItem}>
      <div style={styles.trainingValue}>{value}</div>
      <div style={styles.trainingLabel}>{label}</div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #0a0e17 0%, #111827 50%, #0f172a 100%)',
    color: '#e2e8f0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: { marginBottom: '2rem', textAlign: 'center' as const },
  headerBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff', fontSize: '0.65rem', fontWeight: 700,
    letterSpacing: '0.15em', padding: '4px 14px',
    borderRadius: '9999px', marginBottom: '0.75rem',
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: '2rem', fontWeight: 800,
    background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    margin: '0 0 0.5rem',
  },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' },
  authBanner: {
    marginTop: '1rem', background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fbbf24',
    padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem',
    display: 'inline-block',
  },
  inputSection: {
    background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '16px',
    padding: '1.5rem', marginBottom: '2rem',
  },
  configRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  configField: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  label: { fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  input: {
    background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '8px', padding: '8px 12px', color: '#e2e8f0', fontSize: '0.85rem', outline: 'none',
  },
  select: {
    background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '8px', padding: '8px 12px', color: '#e2e8f0', fontSize: '0.85rem', outline: 'none',
  },
  textarea: {
    width: '100%', background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px',
    padding: '16px', color: '#e2e8f0', fontSize: '0.85rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineHeight: 1.6, resize: 'vertical' as const, outline: 'none',
    minHeight: '200px', boxSizing: 'border-box' as const,
  },
  actionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' },
  button: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px',
    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  lineCount: { color: '#64748b', fontSize: '0.8rem' },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5', padding: '10px 16px', borderRadius: '8px',
    marginTop: '1rem', fontSize: '0.85rem',
  },
  resultsSection: { marginTop: '2rem' },
  sectionTitle: {
    fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1.5rem',
    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const,
  },
  batchId: {
    fontSize: '0.7rem', color: '#64748b', fontWeight: 400, fontFamily: 'monospace',
    background: 'rgba(30, 41, 59, 0.8)', padding: '4px 10px', borderRadius: '6px',
  },
  persistBadge: {
    fontSize: '0.7rem', color: '#10b981', fontWeight: 600,
    background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  persistBadgeWarn: {
    fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600,
    background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '6px',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  cardGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem', marginBottom: '2rem',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '12px',
    padding: '1rem', textAlign: 'center' as const,
  },
  cardValue: { fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' },
  cardLabel: {
    fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: '4px',
  },
  dayGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  dayCard: {
    background: 'rgba(15, 23, 42, 0.6)', padding: '8px 16px',
    borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.15)',
    textAlign: 'center' as const,
  },
  dayDate: { fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' },
  dayCount: { fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0' },
  detailGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1rem', marginBottom: '2rem',
  },
  detailCard: {
    background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '12px', padding: '1.25rem',
  },
  detailTitle: { fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' },
  detailRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  detailLabel: { fontSize: '0.75rem', color: '#94a3b8', minWidth: '80px', textTransform: 'capitalize' as const },
  detailBarContainer: {
    flex: 1, height: '6px', background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '3px', overflow: 'hidden' as const,
  },
  detailBar: {
    height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    borderRadius: '3px', transition: 'width 0.3s ease',
  },
  detailValue: { fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', minWidth: '24px', textAlign: 'right' as const },
  pricingGrid: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, marginBottom: '1rem' },
  pricingCard: {
    background: 'rgba(15, 23, 42, 0.6)', padding: '12px 20px',
    borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' as const,
  },
  pricingValue: { fontSize: '1.3rem', fontWeight: 800, color: '#22c55e' },
  pricingLabel: { fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, marginTop: '4px' },
  tableSection: {
    background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '12px',
    padding: '1.25rem', marginBottom: '1rem',
  },
  sectionSubtitle: { fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.8rem' },
  th: {
    textAlign: 'left' as const, padding: '8px 12px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)', color: '#94a3b8',
    fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  },
  td: { padding: '8px 12px', borderBottom: '1px solid rgba(148, 163, 184, 0.05)', color: '#cbd5e1' },
  tdNum: {
    padding: '8px 12px', borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
    color: '#e2e8f0', fontWeight: 700, textAlign: 'right' as const, fontFamily: 'monospace',
  },
  trEven: { background: 'rgba(15, 23, 42, 0.3)' },
  riskBanner: {
    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
    color: '#fbbf24', padding: '8px 14px', borderRadius: '8px',
    fontSize: '0.75rem', marginBottom: '1rem',
  },
  trainingGrid: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const },
  trainingItem: {
    background: 'rgba(15, 23, 42, 0.6)', padding: '10px 18px',
    borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.15)', textAlign: 'center' as const,
  },
  trainingValue: { fontSize: '1.2rem', fontWeight: 800, color: '#a5b4fc' },
  trainingLabel: { fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, marginTop: '2px' },
  updateList: { listStyle: 'none', padding: 0, margin: 0 },
  updateItem: { padding: '8px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.05)', color: '#94a3b8', fontSize: '0.85rem' },
};
