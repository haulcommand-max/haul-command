'use client';

import { useState, useEffect, use } from 'react';
import { HCBadge, BadgeTier } from '@/components/training/HCBadge';

interface CertData {
  id: string;
  operator_name: string;
  certification_tier: string;
  tier_label: string;
  status: 'ACTIVE' | 'EXPIRED';
  date_issued: string;
  expires_at: string;
  score: number;
  certifying_body: string;
  standard: string;
}

const TIER_BADGE_MAP: Record<string, BadgeTier> = {
  hc_certified: 'silver',
  av_ready: 'gold',
  elite: 'platinum',
};

export default function VerifyPage({ params }: { params: Promise<{ certification_id: string }> }) {
  const { certification_id } = use(params);
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/training/certificate/${certification_id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setCert(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [certification_id]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return iso; }
  };

  const daysUntilExpiry = cert ? Math.ceil((new Date(cert.expires_at).getTime() - Date.now()) / 86400000) : 0;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080808', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#F5A623',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
          <div style={{ fontWeight: 600 }}>Verifying credential...</div>
        </div>
      </div>
    );
  }

  if (notFound || !cert) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080808', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#e8e8e8',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Credential Not Found</h1>
          <p style={{ color: '#6a6a7a', marginBottom: 24 }}>
            This certification ID is not valid or has been revoked.
          </p>
          <a href="/training" style={{ color: '#F5A623', textDecoration: 'none', fontSize: 14 }}>
            → Learn about HC Certified training
          </a>
        </div>
      </div>
    );
  }

  const isActive = cert.status === 'ACTIVE';
  const badge = TIER_BADGE_MAP[cert.certification_tier] || 'silver';

  return (
    <div style={{
      minHeight: '100vh', background: '#080808', color: '#e8e8e8',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '40px 24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 40, color: '#6a6a7a', fontSize: 14,
      }}>
        <span style={{ fontSize: 20 }}>🔐</span>
        <span>Haul Command</span>
        <span>›</span>
        <span>Certification Verification</span>
      </div>

      {/* Main card */}
      <div style={{
        background: 'linear-gradient(160deg, #111118 0%, #0f0f16 100%)',
        border: `2px solid ${isActive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        borderRadius: 24,
        padding: '36px 36px 32px',
        maxWidth: 540,
        width: '100%',
        boxShadow: isActive ? '0 0 60px rgba(34,197,94,0.08)' : 'none',
      }}>
        {/* Status banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6a6a7a', letterSpacing: '0.06em' }}>
            CREDENTIAL VERIFICATION
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: isActive ? '#22c55e' : '#ef4444',
            padding: '5px 14px', borderRadius: 20,
            fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isActive ? '#22c55e' : '#ef4444',
              animation: isActive ? 'pulse 2s infinite' : 'none',
            }} />
            {cert.status}
          </div>
        </div>

        {/* Operator + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <HCBadge tier={badge} size={80} animated style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {cert.operator_name}
            </div>
            <div style={{ fontSize: 15, color: cert.certification_tier === 'av_ready' ? '#F5A623' : cert.certification_tier === 'elite' ? '#E5E4E2' : '#A8A8A8', fontWeight: 700 }}>
              {cert.tier_label}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          background: '#0c0c10', borderRadius: 12, padding: 20,
          marginBottom: 24,
        }}>
          {[
            { label: 'Date Issued', value: formatDate(cert.date_issued) },
            { label: 'Expires', value: formatDate(cert.expires_at) },
            { label: 'Pass Score', value: cert.score ? `${cert.score}%` : 'N/A' },
            {
              label: isActive ? 'Days Remaining' : 'Status',
              value: isActive ? `${daysUntilExpiry} days` : 'EXPIRED',
              color: daysUntilExpiry < 30 ? '#ef4444' : '#22c55e',
            },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: '#5a5a6a', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                {item.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: item.color || '#e8e8e8' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Certifying body */}
        <div style={{
          background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.12)',
          borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#8a8a7a', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#F5A623' }}>Issued by {cert.certifying_body}</strong>
          <br />
          {cert.standard}
        </div>

        {/* Verification ID */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#3a3a4a', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            Certification ID: {cert.id}
          </div>
          <div style={{ fontSize: 11, color: '#3a3a4a', marginTop: 4 }}>
            haulcommand.com/training/verify/{cert.id}
          </div>
        </div>
      </div>

      {/* Learn more */}
      <div style={{ marginTop: 32, textAlign: 'center', color: '#5a5a6a', fontSize: 13 }}>
        <a href="/training" style={{ color: '#F5A623', textDecoration: 'none' }}>
          Learn about HC Certified training →
        </a>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
