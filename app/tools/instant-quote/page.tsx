'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { generateInstantQuote, type QuoteRequest, type InstantQuote } from '@/lib/quotes/instant-quote-engine';

// ═══════════════════════════════════════════════════════════════
// INSTANT QUOTE TOOL — Public surface for the #1 commercial query:
// "How much does a pilot car cost?"
//
// Targets: pilot car cost, escort vehicle quote, oversize load
// escort pricing, how much does a pilot car cost in [state]
//
// Wires: lib/quotes/instant-quote-engine.ts generateInstantQuote()
// ═══════════════════════════════════════════════════════════════

const T = {
  bg: '#0B0B0C',
  gold: '#D4A843',
  goldDim: 'rgba(212,168,67,0.10)',
  goldBorder: 'rgba(212,168,67,0.20)',
  text: '#f9fafb',
  textSecondary: '#9CA3AF',
  muted: '#6b7280',
  bgCard: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)',
  cyan: '#22d3ee',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
  { code: 'AE', label: 'UAE' },
  { code: 'SA', label: 'Saudi Arabia' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'South Korea' },
  { code: 'SE', label: 'Sweden' },
  { code: 'NO', label: 'Norway' },
];

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
  borderRadius: 10, padding: '10px 14px', color: T.text, fontSize: 14,
  fontFamily: "'Inter', system-ui", outline: 'none', width: '100%',
};

export default function InstantQuotePage() {
  const [width, setWidth] = useState('3.7');
  const [height, setHeight] = useState('4.3');
  const [length, setLength] = useState('20');
  const [weight, setWeight] = useState('40');
  const [originState, setOriginState] = useState('TX');
  const [destState, setDestState] = useState('OK');
  const [country, setCountry] = useState('US');
  const [urgency, setUrgency] = useState<'standard' | 'emergency' | 'planned'>('standard');
  const [quote, setQuote] = useState<InstantQuote | null>(null);

  const handleQuote = useCallback(() => {
    const request: QuoteRequest = {
      requestId: `web-${Date.now()}`,
      requesterType: 'broker',
      loadDimensions: {
        widthM: parseFloat(width) || 3.0,
        heightM: parseFloat(height) || 4.0,
        lengthM: parseFloat(length) || 15,
        weightT: parseFloat(weight) || 30,
      },
      loadDescription: 'Web quote request',
      origin: originState,
      originState,
      originCountry: country,
      destination: destState,
      destinationState: destState,
      destinationCountry: country,
      statesCrossed: [originState, destState],
      preferredDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      flexibility: 'plus_minus_3_days',
      urgency,
    };
    setQuote(generateInstantQuote(request));
  }, [width, height, length, weight, originState, destState, country, urgency]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', system-ui" }}>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Instant Escort Quote Calculator",
        "url": "https://haulcommand.com/tools/instant-quote",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Get instant pilot car and escort vehicle pricing. Enter load dimensions, route, and urgency for competitive rate quotes across 120 countries.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://haulcommand.com" },
            { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://haulcommand.com/tools" },
            { "@type": "ListItem", "position": 3, "name": "Instant Quote", "item": "https://haulcommand.com/tools/instant-quote" },
          ]
        }
      }) }} />
      {/* FAQPage for "how much does a pilot car cost" */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "How much does a pilot car cost?", "acceptedAnswer": { "@type": "Answer", "text": "Pilot car costs typically range from $400-$800 per day in the United States, $450-$900 CAD per day in Canada, and $350-$700 GBP per day in the UK. Costs vary by load width, route complexity, number of escorts needed, urgency, and seasonal demand. Use the Haul Command Instant Quote tool for a specific estimate." }},
          { "@type": "Question", "name": "How many escort vehicles do I need?", "acceptedAnswer": { "@type": "Answer", "text": "For loads wider than 12 feet (3.66m), most states require at least 1 escort vehicle. Loads wider than 14 feet (4.27m) typically require 2 escorts. Superloads wider than 16 feet (4.88m) may require police escorts in addition to civil escorts." }},
          { "@type": "Question", "name": "What affects pilot car pricing?", "acceptedAnswer": { "@type": "Answer", "text": "Key factors include: load dimensions (wider loads need more escorts), route length, number of states crossed (each requires separate permits), urgency (emergency moves cost 1.5x), time of year (peak season surcharges), and availability of certified operators in the corridor." }},
        ]
      }) }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1rem' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 11, color: T.muted, marginBottom: 24, display: 'flex', gap: 6 }}>
          <Link href="/" style={{ color: T.muted, textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/tools" style={{ color: T.muted, textDecoration: 'none' }}>Tools</Link>
          <span>›</span>
          <span style={{ color: T.gold }}>Instant Quote</span>
        </nav>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', gap: 6, padding: '4px 14px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 20, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.cyan, textTransform: 'uppercase', letterSpacing: 2 }}>⚡ Instant Quote</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: T.text, letterSpacing: -1 }}>
            How Much Does a <span style={{ color: T.gold }}>Pilot Car</span> Cost?
          </h1>
          <p style={{ margin: '12px auto 0', fontSize: 14, color: T.muted, maxWidth: 520, lineHeight: 1.6 }}>
            Get an instant escort vehicle pricing estimate. Enter your load dimensions, route, and urgency for real-time market rates across 120 countries.
          </p>
        </header>

        {/* Quote Form */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: '24px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Load Dimensions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <InputField label="Width (meters)">
              <input style={inputStyle} type="number" step="0.1" value={width} onChange={e => setWidth(e.target.value)} />
            </InputField>
            <InputField label="Height (meters)">
              <input style={inputStyle} type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} />
            </InputField>
            <InputField label="Length (meters)">
              <input style={inputStyle} type="number" step="0.1" value={length} onChange={e => setLength(e.target.value)} />
            </InputField>
            <InputField label="Weight (tonnes)">
              <input style={inputStyle} type="number" step="1" value={weight} onChange={e => setWeight(e.target.value)} />
            </InputField>
          </div>

          <div style={{ height: 1, background: T.border, margin: '20px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Route & Urgency</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <InputField label="Country">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={country} onChange={e => setCountry(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </InputField>
            <InputField label="Origin State/Region">
              {country === 'US' ? (
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={originState} onChange={e => setOriginState(e.target.value)}>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input style={inputStyle} value={originState} onChange={e => setOriginState(e.target.value)} placeholder="Region" />
              )}
            </InputField>
            <InputField label="Destination State/Region">
              {country === 'US' ? (
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={destState} onChange={e => setDestState(e.target.value)}>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input style={inputStyle} value={destState} onChange={e => setDestState(e.target.value)} placeholder="Region" />
              )}
            </InputField>
            <InputField label="Urgency">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={urgency} onChange={e => setUrgency(e.target.value as any)}>
                <option value="planned">Planned (5+ days out)</option>
                <option value="standard">Standard (1-5 days)</option>
                <option value="emergency">Emergency (same day)</option>
              </select>
            </InputField>
          </div>

          <button
            onClick={handleQuote}
            style={{
              width: '100%', marginTop: 24, padding: '14px 0', borderRadius: 12,
              background: `linear-gradient(135deg, ${T.gold}, #d97706)`,
              border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Get Instant Quote →
          </button>
        </div>

        {/* Quote Result */}
        {quote && (
          <div style={{ background: T.bgCard, border: `1px solid ${T.goldBorder}`, borderRadius: 20, padding: '24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 6, background: 'rgba(34,211,238,0.12)', color: T.cyan, border: '1px solid rgba(34,211,238,0.25)' }}>Quote #{quote.quoteId.slice(-6)}</span>
              <span style={{ fontSize: 11, color: T.muted }}>Generated {new Date(quote.timestamp).toLocaleTimeString()}</span>
            </div>

            {/* Pricing */}
            <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Estimated Total Cost</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: T.gold }}>
                {quote.pricing.currency === 'USD' ? '$' : ''}{quote.pricing.totalLow.toLocaleString()} — {quote.pricing.currency === 'USD' ? '$' : ''}{quote.pricing.totalHigh.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{quote.pricing.currency} · {quote.pricing.seasonalNote}</div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {/* Escorts */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Escorts Required</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.text }}>{quote.escortRequirements.maxEscortsNeeded}</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>{quote.escortRequirements.escortType === 'both' ? 'Civil + Police' : quote.escortRequirements.escortType === 'police_required' ? 'Police Required' : 'Civil Escorts'}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Escort cost: {quote.pricing.currency === 'USD' ? '$' : ''}{quote.pricing.escortLow.toLocaleString()}-{quote.pricing.escortHigh.toLocaleString()}</div>
              </div>
              {/* Route */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Route Summary</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.text }}>{quote.routeSummary.totalDistanceKm.toLocaleString()} km</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>{quote.routeSummary.statesCrossed} state(s) crossed</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Est. {quote.routeSummary.estimatedTransitDays} transit day(s)</div>
              </div>
              {/* Permits */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Permits</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.text }}>{quote.permits.count}</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>Est. cost: ${quote.permits.estimatedCost}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Lead time: {quote.permits.leadTimeDays} day(s)</div>
              </div>
              {/* Coverage */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Operator Coverage</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: quote.coverage.overallConfidence > 60 ? '#10b981' : T.gold }}>{quote.coverage.overallConfidence}%</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>{quote.coverage.matchedOperators} operators matched</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Avg response: {quote.coverage.avgResponseTimeHours}h</div>
              </div>
            </div>

            {/* Warnings */}
            {quote.warnings.length > 0 && (
              <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>⚠️ Warnings</div>
                {quote.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: T.textSecondary, marginBottom: 4 }}>• {w}</div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/directory" style={{
                flex: 1, padding: '14px 0', borderRadius: 12, textAlign: 'center',
                background: `linear-gradient(135deg, ${T.gold}, #d97706)`,
                color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none', minWidth: 180,
              }}>
                {quote.callToAction} →
              </Link>
              <Link href="/contact" style={{
                flex: 1, padding: '14px 0', borderRadius: 12, textAlign: 'center',
                background: T.goldDim, border: `1px solid ${T.goldBorder}`,
                color: T.gold, fontWeight: 700, fontSize: 14, textDecoration: 'none', minWidth: 180,
              }}>
                Talk to a Specialist
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Cross-Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 32 }}>
          {[
            { href: '/tools/escort-calculator', icon: '🧮', label: 'Escort Calculator' },
            { href: '/tools/rate-lookup', icon: '💰', label: 'Rate Lookup' },
            { href: '/tools/route-complexity', icon: '🗺️', label: 'Route Complexity' },
            { href: '/directory', icon: '📂', label: 'Find Operators' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{
              padding: '14px 16px', borderRadius: 12, textDecoration: 'none',
              background: T.bgCard, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, fontWeight: 700, color: T.text,
            }}>
              <span style={{ fontSize: 20 }}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
