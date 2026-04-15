'use client';

import { useState } from 'react';

const TIERS = [
  {
    name: 'Starter Cohort',
    operators: 'Up to 25 operators',
    price: '$5,000',
    includes: [
      'All 7 modules',
      'Custom AV protocol section for your trucks',
      'Digital certificates for all operators',
      'Priority corridor placement on Haul Command',
    ],
  },
  {
    name: 'Standard Cohort',
    operators: 'Up to 100 operators',
    price: '$15,000',
    highlight: true,
    includes: [
      'Everything in Starter',
      'Co-branded certification badge',
      'Dedicated corridor filter in Haul Command',
      'Quarterly recertification reminders',
    ],
  },
  {
    name: 'Enterprise',
    operators: 'Unlimited operators',
    price: 'Custom',
    includes: [
      'Everything in Standard',
      'White-label option',
      'Custom module additions for proprietary protocols',
      'API access to certification status of operators',
    ],
  },
];

export default function CorporateTrainingPage() {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    estimated_operators: '', corridors: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/training/corporate-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#e8e8e8',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #0c0c0c 0%, #101018 100%)',
        padding: '80px 24px 64px',
        textAlign: 'center',
        borderBottom: '1px solid #1a1a22',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 700, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(245,166,35,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)',
          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700,
          color: '#F5A623', letterSpacing: '0.06em', marginBottom: 20,
        }}>
          ðŸ¢ CORPORATE TRAINING
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900, margin: '0 0 20px',
          letterSpacing: '-0.02em', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #fff 0%, #F5A623 70%, #fff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Certify Your Escort Network
        </h1>

        <p style={{
          fontSize: 18, color: '#8a8a9a', maxWidth: 680, margin: '0 auto 32px', lineHeight: 1.65,
        }}>
          Aurora, Kodiak, Uber Freight, Ryder, Hirschbach, Atlas Energy — if your operations require
          verified, trained escort operators, we can certify your preferred network and prioritize
          them on your corridors.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[
            { val: '$5K"“$25K', label: 'Per cohort' },
            { val: '7 Modules', label: 'Full curriculum' },
            { val: '50+ countries', label: 'Global recognition' },
            { val: '24h', label: 'Response time' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F5A623' }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#6a6a7a' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '64px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 40, textAlign: 'center', letterSpacing: '-0.02em' }}>
          How It Works
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { step: '1', title: 'Tell us your needs', desc: 'Your corridors, load types, AV systems, and operator count.' },
            { step: '2', title: 'Custom cohort built', desc: 'We build training with your specific AV protocols, load types, and regional requirements.' },
            { step: '3', title: 'Operators certify', desc: 'Operators complete the program. Co-branded badge appears on their Haul Command profile.' },
            { step: '4', title: 'Corridor priority', desc: 'We surface certified operators first when you post loads on your corridors.' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#111118', border: '1px solid rgba(245,166,35,0.1)',
              borderRadius: 14, padding: 24,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5A623, #e08820)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: '#000', marginBottom: 14,
              }}>
                {s.step}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#7a7a8a', lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{
        background: '#0c0c10', borderTop: '1px solid #1a1a22', borderBottom: '1px solid #1a1a22',
        padding: '64px 24px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, textAlign: 'center', letterSpacing: '-0.02em' }}>
            Corporate Pricing
          </h2>
          <p style={{ color: '#6a6a7a', textAlign: 'center', marginBottom: 40 }}>
            All cohorts include digital certificates, priority placement, and quarterly recertification reminders.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TIERS.map((tier, i) => (
              <div key={i} style={{
                background: tier.highlight
                  ? 'linear-gradient(160deg, #141420 0%, #1a1a0a 100%)'
                  : '#111118',
                border: `1px solid ${tier.highlight ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 18, padding: 28,
                boxShadow: tier.highlight ? '0 0 40px rgba(245,166,35,0.1)' : 'none',
                position: 'relative',
              }}>
                {tier.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #F5A623, #e08820)',
                    color: '#000', fontSize: 10, fontWeight: 800,
                    padding: '4px 12px', borderRadius: 20, letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{tier.name}</div>
                <div style={{ fontSize: 13, color: '#6a6a7a', marginBottom: 16 }}>{tier.operators}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#F5A623', marginBottom: 20 }}>
                  {tier.price}
                </div>
                <div style={{ borderTop: '1px solid #1a1a22', paddingTop: 16 }}>
                  {tier.includes.map((item, j) => (
                    <div key={j} style={{
                      display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.5,
                      color: '#9a9ab0', marginBottom: 8,
                    }}>
                      <span style={{ color: '#22c55e', flexShrink: 0 }}>âœ“</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section style={{ padding: '64px 24px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Request Corporate Training Info
          </h2>
          <p style={{ color: '#6a6a7a', fontSize: 15 }}>
            We typically respond within 24 hours. Custom proposals arrive within 3 business days.
          </p>
        </div>

        {submitted ? (
          <div style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 16, padding: 40, textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>âœ…</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Request Received</h3>
            <p style={{ color: '#6a6a7a', lineHeight: 1.65 }}>
              Our team will review your request and respond within 24 hours at the email you provided.
              We'll send a custom cohort proposal within 3 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'company_name', label: 'Company Name *', type: 'text', required: true },
              { key: 'contact_name', label: 'Contact Name *', type: 'text', required: true },
              { key: 'email', label: 'Email *', type: 'email', required: true },
              { key: 'phone', label: 'Phone (optional)', type: 'tel', required: false },
              { key: 'estimated_operators', label: 'Estimated Operator Count', type: 'number', required: false },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9a9ab0', marginBottom: 8 }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required={field.required}
                  id={`corp-${field.key}`}
                  value={(form as Record<string, string>)[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: '#111118', border: '1px solid #2a2a3a',
                    borderRadius: 10, color: '#e8e8e8', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#F5A623'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#2a2a3a'; }}
                />
              </div>
            ))}

            {[
              { key: 'corridors', label: 'Your corridors / routes (describe key areas)', rows: 3 },
              { key: 'message', label: 'Additional context or questions', rows: 4 },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9a9ab0', marginBottom: 8 }}>
                  {field.label}
                </label>
                <textarea
                  id={`corp-${field.key}`}
                  rows={field.rows}
                  value={(form as Record<string, string>)[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: '#111118', border: '1px solid #2a2a3a',
                    borderRadius: 10, color: '#e8e8e8', fontSize: 14,
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#F5A623'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#2a2a3a'; }}
                />
              </div>
            ))}

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444',
              }}>
                {error}
              </div>
            )}

            <button aria-label="Interactive Button"
              type="submit"
              disabled={submitting}
              style={{
                padding: '14px 24px',
                background: submitting
                  ? 'rgba(245,166,35,0.3)'
                  : 'linear-gradient(135deg, #F5A623, #e08820)',
                color: '#000', border: 'none', borderRadius: 10,
                fontSize: 16, fontWeight: 800, cursor: submitting ? 'wait' : 'pointer',
                letterSpacing: '0.01em', transition: 'transform 0.15s',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              {submitting ? 'Sending...' : 'Request Corporate Training Info â†’'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}