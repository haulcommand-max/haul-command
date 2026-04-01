'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const PLANS = [
  {
    code: 'ron',
    name: 'Run of Network',
    price: 19,
    color: '#00ccff',
    description: 'Your ad across all Haul Command placements. Maximum reach.',
    features: ['Load board placements', 'Directory sidebar', 'All corridors', '50K–150K impressions/mo'],
    badge: 'BEST VALUE',
  },
  {
    code: 'corridor',
    name: 'Corridor Targeted',
    price: 59,
    color: '#f5c842',
    description: 'Target operators on specific corridors and states.',
    features: ['Load board + corridor pages', 'State + corridor targeting', 'Audience segment selection', '10K–40K targeted impressions/mo'],
    badge: 'MOST POPULAR',
  },
  {
    code: 'exclusive',
    name: 'Exclusive Corridor',
    price: 149,
    color: '#ff9500',
    description: 'Own a corridor. Your logo only. No competitors.',
    features: ['All placements', 'Exclusive corridor ownership', 'Co-branded corridor page', 'Push notification add-on included', '5K–15K exclusive impressions/mo'],
    badge: 'PREMIUM',
  },
];

const AUDIENCE_SEGMENTS = [
  { code: 'all',       name: 'All Operators',        count: '7,700+', icon: '👥' },
  { code: 'fuel_card', name: 'Fuel Card Seekers',    count: '7,700+', icon: '⛽' },
  { code: 'insurance', name: 'Unverified (Insurance)',count: '3,200+', icon: '🛡️' },
  { code: 'equipment', name: 'New Operators (0-12mo)',count: '1,100+', icon: '🔧' },
  { code: 'hotel',     name: 'Multi-Day Corridors',  count: '2,400+', icon: '🏨' },
  { code: 'oilfield',  name: 'Oilfield Specialists', count: '890+',   icon: '🛢️' },
  { code: 'av_ready',  name: 'AV-Ready Certified',   count: '340+',   icon: '🤖' },
];

const PLACEMENTS = [
  { code: 'load_board',     name: 'Load Board',         icon: '📋', desc: 'Top of load listing feed' },
  { code: 'directory',      name: 'Operator Directory', icon: '📍', desc: 'Sidebar banner' },
  { code: 'corridor_page',  name: 'Corridor Pages',     icon: '🗺️', desc: 'Dedicated corridor intel page' },
  { code: 'app_push',       name: 'App Push ($29 add-on)', icon: '📲', desc: 'Push notification to app users' },
  { code: 'training_page',  name: 'Training Pages',     icon: '🎓', desc: 'Academy sidebar' },
  { code: 'av_regs_page',   name: 'AV Regulations',     icon: '🤖', desc: 'AV regulation hub pages' },
];

type Step = 'plan' | 'targeting' | 'creative' | 'checkout';

export default function AdvertiseDashboard() {
  const [step, setStep] = useState<Step>('plan');
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(['load_board','directory']);
  const [targetCorridors, setTargetCorridors] = useState('');
  const [targetStates, setTargetStates] = useState('');
  const [creative, setCreative] = useState({ headline: '', body: '', cta_text: 'Get Started', cta_url: '', ai_generate: false });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const STEPS: { id: Step; label: string }[] = [
    { id: 'plan', label: '1. Choose Plan' },
    { id: 'targeting', label: '2. Targeting' },
    { id: 'creative', label: '3. Creative' },
    { id: 'checkout', label: '4. Launch' },
  ];

  const togglePlacement = (code: string) => {
    setSelectedPlacements(p => p.includes(code) ? p.filter(x => x !== code) : [...p, code]);
  };

  const generateAI = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/adgrid/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          audience_segment: selectedSegment,
          plan: selectedPlan?.code,
          cta_url: creative.cta_url,
        }),
      });
      const data = await res.json();
      if (data.headline) {
        setCreative(p => ({ ...p, headline: data.headline, body: data.body, cta_text: data.cta_text || 'Learn More' }));
      }
    } catch(e){ console.error(e); }
    finally { setAiGenerating(false); }
  };

  const submit = async () => {
    if (!selectedPlan || !companyName || !contactEmail) return;
    setSubmitting(true);
    try {
      await fetch('/api/adgrid/campaign-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          contact_email: contactEmail,
          plan_code: selectedPlan.code,
          plan_monthly_fee: selectedPlan.price,
          target_audience_segment: selectedSegment,
          placements: selectedPlacements,
          target_corridors: targetCorridors.split(',').map(s => s.trim()).filter(Boolean),
          target_states: targetStates.split(',').map(s => s.trim()).filter(Boolean),
          creative,
        }),
      });
      setSubmitted(true);
    } catch(e){ console.error(e); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#07090f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>🚀</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#f0f4f8', marginBottom: 12 }}>Campaign Submitted!</h1>
          <p style={{ color: '#8fa3c0', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            Your {selectedPlan?.name} campaign is under review. We'll approve and launch within 24 hours.
            You'll receive a confirmation email at <strong style={{ color: '#f0f4f8' }}>{contactEmail}</strong>.
          </p>
          <Link href="/advertise">
            <button aria-label="Interactive Button" style={{
              background: 'linear-gradient(90deg, #f5c842, #ff9500)',
              color: '#07090f', border: 'none', borderRadius: 12,
              padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            }}>View Campaign Dashboard</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e0e0e6', fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #07090f, #0a1020)', borderBottom: '1px solid #1a223a', padding: '40px 24px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 16, background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.25)', color: '#f5c842', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>
          📣 REACH 7,700+ ACTIVE ESCORT OPERATORS
        </div>
        <h1 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: 900, margin: '0 0 12px', color: '#f0f4f8' }}>
          Advertise on Haul Command
        </h1>
        <p style={{ color: '#8fa3c0', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          The only ad platform targeting escort operators, heavy haul brokers, and logistics professionals. Fuel cards, insurance, equipment providers — this is your audience.
        </p>
      </div>

      {/* Step nav */}
      <div style={{ background: '#0a0d16', borderBottom: '1px solid #1a223a', padding: '0 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex' }}>
          {STEPS.map((s, i) => (
            <button aria-label="Interactive Button" key={s.id} onClick={() => selectedPlan && setStep(s.id)} style={{
              flex: 1, padding: '14px 0', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: selectedPlan ? 'pointer' : 'default',
              borderBottom: step === s.id ? '2px solid #f5c842' : '2px solid transparent',
              color: step === s.id ? '#f5c842' : '#8fa3c0',
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* STEP 1: Plans */}
        {step === 'plan' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Choose your advertising plan</h2>
            <p style={{ color: '#8fa3c0', marginBottom: 32 }}>All plans include: real-time impression tracking, click reporting, and the Haul Command audience.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
              {PLANS.map(plan => (
                <div key={plan.code} onClick={() => setSelectedPlan(plan)} style={{
                  background: selectedPlan?.code === plan.code ? `rgba(${plan.color === '#00ccff' ? '0,204,255' : plan.color === '#f5c842' ? '245,200,66' : '255,149,0'},0.08)` : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${selectedPlan?.code === plan.code ? plan.color : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 20, padding: 24, cursor: 'pointer', position: 'relative',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ position: 'absolute', top: -10, right: 16, background: plan.color, color: '#07090f', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 10 }}>{plan.badge}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: plan.color, marginBottom: 4 }}>${plan.price}<span style={{ fontSize: 14, fontWeight: 500, color: '#8fa3c0' }}>/mo</span></div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#f0f4f8', marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.6, marginBottom: 16 }}>{plan.description}</div>
                  {plan.features.map(f => (
                    <div key={f} style={{ fontSize: 12, color: '#b0bcd0', marginBottom: 4 }}>✓ {f}</div>
                  ))}
                </div>
              ))}
            </div>
            {/* Company + email on step 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, color: '#8fa3c0', display: 'block', marginBottom: 6 }}>Company Name *</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Fuel Cards" style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 14px', color: '#f0f4f8', fontSize: 14, boxSizing: 'border-box',
                }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8fa3c0', display: 'block', marginBottom: 6 }}>Contact Email *</label>
                <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="marketing@company.com" type="email" style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 14px', color: '#f0f4f8', fontSize: 14, boxSizing: 'border-box',
                }} />
              </div>
            </div>
            <button aria-label="Interactive Button" disabled={!selectedPlan || !companyName || !contactEmail} onClick={() => setStep('targeting')} style={{
              background: selectedPlan ? 'linear-gradient(90deg, #f5c842, #ff9500)' : '#2a2a3a',
              color: selectedPlan ? '#07090f' : '#8fa3c0', border: 'none', borderRadius: 12,
              padding: '14px 32px', fontSize: 15, fontWeight: 800, cursor: selectedPlan ? 'pointer' : 'not-allowed', width: '100%',
            }}>
              {selectedPlan ? `Continue with ${selectedPlan.name} → ` : 'Select a plan to continue'}
            </button>
          </div>
        )}

        {/* STEP 2: Targeting */}
        {step === 'targeting' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Target your audience</h2>
            <p style={{ color: '#8fa3c0', marginBottom: 28 }}>Choose who sees your ads. The more specific, the higher the intent.</p>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', display: 'block', marginBottom: 12 }}>Audience Segment</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {AUDIENCE_SEGMENTS.map(seg => (
                  <div key={seg.code} onClick={() => setSelectedSegment(seg.code)} style={{
                    background: selectedSegment === seg.code ? 'rgba(245,200,66,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedSegment === seg.code ? '#f5c842' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{seg.icon}</span>
                      <span style={{ fontSize: 11, color: '#f5c842', fontWeight: 700 }}>{seg.count}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4f8' }}>{seg.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', display: 'block', marginBottom: 12 }}>Ad Placements</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {PLACEMENTS.map(p => (
                  <div key={p.code} onClick={() => togglePlacement(p.code)} style={{
                    background: selectedPlacements.includes(p.code) ? 'rgba(0,204,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedPlacements.includes(p.code) ? '#00ccff' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{p.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#8fa3c0', marginTop: 4 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPlan?.code !== 'ron' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8fa3c0', display: 'block', marginBottom: 6 }}>Target Corridors (comma-separated)</label>
                  <input value={targetCorridors} onChange={e => setTargetCorridors(e.target.value)} placeholder="I-45, US-287, I-10" style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px 14px', color: '#f0f4f8', fontSize: 14, boxSizing: 'border-box',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8fa3c0', display: 'block', marginBottom: 6 }}>Target States (comma-separated)</label>
                  <input value={targetStates} onChange={e => setTargetStates(e.target.value)} placeholder="TX, ND, PA" style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px 14px', color: '#f0f4f8', fontSize: 14, boxSizing: 'border-box',
                  }} />
                </div>
              </div>
            )}

            <button aria-label="Interactive Button" onClick={() => setStep('creative')} style={{
              background: 'linear-gradient(90deg, #f5c842, #ff9500)',
              color: '#07090f', border: 'none', borderRadius: 12,
              padding: '14px 32px', fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
            }}>Continue → Create Ad</button>
          </div>
        )}

        {/* STEP 3: Creative */}
        {step === 'creative' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Create your ad</h2>
            <p style={{ color: '#8fa3c0', marginBottom: 28 }}>Upload your creative or let Gemini generate it for you in seconds.</p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button aria-label="Interactive Button" disabled={!creative.cta_url || !companyName || aiGenerating} onClick={generateAI} style={{
                background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)',
                color: '#00ff88', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: (!creative.cta_url || !companyName || aiGenerating) ? 0.5 : 1,
              }}>
                {aiGenerating ? '⟳ Generating...' : '✨ Generate with Gemini AI'}
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#8fa3c0', display: 'block', marginBottom: 6 }}>Headline * (max 60 chars)</label>
                <input value={creative.headline} onChange={e => setCreative(p => ({ ...p, headline: e.target.value }))} placeholder="Fuel discounts for escort operators" maxLength={60} style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 14px', color: '#f0f4f8', fontSize: 15, fontWeight: 600, boxSizing: 'border-box',
                }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8fa3c0', display: 'block', marginBottom: 6 }}>Body Copy (max 120 chars)</label>
                <textarea value={creative.body} onChange={e => setCreative(p => ({ ...p, body: e.target.value }))} maxLength={120} rows={2} placeholder="Save $0.30/gallon at 3,000+ truck stops. Free to join." style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 14px', color: '#f0f4f8', fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
                }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#8fa3c0', display: 'block', marginBottom: 6 }}>CTA Button Text</label>
                  <input value={creative.cta_text} onChange={e => setCreative(p => ({ ...p, cta_text: e.target.value }))} placeholder="Get Started" maxLength={20} style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px 14px', color: '#f0f4f8', fontSize: 14, boxSizing: 'border-box',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8fa3c0', display: 'block', marginBottom: 6 }}>Destination URL *</label>
                  <input value={creative.cta_url} onChange={e => setCreative(p => ({ ...p, cta_url: e.target.value }))} placeholder="https://yoursite.com/haul-command" type="url" style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px 14px', color: '#f0f4f8', fontSize: 14, boxSizing: 'border-box',
                  }} />
                </div>
              </div>
            </div>

            {/* Ad preview */}
            {creative.headline && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 12, color: '#8fa3c0', marginBottom: 10 }}>PREVIEW</div>
                <div style={{
                  background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)',
                  borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4f8', marginBottom: 4 }}>{creative.headline}</div>
                    {creative.body && <div style={{ fontSize: 13, color: '#8fa3c0' }}>{creative.body}</div>}
                    <div style={{ fontSize: 10, color: '#f5c842', marginTop: 6 }}>Sponsored · {companyName}</div>
                  </div>
                  <button aria-label="Interactive Button" style={{
                    background: 'linear-gradient(90deg, #f5c842, #ff9500)', border: 'none',
                    borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#07090f', flexShrink: 0, cursor: 'pointer',
                  }}>{creative.cta_text || 'Learn More'}</button>
                </div>
              </div>
            )}

            <button aria-label="Interactive Button" disabled={!creative.headline || !creative.cta_url} onClick={() => setStep('checkout')} style={{
              background: creative.headline && creative.cta_url ? 'linear-gradient(90deg, #f5c842, #ff9500)' : '#2a2a3a',
              color: creative.headline && creative.cta_url ? '#07090f' : '#8fa3c0', border: 'none', borderRadius: 12,
              padding: '14px 32px', fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%', marginTop: 24,
            }}>Continue → Review & Launch</button>
          </div>
        )}

        {/* STEP 4: Checkout */}
        {step === 'checkout' && selectedPlan && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Review & Launch</h2>
            <p style={{ color: '#8fa3c0', marginBottom: 28 }}>Your campaign will be reviewed and go live within 24 hours.</p>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
              {[
                { label: 'Plan',            val: `${selectedPlan.name} — $${selectedPlan.price}/month` },
                { label: 'Company',         val: companyName },
                { label: 'Contact Email',   val: contactEmail },
                { label: 'Audience',        val: AUDIENCE_SEGMENTS.find(s => s.code === selectedSegment)?.name || selectedSegment },
                { label: 'Placements',      val: selectedPlacements.join(', ') },
                { label: 'Headline',        val: creative.headline },
                { label: 'Destination',     val: creative.cta_url },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 0' }}>
                  <div style={{ width: 140, fontSize: 12, color: '#8fa3c0', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ flex: 1, fontSize: 13, color: '#f0f4f8' }}>{item.val}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)',
              borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#b0bcd0', lineHeight: 1.7,
            }}>
              💳 <strong style={{ color: '#f0f4f8' }}>Billing:</strong> Your card will not be charged until your campaign is approved.
              First charge on approval date. Cancel anytime.
            </div>

            <button aria-label="Interactive Button" disabled={submitting} onClick={submit} style={{
              background: 'linear-gradient(90deg, #f5c842, #ff9500)',
              color: '#07090f', border: 'none', borderRadius: 12,
              padding: '16px 32px', fontSize: 16, fontWeight: 900, cursor: 'pointer', width: '100%',
              opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? '⟳ Submitting...' : `🚀 Launch ${selectedPlan.name} Campaign — $${selectedPlan.price}/month`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
