// ══════════════════════════════════════════════════════════════
// GLOBAL LEGAL COMPLIANCE FRAMEWORK
// Spec: Crypto & Legal Block 3 — Legal Walls
// Country-specific privacy, data residency, consent requirements
// ══════════════════════════════════════════════════════════════

export interface LegalFramework {
  country: string;
  privacyLaw: string;                     // Name of primary privacy law
  privacyAuthority: string;               // Regulatory body
  consentModel: 'opt-in' | 'opt-out' | 'notice-only';
  cookieConsent: 'required' | 'recommended' | 'not-required';
  rightToErasure: boolean;
  rightToPortability: boolean;
  dataResidency: 'required' | 'preferred' | 'none';
  breachNotificationHours: number | null;  // Must notify within X hours
  dataProtectionOfficer: boolean;          // DPO required?
  ageOfConsent: number;                    // Digital consent age
  crossBorderTransfer: 'restricted' | 'adequacy' | 'permitted';
  aiTransparency: boolean;                // Must disclose AI usage?
  notes?: string;
}

export const LEGAL_FRAMEWORKS: Record<string, LegalFramework> = {
  // ── GDPR Countries (EU/EEA) — Strictest framework ──
  DE: { country: 'Germany', privacyLaw: 'GDPR + BDSG', privacyAuthority: 'BfDI', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'preferred', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 16, crossBorderTransfer: 'restricted', aiTransparency: true, notes: 'Strictest GDPR enforcement. DPO mandatory for data processing.' },
  FR: { country: 'France', privacyLaw: 'GDPR + Loi Informatique', privacyAuthority: 'CNIL', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'preferred', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 15, crossBorderTransfer: 'restricted', aiTransparency: true },
  NL: { country: 'Netherlands', privacyLaw: 'GDPR + UAVG', privacyAuthority: 'AP', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 16, crossBorderTransfer: 'restricted', aiTransparency: true },
  IT: { country: 'Italy', privacyLaw: 'GDPR + D.Lgs. 196/2003', privacyAuthority: 'Garante', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 14, crossBorderTransfer: 'restricted', aiTransparency: true },
  ES: { country: 'Spain', privacyLaw: 'GDPR + LOPDGDD', privacyAuthority: 'AEPD', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 14, crossBorderTransfer: 'restricted', aiTransparency: true },
  AT: { country: 'Austria', privacyLaw: 'GDPR + DSG', privacyAuthority: 'DSB', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 14, crossBorderTransfer: 'restricted', aiTransparency: true },
  BE: { country: 'Belgium', privacyLaw: 'GDPR', privacyAuthority: 'APD/GBA', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },
  SE: { country: 'Sweden', privacyLaw: 'GDPR', privacyAuthority: 'IMY', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },
  NO: { country: 'Norway', privacyLaw: 'GDPR (EEA)', privacyAuthority: 'Datatilsynet', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },
  DK: { country: 'Denmark', privacyLaw: 'GDPR + Databeskyttelsesloven', privacyAuthority: 'Datatilsynet', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },
  FI: { country: 'Finland', privacyLaw: 'GDPR + Tietosuojalaki', privacyAuthority: 'Tietosuojavaltuutettu', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },
  IE: { country: 'Ireland', privacyLaw: 'GDPR + DPA 2018', privacyAuthority: 'DPC', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 16, crossBorderTransfer: 'restricted', aiTransparency: true },
  PT: { country: 'Portugal', privacyLaw: 'GDPR + Lei 58/2019', privacyAuthority: 'CNPD', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },
  PL: { country: 'Poland', privacyLaw: 'GDPR', privacyAuthority: 'UODO', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 16, crossBorderTransfer: 'restricted', aiTransparency: true },
  GR: { country: 'Greece', privacyLaw: 'GDPR + Law 4624/2019', privacyAuthority: 'HDPA', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 15, crossBorderTransfer: 'restricted', aiTransparency: true },
  CH: { country: 'Switzerland', privacyLaw: 'nFADP (2023)', privacyAuthority: 'FDPIC', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'preferred', breachNotificationHours: null, dataProtectionOfficer: false, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },

  // ── Non-EU Countries ──
  US: { country: 'United States', privacyLaw: 'CCPA/CPRA (CA) + state laws', privacyAuthority: 'FTC / State AGs', consentModel: 'opt-out', cookieConsent: 'recommended', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: null, dataProtectionOfficer: false, ageOfConsent: 13, crossBorderTransfer: 'permitted', aiTransparency: false, notes: 'State-by-state. CCPA/CPRA for CA residents. No federal privacy law yet.' },
  CA: { country: 'Canada', privacyLaw: 'PIPEDA / Quebec Law 25', privacyAuthority: 'OPC', consentModel: 'opt-in', cookieConsent: 'recommended', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: null, dataProtectionOfficer: false, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: false },
  GB: { country: 'United Kingdom', privacyLaw: 'UK GDPR + DPA 2018', privacyAuthority: 'ICO', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },
  AU: { country: 'Australia', privacyLaw: 'Privacy Act 1988', privacyAuthority: 'OAIC', consentModel: 'opt-out', cookieConsent: 'not-required', rightToErasure: false, rightToPortability: false, dataResidency: 'none', breachNotificationHours: null, dataProtectionOfficer: false, ageOfConsent: 15, crossBorderTransfer: 'restricted', aiTransparency: false, notes: 'Reforms underway to strengthen privacy rights.' },
  NZ: { country: 'New Zealand', privacyLaw: 'Privacy Act 2020', privacyAuthority: 'OPC', consentModel: 'opt-out', cookieConsent: 'not-required', rightToErasure: false, rightToPortability: false, dataResidency: 'none', breachNotificationHours: null, dataProtectionOfficer: false, ageOfConsent: 16, crossBorderTransfer: 'restricted', aiTransparency: false },
  BR: { country: 'Brazil', privacyLaw: 'LGPD', privacyAuthority: 'ANPD', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: null, dataProtectionOfficer: true, ageOfConsent: 12, crossBorderTransfer: 'restricted', aiTransparency: true },
  ZA: { country: 'South Africa', privacyLaw: 'POPIA', privacyAuthority: 'Information Regulator', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: false, dataResidency: 'none', breachNotificationHours: null, dataProtectionOfficer: true, ageOfConsent: 18, crossBorderTransfer: 'restricted', aiTransparency: false },
  AE: { country: 'UAE', privacyLaw: 'Federal Decree-Law No. 45/2021', privacyAuthority: 'UAE Data Office', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'preferred', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 18, crossBorderTransfer: 'restricted', aiTransparency: true, notes: 'ADGM/DIFC have their own data protection frameworks.' },
  SA: { country: 'Saudi Arabia', privacyLaw: 'PDPL (2023)', privacyAuthority: 'SDAIA', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'required', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 18, crossBorderTransfer: 'restricted', aiTransparency: true, notes: 'Data must be stored in Saudi Arabia. Strict data localization.' },
  IN: { country: 'India', privacyLaw: 'DPDP Act 2023', privacyAuthority: 'Data Protection Board', consentModel: 'opt-in', cookieConsent: 'recommended', rightToErasure: true, rightToPortability: false, dataResidency: 'preferred', breachNotificationHours: null, dataProtectionOfficer: true, ageOfConsent: 18, crossBorderTransfer: 'restricted', aiTransparency: false, notes: 'DPDP Act enacted August 2023. Implementation rules expected 2025.' },
  JP: { country: 'Japan', privacyLaw: 'APPI', privacyAuthority: 'PPC', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: false, dataResidency: 'none', breachNotificationHours: null, dataProtectionOfficer: false, ageOfConsent: 16, crossBorderTransfer: 'restricted', aiTransparency: false },
  KR: { country: 'South Korea', privacyLaw: 'PIPA', privacyAuthority: 'PIPC', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 14, crossBorderTransfer: 'restricted', aiTransparency: true },
  TR: { country: 'Turkey', privacyLaw: 'KVKK (Law No. 6698)', privacyAuthority: 'KVKK Board', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'preferred', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 18, crossBorderTransfer: 'restricted', aiTransparency: false },
  SG: { country: 'Singapore', privacyLaw: 'PDPA', privacyAuthority: 'PDPC', consentModel: 'opt-in', cookieConsent: 'recommended', rightToErasure: false, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 13, crossBorderTransfer: 'restricted', aiTransparency: true },
  MX: { country: 'Mexico', privacyLaw: 'LFPDPPP', privacyAuthority: 'INAI', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: null, dataProtectionOfficer: false, ageOfConsent: 18, crossBorderTransfer: 'restricted', aiTransparency: false },
  TH: { country: 'Thailand', privacyLaw: 'PDPA (2022)', privacyAuthority: 'PDPC', consentModel: 'opt-in', cookieConsent: 'required', rightToErasure: true, rightToPortability: true, dataResidency: 'none', breachNotificationHours: 72, dataProtectionOfficer: true, ageOfConsent: 10, crossBorderTransfer: 'restricted', aiTransparency: false },
};

// ── Helper functions ──

export function getLegalFramework(countryCode: string): LegalFramework | undefined {
  return LEGAL_FRAMEWORKS[countryCode.toUpperCase()];
}

export function requiresCookieConsent(countryCode: string): boolean {
  const fw = getLegalFramework(countryCode);
  return fw?.cookieConsent === 'required';
}

export function requiresDPO(countryCode: string): boolean {
  return getLegalFramework(countryCode)?.dataProtectionOfficer ?? false;
}

export function supportsRightToErasure(countryCode: string): boolean {
  return getLegalFramework(countryCode)?.rightToErasure ?? false;
}

export function requiresDataResidency(countryCode: string): boolean {
  const fw = getLegalFramework(countryCode);
  return fw?.dataResidency === 'required';
}

export function getGDPRCountries(): string[] {
  return Object.entries(LEGAL_FRAMEWORKS)
    .filter(([_, fw]) => fw.privacyLaw.includes('GDPR'))
    .map(([code]) => code);
}

export function getAITransparencyCountries(): string[] {
  return Object.entries(LEGAL_FRAMEWORKS)
    .filter(([_, fw]) => fw.aiTransparency)
    .map(([code]) => code);
}

export function getBreachNotificationWindow(countryCode: string): string {
  const fw = getLegalFramework(countryCode);
  if (!fw?.breachNotificationHours) return 'As soon as practicable';
  return `Within ${fw.breachNotificationHours} hours`;
}
