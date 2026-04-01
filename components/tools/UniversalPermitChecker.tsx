'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

/*
 * Universal Localized Permit Checker
 * Renders for ANY country in the hc_seo_tools table.
 * Reads regulatory_variables from props (injected by the server component wrapper)
 * and adapts all labels, units, thresholds, and currencies dynamically.
 */

interface RegulatoryVars {
  max_width_m?: number;
  max_width_in?: number;
  max_height_m?: number;
  max_height_in?: number;
  max_gvw_kg?: number;
  max_gvw_lbs?: number;
  max_gvm_kg?: number;
  max_pbt_kg?: number;
  escort_trigger_width_m?: number;
  escort_trigger_width_in?: number;
  dual_escort_trigger_width_in?: number;
  police_trigger_width_m?: number;
  police_threshold_width_in?: number;
  notification_days_required?: number;
  [key: string]: any;
}

interface Props {
  countryCode: string;
  toolType: string;
  h1Title: string;
  unitSystem: 'imperial' | 'metric';
  currencyCode: string;
  regulatoryBody: string;
  regulatoryVariables: RegulatoryVars;
  tier: string;
  metaDescription?: string;
}

interface SimResult {
  complexity_score: number;
  risk_band: string;
  escort_count: number;
  police_probability: number;
  warnings: string[];
  cost_range: { min: number; max: number };
}

const RISK_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  low:      { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  text: '#10b981', label: 'Low Complexity' },
  moderate: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  text: '#f59e0b', label: 'Moderate' },
  complex:  { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)', text: '#ef4444', label: 'Complex' },
  high:     { bg: 'rgba(220,38,38,0.15)',  border: 'rgba(220,38,38,0.4)',   text: '#dc2626', label: 'High Risk' },
};

export default function UniversalPermitChecker({
  countryCode, toolType, h1Title, unitSystem, currencyCode,
  regulatoryBody, regulatoryVariables: rv, tier, metaDescription,
}: Props) {
  const isMetric = unitSystem === 'metric';

  // Derive thresholds from regulatory_variables, falling back to sensible defaults
  const maxWidth   = isMetric ? (rv.max_width_m ?? 2.55)   : (rv.max_width_in ?? 102);
  const maxHeight  = isMetric ? (rv.max_height_m ?? 4.0)   : (rv.max_height_in ?? 162);
  const maxWeight  = isMetric ? (rv.max_gvw_kg ?? rv.max_gvm_kg ?? rv.max_pbt_kg ?? 40000) : (rv.max_gvw_lbs ?? 80000);
  const escortTriggerW = isMetric ? (rv.escort_trigger_width_m ?? 3.0)  : (rv.escort_trigger_width_in ?? 120);
  const dualEscortW    = isMetric ? (rv.police_trigger_width_m ?? 5.0)  : (rv.dual_escort_trigger_width_in ?? 144);

  const widthUnit  = isMetric ? 'm' : 'in';
  const heightUnit = isMetric ? 'm' : 'in';
  const weightUnit = isMetric ? 'kg' : 'lbs';

  const [width, setWidth]   = useState(maxWidth);
  const [height, setHeight] = useState(maxHeight);
  const [weight, setWeight] = useState(maxWeight);
  const [result, setResult] = useState<SimResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = useCallback(() => {
    setCalculating(true);
    setTimeout(() => {
      let score = 0;
      const warnings: string[] = [];

      // Width analysis
      if (width > maxWidth) {
        const overWidth = width - maxWidth;
        const widthPct = overWidth / maxWidth;
        score += Math.min(35, widthPct * 100);
        warnings.push(`Width exceeds ${maxWidth}${widthUnit} legal limit — permit required`);
      }
      if (width > escortTriggerW) {
        score += 15;
        warnings.push(`Width exceeds ${escortTriggerW}${widthUnit} — escort vehicle required by ${regulatoryBody}`);
      }
      if (width > dualEscortW) {
        score += 15;
        warnings.push(`Width exceeds ${dualEscortW}${widthUnit} — police/dual escort likely mandated`);
      }

      // Height analysis
      if (height > maxHeight) {
        const overHeight = height - maxHeight;
        score += Math.min(20, (overHeight / maxHeight) * 100);
        warnings.push(`Height exceeds ${maxHeight}${heightUnit} — route survey required for overhead clearances`);
      }

      // Weight analysis
      if (weight > maxWeight) {
        const overWeight = weight - maxWeight;
        score += Math.min(20, (overWeight / maxWeight) * 50);
        warnings.push(`Weight exceeds ${maxWeight.toLocaleString()}${weightUnit} — overweight permits needed from ${regulatoryBody}`);
      }

      // Notification days (UK/EU specific)
      if (rv.notification_days_required && score > 20) {
        warnings.push(`${rv.notification_days_required}-day advance notification required to ${regulatoryBody}`);
      }

      score = Math.min(100, Math.max(0, Math.round(score)));

      const risk_band = score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'complex' : 'high';
      const escort_count = score < 25 ? 0 : score < 50 ? 1 : score < 75 ? 2 : 3;
      const police_probability = Math.min(1, score / 100 * 0.7);

      // Very rough cost estimate in local currency
      const baseCostMultiplier = isMetric ? 4.5 : 3.5;
      const costMin = Math.round(baseCostMultiplier * Math.max(1, escort_count) * 80 * 0.85);
      const costMax = Math.round(baseCostMultiplier * Math.max(1, escort_count) * 80 * 1.25);

      setResult({ complexity_score: score, risk_band, escort_count, police_probability, warnings, cost_range: { min: costMin, max: costMax } });
      setCalculating(false);
    }, 500);
  }, [width, height, weight, maxWidth, maxHeight, maxWeight, escortTriggerW, dualEscortW, widthUnit, heightUnit, weightUnit, regulatoryBody, rv, isMetric]);

  const tierBadge = { A: '🥇 Tier A', B: '🔵 Tier B', C: '🥈 Tier C', D: '⬜ Tier D', E: '🟤 Tier E' }[tier] ?? tier;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 15% 20%, rgba(241,169,27,0.06) 0%, transparent 50%), #0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6b7280', marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/tools" style={{ color: '#6b7280', textDecoration: 'none' }}>Tools</Link>
          <span>/</span>
          <span style={{ color: '#9ca3af' }}>{countryCode.toUpperCase()}</span>
          <span>/</span>
          <span style={{ color: '#d1d5db' }}>{h1Title}</span>
        </nav>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', gap: 8, marginBottom: 12 }}>
            <span style={{ padding: '4px 12px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 16, fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>Free Tool</span>
            <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>{tierBadge}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#f9fafb', lineHeight: 1.2 }}>{h1Title}</h1>
          <p style={{ margin: '8px auto 0', maxWidth: 500, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
            {metaDescription || `Check permit requirements, escort mandates, and compliance complexity for ${countryCode.toUpperCase()} heavy haul transport. Powered by ${regulatoryBody} regulatory data.`}
          </p>
        </header>

        {/* Input Panel */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem', marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1 }}>Load Dimensions ({isMetric ? 'Metric' : 'Imperial'})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: `Width (${widthUnit})`,  val: width,  set: setWidth,  hint: `Legal max: ${maxWidth}${widthUnit}` },
              { label: `Height (${heightUnit})`, val: height, set: setHeight, hint: `Legal max: ${maxHeight}${heightUnit}` },
              { label: `Weight (${weightUnit})`, val: weight, set: setWeight, hint: `Legal max: ${maxWeight.toLocaleString()}${weightUnit}` },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
                <input
                  type="number"
                  value={f.val}
                  onChange={e => f.set(parseFloat(e.target.value) || 0)}
                  step={isMetric ? 0.1 : 1}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#f9fafb', fontSize: 16, fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>{f.hint}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Body Tag */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Regulatory Authority</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F1A91B' }}>{regulatoryBody}</span>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculate}
          disabled={calculating}
          style={{
            width: '100%', padding: 14, borderRadius: 12, border: 'none',
            background: calculating ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#F1A91B,#d97706)',
            color: calculating ? '#4b5563' : '#000', fontSize: 15, fontWeight: 800, cursor: calculating ? 'wait' : 'pointer', transition: 'all 0.2s',
          }}
        >
          {calculating ? '⏳ Calculating...' : `🔍 Check ${countryCode.toUpperCase()} Permit Complexity`}
        </button>

        {/* Results */}
        {result && (
          <div style={{ marginTop: 24, animation: 'slide-up-fade 0.4s ease-out' }}>
            <div style={{ background: RISK_COLORS[result.risk_band].bg, border: `1px solid ${RISK_COLORS[result.risk_band].border}`, borderRadius: 16, padding: '1.5rem', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: RISK_COLORS[result.risk_band].text, lineHeight: 1 }}>{result.complexity_score}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: RISK_COLORS[result.risk_band].text, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>{RISK_COLORS[result.risk_band].label}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Escorts Required', val: result.escort_count, color: '#f9fafb' },
                { label: 'Police Escort Prob.', val: `${Math.round(result.police_probability * 100)}%`, color: result.police_probability > 0.3 ? '#f59e0b' : '#10b981' },
                { label: `Est. Range (${currencyCode})`, val: `${result.cost_range.min.toLocaleString()} – ${result.cost_range.max.toLocaleString()}`, color: '#F1A91B' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>

            {result.warnings.length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>⚠ Compliance Warnings</div>
                {result.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#d1d5db', padding: '4px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#f59e0b' }}>•</span> {w}
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ background: 'rgba(241,169,27,0.06)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>Need Operators in {countryCode.toUpperCase()}?</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>Find verified escort / pilot vehicle operators registered in this jurisdiction.</p>
              <Link href={`/directory?country=${countryCode}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 28px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>
                Browse {countryCode.toUpperCase()} Operators →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
