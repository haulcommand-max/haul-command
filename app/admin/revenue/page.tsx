'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RevenueData {
  as_of: string;
  summary: { total_revenue_cents: number; total_revenue_usd: string };
  permit_filing: { revenue_usd: string; filed_count: number; pending_count: number; all_filings: number };
  insurance: { clicks: number; conversions: number; conversion_rate_pct: string; estimated_revenue_usd: string };
  certifications: { by_tier: Record<string,number>; estimated_revenue_usd: string };
  sponsors: { active_count: number; monthly_revenue_usd: string; sponsors: Array<{company:string;placement:string;fee_usd:string;impressions:number;clicks:number;ctr:string}> };
  content: { published_this_month: number; total_views_this_month: number };
  social: { posted_this_month: number; by_platform: Record<string,number>; draft_count: number; scheduled_count: number };
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_HC_ADMIN_SECRET_HINT || '';

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const load = async (s: string) => {
    setLoading(true);
    const res = await fetch('/api/admin/revenue', { headers: { 'x-admin-secret': s } });
    if (res.status === 401) { setAuthenticated(false); setLoading(false); return; }
    const d = await res.json();
    setData(d);
    setAuthenticated(true);
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); load(secret); };

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080808', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}>
        <form onSubmit={handleLogin} style={{
          background: '#111118', border: '1px solid #1a1a22',
          borderRadius: 16, padding: 40, width: 360,
        }}>
          <h1 style={{ color: '#F5A623', fontSize: 20, fontWeight: 800, marginBottom: 24 }}>
            ðŸ” Revenue Dashboard
          </h1>
          <input
            type="password"
            placeholder="Admin secret key"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', background: '#0c0c10',
              border: '1px solid #2a2a3a', borderRadius: 8, color: '#e8e8e8',
              fontSize: 14, marginBottom: 16, boxSizing: 'border-box',
            }}
          />
          <button aria-label="Interactive Button" type="submit" style={{
            width: '100%', padding: 13, background: 'linear-gradient(135deg, #F5A623, #e08820)',
            color: '#000', border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}>
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', fontFamily: 'Inter,sans-serif' }}>
        Loading revenue data...
      </div>
    );
  }

  const MetricCard = ({ label, value, sub, color = '#F5A623', href }: { label: string; value: string; sub?: string; color?: string; href?: string }) => (
    <div style={{
      background: '#111118', border: '1px solid #1a1a22', borderRadius: 14, padding: '20px 24px',
    }}>
      <div style={{ fontSize: 11, color: '#5a5a6a', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: '-0.02em', marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#6a6a7a' }}>{sub}</div>}
      {href && <Link aria-label="Navigation Link" href={href} style={{ fontSize: 12, color: '#F5A623', textDecoration: 'none', display: 'block', marginTop: 8 }}>View details â†’</Link>}
    </div>
  );

  const totalUsd = `$${Number(data.summary.total_revenue_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e8e8e8', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#0c0c10', borderBottom: '1px solid #1a1a22', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Revenue Dashboard</h1>
          <p style={{ color: '#5a5a6a', fontSize: 12, margin: '4px 0 0' }}>
            As of {new Date(data.as_of).toLocaleString()} â€” current month
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link aria-label="Navigation Link" href="/admin/content" style={{ padding: '8px 16px', borderRadius: 8, background: '#111118', border: '1px solid #2a2a3a', color: '#9a9ab0', fontSize: 13, textDecoration: 'none' }}>Content â†’</Link>
          <Link aria-label="Navigation Link" href="/admin/social" style={{ padding: '8px 16px', borderRadius: 8, background: '#111118', border: '1px solid #2a2a3a', color: '#9a9ab0', fontSize: 13, textDecoration: 'none' }}>Social â†’</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Total MRR */}
        <div style={{
          background: 'linear-gradient(160deg, #141420 0%, #1a1a0a 100%)',
          border: '1px solid rgba(245,166,35,0.2)',
          borderRadius: 18, padding: '28px 32px', marginBottom: 32,
          boxShadow: '0 0 40px rgba(245,166,35,0.06)',
        }}>
          <div style={{ fontSize: 12, color: '#F5A623', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>MONTHLY REVENUE (ESTIMATED)</div>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', color: '#F5A623' }}>{totalUsd}</div>
          <div style={{ fontSize: 13, color: '#6a6a7a', marginTop: 4 }}>Across permits, certifications, sponsors, insurance referrals</div>
        </div>

        {/* Revenue breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
          <MetricCard label="Permit Filing" value={`$${data.permit_filing.revenue_usd}`} sub={`${data.permit_filing.filed_count} filed Â· ${data.permit_filing.pending_count} pending`} color="#22c55e" href="/admin/permits" />
          <MetricCard label="Insurance Referrals" value={`$${data.insurance.estimated_revenue_usd}`} sub={`${data.insurance.clicks} clicks Â· ${data.insurance.conversions} conversions (${data.insurance.conversion_rate_pct}%)`} color="#3b82f6" />
          <MetricCard label="Certifications" value={`$${data.certifications.estimated_revenue_usd}`} sub={Object.entries(data.certifications.by_tier).map(([k,v]) => `${v} ${k}`).join(' Â· ')} color="#a855f7" href="/admin/certifications" />
          <MetricCard label="Sponsors" value={`$${data.sponsors.monthly_revenue_usd}`} sub={`${data.sponsors.active_count} active sponsors this month`} color="#F5A623" />
        </div>

        {/* Content + Social row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#111118', border: '1px solid #1a1a22', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: '#5a5a6a', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 16 }}>CONTENT THIS MONTH</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{data.content.published_this_month}</div>
                <div style={{ fontSize: 12, color: '#6a6a7a' }}>published articles</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{data.content.total_views_this_month.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#6a6a7a' }}>article views</div>
              </div>
            </div>
            <Link aria-label="Navigation Link" href="/admin/content" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, color: '#F5A623', textDecoration: 'none' }}>Manage content â†’</Link>
          </div>

          <div style={{ background: '#111118', border: '1px solid #1a1a22', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: '#5a5a6a', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 16 }}>SOCIAL THIS MONTH</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#F5A623' }}>{data.social.posted_this_month}</div>
                <div style={{ fontSize: 12, color: '#6a6a7a' }}>posts published</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24' }}>{data.social.draft_count}</div>
                <div style={{ fontSize: 12, color: '#6a6a7a' }}>awaiting approval</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{data.social.scheduled_count}</div>
                <div style={{ fontSize: 12, color: '#6a6a7a' }}>scheduled</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {Object.entries(data.social.by_platform).map(([platform, count]) => (
                <span key={platform} style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 20,
                  background: 'rgba(245,166,35,0.1)', color: '#F5A623', fontWeight: 700,
                }}>
                  {platform}: {count}
                </span>
              ))}
            </div>
            <Link aria-label="Navigation Link" href="/admin/social" style={{ fontSize: 12, color: '#F5A623', textDecoration: 'none' }}>Manage social â†’</Link>
          </div>
        </div>

        {/* Active Sponsors Table */}
        {data.sponsors.sponsors.length > 0 && (
          <div style={{ background: '#111118', border: '1px solid #1a1a22', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#5a5a6a', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 16 }}>ACTIVE SPONSORS</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a22' }}>
                    {['Company', 'Placement', 'Fee/mo', 'Impressions', 'Clicks', 'CTR'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#5a5a6a', fontWeight: 700, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sponsors.sponsors.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.company}</td>
                      <td style={{ padding: '10px 12px', color: '#9a9ab0' }}>{s.placement}</td>
                      <td style={{ padding: '10px 12px', color: '#22c55e', fontWeight: 700 }}>${s.fee_usd}</td>
                      <td style={{ padding: '10px 12px' }}>{s.impressions.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>{s.clicks.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: '#F5A623' }}>{s.ctr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}