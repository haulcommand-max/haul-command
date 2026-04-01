'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HCBadge, BadgeTier } from '@/components/training/HCBadge';

interface Certification {
  id: string;
  certification_tier: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  expires_at: string | null;
  score: number | null;
}

interface ModuleProgress {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  certification_tier: string;
  duration_minutes: number;
  progress: {
    status: string;
    score: number | null;
    attempts: number;
  } | null;
}

const TIER_BADGE_MAP: Record<string, BadgeTier> = {
  hc_certified: 'silver',
  av_ready: 'gold',
  elite: 'platinum',
};

const TIER_NAMES: Record<string, string> = {
  hc_certified: 'HC Certified',
  av_ready: 'HC AV-Ready',
  elite: 'HC Elite',
};

const TIER_COLORS: Record<string, string> = {
  hc_certified: '#A8A8A8',
  av_ready: '#F5A623',
  elite: '#E5E4E2',
};

const STATUS_COLORS: Record<string, string> = {
  passed: '#22c55e',
  not_started: '#4a4a5a',
  in_progress: '#F5A623',
  failed: '#ef4444',
  completed: '#3b82f6',
};

export default function CertificationsDashboard() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/training/my-certifications')
      .then(r => {
        if (r.status === 401) {
          window.location.href = '/auth/login?return=/dashboard/certifications';
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (data) {
          setCertifications(data.certifications || []);
          setModuleProgress(data.module_progress || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return iso; }
  };

  const daysUntilExpiry = (isoDate: string | null) => {
    if (!isoDate) return null;
    return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000);
  };

  const share = (cert: Certification) => {
    const url = `${window.location.origin}/training/verify/${cert.id}`;
    const text = `I just earned my ${TIER_NAMES[cert.certification_tier]} Certification from Haul Command — the only global training program for escort operators working in heavy haul, wind energy, oilfield, and autonomous vehicle corridors. #HaulCommand #PilotCar #HeavyHaul ${url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setShareMsg('Copied to clipboard!');
        setTimeout(() => setShareMsg(null), 3000);
      });
    }
  };

  const activeCerts = certifications.filter(c => c.status === 'passed');
  const inProgressTiers = ['hc_certified', 'av_ready', 'elite'].filter(
    tier => !certifications.some(c => c.certification_tier === tier && c.status === 'passed')
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080808', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#F5A623',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 600 }}>Loading your certifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080808', color: '#e8e8e8',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      {shareMsg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          background: 'rgba(34,197,94,0.95)', color: '#000',
          padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          ✓ {shareMsg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: '#0c0c10', borderBottom: '1px solid #1a1a22',
        padding: '20px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>My Certifications</h1>
          <p style={{ fontSize: 13, color: '#6a6a7a', margin: '4px 0 0' }}>
            {activeCerts.length} active credential{activeCerts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/training" style={{
          padding: '10px 20px', borderRadius: 8,
          background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)',
          color: '#F5A623', fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          + Enroll in Training
        </Link>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* ── ACTIVE CERTIFICATIONS ── */}
        {activeCerts.length > 0 ? (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Active Credentials</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeCerts.map(cert => {
                const days = daysUntilExpiry(cert.expires_at);
                const isExpiringSoon = days !== null && days < 30;
                const tierColor = TIER_COLORS[cert.certification_tier] || '#F5A623';

                return (
                  <div key={cert.id} style={{
                    background: 'linear-gradient(160deg, #111118 0%, #0f0f16 100%)',
                    border: `1px solid ${isExpiringSoon ? 'rgba(239,68,68,0.3)' : `${tierColor}25`}`,
                    borderRadius: 18, padding: '24px 28px',
                    boxShadow: `0 0 30px ${tierColor}08`,
                  }}>
                    {isExpiringSoon && (
                      <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                        fontSize: 13, color: '#ef4444', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        ⚠️ Your {TIER_NAMES[cert.certification_tier]} expires in {days} days. Renew now to keep your badge active.
                        <Link href="/training" style={{ color: '#F5A623', marginLeft: 'auto', flexShrink: 0, textDecoration: 'none' }}>
                          Renew →
                        </Link>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                      <HCBadge
                        tier={TIER_BADGE_MAP[cert.certification_tier] || 'silver'}
                        size={68}
                        animated
                        verifyHref={`/training/verify/${cert.id}`}
                        showTooltip
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: tierColor, marginBottom: 4 }}>
                          {TIER_NAMES[cert.certification_tier] || cert.certification_tier}
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                          color: '#22c55e', fontSize: 11, fontWeight: 800,
                          padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em',
                          marginBottom: 12,
                        }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                          ACTIVE
                        </div>

                        <div style={{
                          display: 'flex', gap: 24, flexWrap: 'wrap',
                          fontSize: 13, color: '#7a7a8a',
                        }}>
                          <span>Earned: <strong style={{ color: '#e8e8e8' }}>{formatDate(cert.completed_at)}</strong></span>
                          <span>Expires: <strong style={{ color: days !== null && days < 30 ? '#ef4444' : '#e8e8e8' }}>{formatDate(cert.expires_at)}</strong></span>
                          {cert.score && <span>Score: <strong style={{ color: '#e8e8e8' }}>{cert.score}%</strong></span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        <Link href={`/training/verify/${cert.id}`} target="_blank"
                          style={{
                            padding: '8px 16px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a3a',
                            color: '#9a9ab0', fontSize: 12, fontWeight: 600,
                            textDecoration: 'none', textAlign: 'center',
                          }}>
                          🔗 Verify
                        </Link>
                        <button
                          onClick={() => share(cert)}
                          style={{
                            padding: '8px 16px', borderRadius: 8,
                            background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
                            color: '#F5A623', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                          }}>
                          📤 Share
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div style={{
            background: '#111118', border: '1px solid #1a1a22',
            borderRadius: 14, padding: '32px 24px', textAlign: 'center', marginBottom: 48,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏅</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No active certifications yet</h3>
            <p style={{ color: '#6a6a7a', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
              Certified operators get 3x more load offers and priority placement in AV corridor searches.<br />
              Module 1 is completely free.
            </p>
            <Link href="/training/platform-fundamentals" style={{
              display: 'inline-block', padding: '12px 24px', borderRadius: 10,
              background: 'linear-gradient(135deg, #F5A623, #e08820)',
              color: '#000', fontWeight: 800, textDecoration: 'none', fontSize: 14,
            }}>
              🎓 Start Module 1 — Free
            </Link>
          </div>
        )}

        {/* ── MODULE PROGRESS ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Module Progress</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {moduleProgress.map(m => {
              const tierColor = TIER_COLORS[m.certification_tier] || '#F5A623';
              const status = m.progress?.status || 'not_started';
              const statusColor = STATUS_COLORS[status] || '#4a4a5a';

              return (
                <div key={m.id} style={{
                  background: '#111118',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${tierColor}15`, border: `1px solid ${tierColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: tierColor,
                  }}>
                    {m.order_index}
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: '#6a6a7a', marginTop: 2 }}>
                      ⏱ {m.duration_minutes}m
                    </div>
                  </div>

                  <div style={{
                    fontSize: 11, fontWeight: 700, color: statusColor,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    minWidth: 80, textAlign: 'right',
                  }}>
                    {status.replace('_', ' ')}
                    {m.progress?.score !== null && m.progress?.score !== undefined && ` — ${m.progress.score}%`}
                  </div>

                  <Link href={`/training/${m.slug}`} style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: status === 'passed'
                      ? 'rgba(34,197,94,0.1)'
                      : `${tierColor}15`,
                    border: `1px solid ${status === 'passed' ? 'rgba(34,197,94,0.2)' : `${tierColor}30`}`,
                    color: status === 'passed' ? '#22c55e' : tierColor,
                    fontSize: 12, fontWeight: 700,
                    textDecoration: 'none', flexShrink: 0,
                  }}>
                    {status === 'passed' ? '✓ Review' : status === 'in_progress' ? 'Resume →' : 'Start →'}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
