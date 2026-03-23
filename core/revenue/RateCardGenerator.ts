// ══════════════════════════════════════════════════════════════
// RATE CARD PDF GENERATOR — Revenue Leak #8
// Operators create professional rate cards. Brokers see value.
// Free: Basic card. Pro ($99/mo): Branded, multi-corridor, QR.
// ══════════════════════════════════════════════════════════════

export interface RateCardData {
  operatorName: string;
  companyName?: string;
  logoUrl?: string;
  phone: string;
  email: string;
  website?: string;
  state: string;
  corridors: CorridorRate[];
  certifications: string[];
  insuranceCoverage: string;
  responseGuarantee?: string;      // "Under 30 minutes"
  escrowEnabled: boolean;
  avCertified: boolean;
  validUntil: string;              // Date
  generatedAt: string;
  version: 'basic' | 'pro';
}

export interface CorridorRate {
  corridor: string;                // "I-10 Houston → San Antonio"
  serviceType: string;             // "Pilot Car", "Height Pole", etc.
  rateType: 'hourly' | 'per_mile' | 'flat';
  rate: number;
  currency: string;
  minimumHours?: number;
  nightSurcharge?: number;         // percentage
  weekendSurcharge?: number;
  notes?: string;
}

// Rate card HTML template (rendered server-side → PDF via Puppeteer or @react-pdf/renderer)
export function generateRateCardHTML(data: RateCardData): string {
  const gold = '#C6923A';
  const bg = '#0B0B0C';
  const surface = '#161619';
  const text = '#F0F0F2';
  const muted = '#6B6B75';

  const corridorRows = data.corridors.map(c => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 12px 16px; font-weight: 600; color: ${text}; font-size: 13px;">${c.corridor}</td>
      <td style="padding: 12px 16px; color: ${muted}; font-size: 13px;">${c.serviceType}</td>
      <td style="padding: 12px 16px; color: ${gold}; font-weight: 800; font-size: 14px; text-align: right;">
        $${c.rate.toFixed(2)}/${c.rateType === 'hourly' ? 'hr' : c.rateType === 'per_mile' ? 'mi' : 'flat'}
      </td>
      <td style="padding: 12px 16px; color: ${muted}; font-size: 11px;">${c.notes || '—'}</td>
    </tr>
  `).join('');

  const certBadges = data.certifications.map(c => `
    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px;
      background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15); color: #22c55e; font-size: 10px; font-weight: 700;">
      ✓ ${c}
    </span>
  `).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: ${bg}; color: ${text}; }
  @page { size: A4; margin: 0; }
</style></head>
<body>
<div style="max-width: 800px; margin: 0 auto; padding: 40px;">
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid ${gold};">
    <div>
      <div style="font-size: 28px; font-weight: 900; color: ${text}; letter-spacing: -0.02em;">
        ${data.companyName || data.operatorName}
      </div>
      <div style="font-size: 13px; color: ${muted}; margin-top: 4px;">Professional Rate Card</div>
      <div style="display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap;">${certBadges}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; color: ${muted};">Contact</div>
      <div style="font-size: 13px; color: ${text}; font-weight: 600; margin-top: 4px;">${data.phone}</div>
      <div style="font-size: 12px; color: ${gold}; margin-top: 2px;">${data.email}</div>
      ${data.website ? `<div style="font-size: 11px; color: ${muted}; margin-top: 2px;">${data.website}</div>` : ''}
    </div>
  </div>

  <!-- Rates Table -->
  <table style="width: 100%; border-collapse: collapse; background: ${surface}; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);">
    <thead>
      <tr style="background: rgba(198,146,58,0.08);">
        <th style="padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em;">Corridor</th>
        <th style="padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em;">Service</th>
        <th style="padding: 12px 16px; text-align: right; font-size: 10px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em;">Rate</th>
        <th style="padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em;">Notes</th>
      </tr>
    </thead>
    <tbody>${corridorRows}</tbody>
  </table>

  <!-- Footer -->
  <div style="display: flex; justify-content: space-between; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);">
    <div style="font-size: 10px; color: ${muted};">
      Valid until ${data.validUntil} · Generated ${data.generatedAt}
      ${data.escrowEnabled ? ' · Escrow payments accepted' : ''}
      ${data.avCertified ? ' · AV escort certified' : ''}
    </div>
    ${data.version === 'pro' ? '' : `<div style="font-size: 9px; color: ${muted};">Powered by Haul Command</div>`}
  </div>
</div>
</body></html>`;
}

// API-ready function to generate rate card data from operator profile
export function buildRateCardFromProfile(profile: any): RateCardData {
  return {
    operatorName: profile.name || 'Operator',
    companyName: profile.company_name,
    phone: profile.phone || '',
    email: profile.email || '',
    website: profile.website,
    state: profile.region_code || '',
    corridors: (profile.rates || []).map((r: any) => ({
      corridor: r.corridor || r.route || 'General',
      serviceType: r.service_type || 'Pilot Car',
      rateType: r.rate_type || 'hourly',
      rate: r.rate || 0,
      currency: r.currency || 'USD',
      minimumHours: r.min_hours,
      nightSurcharge: r.night_surcharge,
      weekendSurcharge: r.weekend_surcharge,
      notes: r.notes,
    })),
    certifications: profile.certifications || [],
    insuranceCoverage: profile.insurance_amount || 'Verified',
    responseGuarantee: profile.response_guarantee,
    escrowEnabled: profile.escrow_enabled || false,
    avCertified: profile.av_certified || false,
    validUntil: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    generatedAt: new Date().toISOString().split('T')[0],
    version: profile.subscription_tier === 'pro' ? 'pro' : 'basic',
  };
}
