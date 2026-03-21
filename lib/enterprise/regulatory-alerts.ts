export interface RegulatoryAlert {
  id: string;
  jurisdiction: string;
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  category: 'av_escort' | 'permit' | 'insurance' | 'certification' | 'weight_limit';
  effectiveDate: string;
  source: string;
  affectedStates: string[];
}

export const AV_REGULATORY_ALERTS: RegulatoryAlert[] = [
  {
    id: 'reg-001',
    jurisdiction: 'Federal',
    title: 'FMCSA Proposed Rule: AV Escort Requirements',
    summary: 'Draft federal rule requiring certified escort vehicles for all Class 8 autonomous trucks on interstate highways.',
    impact: 'high',
    category: 'av_escort',
    effectiveDate: '2025-06-01',
    source: 'Federal Register',
    affectedStates: ['ALL'],
  },
  {
    id: 'reg-002',
    jurisdiction: 'Texas',
    title: 'TX SB-1024: Expanded AV Operating Corridors',
    summary: 'Texas expands approved autonomous vehicle corridors to include I-10, I-20, and I-35.',
    impact: 'high',
    category: 'av_escort',
    effectiveDate: '2025-03-15',
    source: 'Texas Legislature',
    affectedStates: ['TX'],
  },
  {
    id: 'reg-003',
    jurisdiction: 'California',
    title: 'CA AB-2100: AV Escort Certification Standards',
    summary: 'California requires specialized certification for escort operators working with autonomous freight vehicles.',
    impact: 'medium',
    category: 'certification',
    effectiveDate: '2025-09-01',
    source: 'California Legislature',
    affectedStates: ['CA'],
  },
];

export function getAlertsForStates(states: string[]): RegulatoryAlert[] {
  return AV_REGULATORY_ALERTS.filter(a =>
    a.affectedStates.includes('ALL') || a.affectedStates.some(s => states.includes(s))
  );
}

export function getHighImpactAlerts(): RegulatoryAlert[] {
  return AV_REGULATORY_ALERTS.filter(a => a.impact === 'high');
}
