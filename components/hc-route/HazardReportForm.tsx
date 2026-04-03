'use client';

import { useState, useCallback } from 'react';

// Hazard type definitions with icons and colors
const HAZARD_TYPES = {
  oversize: [
    { type: 'low_bridge', label: 'Low Bridge', icon: '🌉', color: '#ef4444' },
    { type: 'low_utility_line', label: 'Low Utility Line', icon: '⚡', color: '#f59e0b' },
    { type: 'narrow_road', label: 'Narrow Road', icon: '↔️', color: '#f97316' },
    { type: 'tight_turn', label: 'Tight Turn', icon: '↩️', color: '#e11d48' },
    { type: 'soft_shoulder', label: 'Soft Shoulder', icon: '🏞️', color: '#84cc16' },
    { type: 'steep_grade', label: 'Steep Grade', icon: '⛰️', color: '#8b5cf6' },
    { type: 'low_tree_branches', label: 'Low Trees', icon: '🌳', color: '#22c55e' },
    { type: 'construction_overhead', label: 'Overhead Obstruction', icon: '🚧', color: '#eab308' },
  ],
  general: [
    { type: 'construction', label: 'Construction', icon: '🚧', color: '#f59e0b' },
    { type: 'road_closure', label: 'Road Closed', icon: '⛔', color: '#ef4444' },
    { type: 'accident', label: 'Accident', icon: '💥', color: '#ef4444' },
    { type: 'police', label: 'Police Ahead', icon: '🚔', color: '#3b82f6' },
    { type: 'road_damage', label: 'Road Damage', icon: '🚫', color: '#f97316' },
    { type: 'flooding', label: 'Flooding', icon: '🌊', color: '#06b6d4' },
    { type: 'weight_station_open', label: 'Weight Station Open', icon: '⚖️', color: '#6366f1' },
  ],
  positive: [
    { type: 'good_route', label: 'Good Route', icon: '✅', color: '#22c55e' },
    { type: 'clearance_verified', label: 'Clearance OK', icon: '👍', color: '#22c55e' },
  ],
};

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

interface HazardReportFormProps {
  currentLat: number;
  currentLng: number;
  reporterId?: string;
  onSubmitSuccess?: (hazard: any) => void;
  onClose?: () => void;
}

export default function HazardReportForm({
  currentLat, currentLng, reporterId, onSubmitSuccess, onClose,
}: HazardReportFormProps) {
  const [step, setStep] = useState<'category' | 'type' | 'details' | 'submitting' | 'done'>('category');
  const [category, setCategory] = useState<'oversize' | 'general' | 'positive'>('oversize');
  const [selectedType, setSelectedType] = useState<string>('');
  const [severity, setSeverity] = useState<string>('medium');
  const [description, setDescription] = useState('');
  const [measuredHeight, setMeasuredHeight] = useState('');
  const [measuredWidth, setMeasuredWidth] = useState('');
  const [roadName, setRoadName] = useState('');
  const [error, setError] = useState('');

  const handleCategorySelect = (cat: 'oversize' | 'general' | 'positive') => {
    setCategory(cat);
    setStep('type');
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleSubmit = useCallback(async () => {
    setStep('submitting');
    setError('');
    try {
      const res = await fetch('/api/hc-route/hazard-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_id: reporterId,
          lat: currentLat,
          lng: currentLng,
          hazard_type: selectedType,
          description,
          severity,
          measured_height_ft: measuredHeight ? parseFloat(measuredHeight) : null,
          measured_width_ft: measuredWidth ? parseFloat(measuredWidth) : null,
          road_name: roadName || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('done');
        onSubmitSuccess?.(data.hazard);
      } else {
        setError(data.error || 'Failed to submit report');
        setStep('details');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('details');
    }
  }, [currentLat, currentLng, reporterId, selectedType, description, severity, measuredHeight, measuredWidth, roadName, onSubmitSuccess]);

  const selectedTypeInfo = [...HAZARD_TYPES.oversize, ...HAZARD_TYPES.general, ...HAZARD_TYPES.positive].find(h => h.type === selectedType);
  const needsMeasurements = ['low_bridge', 'low_utility_line', 'narrow_road', 'construction_overhead', 'clearance_verified'].includes(selectedType);

  return (
    <div style={{position: 'fixed',bottom: 0,left: 0,right: 0,zIndex: 9999,background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',borderTopLeftRadius: 20,borderTopRightRadius: 20,padding: '16px 20px 24px',color: '#f8fafc',boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',maxHeight: '70vh',overflow: 'auto'}}>
      {/* Header */}
      <div style={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',marginBottom: 16 }}>
        <div style={{display: 'flex',alignItems: 'center',gap: 8 }}>
          <span style={{fontSize: 20 }}>🚨</span>
          <h3 style={{margin: 0,fontSize: 18,fontWeight: 700 }}>
            {step === 'category' && 'Report Hazard'}
            {step === 'type' && `${category === 'oversize' ? '🚚 Oversize' : category === 'positive' ? '✅ Positive' : '⚠️ General'} Hazards`}
            {step === 'details' && `${selectedTypeInfo?.icon} ${selectedTypeInfo?.label}`}
            {step === 'submitting' && 'Submitting...'}
            {step === 'done' && '✅ Reported!'}
          </h3>
        </div>
        <button aria-label="Interactive Button" onClick={onClose} style={{background: 'rgba(255,255,255,0.1)',border: 'none',color: '#94a3b8',borderRadius: 8,padding: '6px 12px',cursor: 'pointer',fontSize: 14}}>✕</button>
      </div>

      {/* Step 1: Category */}
      {step === 'category' && (
        <div style={{display: 'grid',gridTemplateColumns: '1fr 1fr 1fr',gap: 12 }}>
          {[
            { key: 'oversize' as const, icon: '🚚', label: 'Oversize\nHazards', color: '#ef4444' },
            { key: 'general' as const, icon: '⚠️', label: 'General\nHazards', color: '#f59e0b' },
            { key: 'positive' as const, icon: '✅', label: 'Good\nRoute', color: '#22c55e' },
          ].map(cat => (
            <button aria-label="Interactive Button" key={cat.key} onClick={() => handleCategorySelect(cat.key)} style={{background: `${cat.color}15`,border: `2px solid ${cat.color}40`,borderRadius: 16,padding: '20px 12px',cursor: 'pointer',display: 'flex',flexDirection: 'column',alignItems: 'center',gap: 8,transition: 'all 0.2s'}}>
              <span style={{fontSize: 32 }}>{cat.icon}</span>
              <span style={{color: '#e2e8f0',fontSize: 13,fontWeight: 600,textAlign: 'center',whiteSpace: 'pre-line' }}>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Type */}
      {step === 'type' && (
        <div>
          <button aria-label="Interactive Button" onClick={() => setStep('category')} style={{background: 'none',border: 'none',color: '#60a5fa',cursor: 'pointer',fontSize: 13,marginBottom: 12,padding: 0}}>← Back</button>
          <div style={{display: 'grid',gridTemplateColumns: '1fr 1fr',gap: 10 }}>
            {HAZARD_TYPES[category].map(h => (
              <button aria-label="Interactive Button" key={h.type} onClick={() => handleTypeSelect(h.type)} style={{background: `${h.color}15`,border: `1px solid ${h.color}30`,borderRadius: 12,padding: '14px 12px',cursor: 'pointer',display: 'flex',alignItems: 'center',gap: 10,transition: 'all 0.2s'}}>
                <span style={{fontSize: 24 }}>{h.icon}</span>
                <span style={{color: '#e2e8f0',fontSize: 13,fontWeight: 600 }}>{h.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 'details' && (
        <div>
          <button aria-label="Interactive Button" onClick={() => setStep('type')} style={{background: 'none',border: 'none',color: '#60a5fa',cursor: 'pointer',fontSize: 13,marginBottom: 12,padding: 0}}>← Back</button>

          {error && <div style={{background: '#ef444420',border: '1px solid #ef4444',borderRadius: 8,padding: '8px 12px',marginBottom: 12,color: '#fca5a5',fontSize: 13 }}>{error}</div>}

          {/* Severity */}
          <div style={{marginBottom: 16 }}>
            <label style={{fontSize: 12,color: '#94a3b8',marginBottom: 6,display: 'block' }}>Severity</label>
            <div style={{display: 'flex',gap: 8 }}>
              {SEVERITY_OPTIONS.map(s => (
                <button aria-label="Interactive Button" key={s.value} onClick={() => setSeverity(s.value)} style={{flex: 1,padding: '8px 0',borderRadius: 8,cursor: 'pointer',fontSize: 12,fontWeight: 600,background: severity === s.value ? `${s.color}30` : 'rgba(255,255,255,0.05)',border: severity === s.value ? `2px solid ${s.color}` : '1px solid rgba(255,255,255,0.1)',color: severity === s.value ? s.color : '#94a3b8'}}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Measurements (conditional) */}
          {needsMeasurements && (
            <div style={{display: 'grid',gridTemplateColumns: '1fr 1fr',gap: 10,marginBottom: 16 }}>
              <div>
                <label style={{fontSize: 12,color: '#94a3b8',marginBottom: 4,display: 'block' }}>Height (ft)</label>
                <input type="number" step="0.1" value={measuredHeight} onChange={e => setMeasuredHeight(e.target.value)}
                  placeholder="e.g. 14.2" style={{width: '100%',padding: '10px 12px',borderRadius: 8,border: '1px solid rgba(255,255,255,0.1)',background: 'rgba(255,255,255,0.05)',color: '#f8fafc',fontSize: 14 }} />
              </div>
              <div>
                <label style={{fontSize: 12,color: '#94a3b8',marginBottom: 4,display: 'block' }}>Width (ft)</label>
                <input type="number" step="0.1" value={measuredWidth} onChange={e => setMeasuredWidth(e.target.value)}
                  placeholder="e.g. 12.0" style={{width: '100%',padding: '10px 12px',borderRadius: 8,border: '1px solid rgba(255,255,255,0.1)',background: 'rgba(255,255,255,0.05)',color: '#f8fafc',fontSize: 14 }} />
              </div>
            </div>
          )}

          {/* Road name */}
          <div style={{marginBottom: 16 }}>
            <label style={{fontSize: 12,color: '#94a3b8',marginBottom: 4,display: 'block' }}>Road Name (optional)</label>
            <input type="text" value={roadName} onChange={e => setRoadName(e.target.value)}
              placeholder="e.g. I-35 Southbound" style={{width: '100%',padding: '10px 12px',borderRadius: 8,border: '1px solid rgba(255,255,255,0.1)',background: 'rgba(255,255,255,0.05)',color: '#f8fafc',fontSize: 14 }} />
          </div>

          {/* Description */}
          <div style={{marginBottom: 16 }}>
            <label style={{fontSize: 12,color: '#94a3b8',marginBottom: 4,display: 'block' }}>Details (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Any extra details..." rows={2} style={{width: '100%',padding: '10px 12px',borderRadius: 8,border: '1px solid rgba(255,255,255,0.1)',background: 'rgba(255,255,255,0.05)',color: '#f8fafc',fontSize: 14,resize: 'vertical' }} />
          </div>

          {/* Submit */}
          <button aria-label="Interactive Button" onClick={handleSubmit} style={{width: '100%',padding: '14px',borderRadius: 12,border: 'none',cursor: 'pointer',background: 'linear-gradient(135deg, #3b82f6, #2563eb)',color: '#fff',fontSize: 16,fontWeight: 700,transition: 'all 0.2s'}}>
            📡 Submit Report
          </button>
        </div>
      )}

      {/* Submitting */}
      {step === 'submitting' && (
        <div style={{textAlign: 'center',padding: 40 }}>
          <div style={{fontSize: 40,marginBottom: 12 }}>📡</div>
          <p style={{color: '#94a3b8' }}>Submitting hazard report...</p>
        </div>
      )}

      {/* Done */}
      {step === 'done' && (
        <div style={{textAlign: 'center',padding: 40 }}>
          <div style={{fontSize: 40,marginBottom: 12 }}>✅</div>
          <p style={{color: '#22c55e',fontWeight: 700,fontSize: 18 }}>Report Submitted!</p>
          <p style={{color: '#94a3b8',fontSize: 13 }}>Other HC drivers will be alerted. Thank you!</p>
          <button aria-label="Interactive Button" onClick={onClose} style={{marginTop: 16,padding: '10px 24px',borderRadius: 8,border: 'none',background: 'rgba(255,255,255,0.1)',color: '#e2e8f0',cursor: 'pointer'}}>Done</button>
        </div>
      )}
    </div>
  );
}
