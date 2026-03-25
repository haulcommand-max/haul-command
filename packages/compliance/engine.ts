/**
 * HAUL COMMAND — Global Compliance + Certification Verification Engine
 * Merges into existing compliance infrastructure.
 * AI-powered cert verification: Gemini OCR → OpenAI structure → validation.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CertificationRecord {
  id: string;
  operator_id: string;
  type: CertificationType;
  issuing_authority: string;
  issuing_country: string;
  document_url?: string;
  expiration_date?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  confidence_score: number;
  extracted_data?: Record<string, any>;
  verified_at?: string;
  verified_by: 'ai' | 'manual';
  created_at: string;
}

export type CertificationType =
  | 'state_dot_certification'
  | 'provincial_certification'
  | 'insurance_certificate'
  | 'escort_license'
  | 'vehicle_registration'
  | 'twic_card'
  | 'nhvr_accreditation'
  | 'esdal_registration'
  | 'hazmat_endorsement'
  | 'commercial_drivers_license'
  | 'general_liability_insurance'
  | 'workers_compensation';

// ═══════════════════════════════════════════════════════════════
// COUNTRY COMPLIANCE RULES
// ═══════════════════════════════════════════════════════════════

export const COMPLIANCE_RULES: Record<string, {
  required: CertificationType[];
  recommended: CertificationType[];
  notes: string;
}> = {
  US: {
    required: ['state_dot_certification', 'insurance_certificate', 'vehicle_registration'],
    recommended: ['twic_card', 'commercial_drivers_license'],
    notes: 'Requirements vary by state. Most states require specific pilot car licensing.',
  },
  CA: {
    required: ['provincial_certification', 'insurance_certificate'],
    recommended: ['commercial_drivers_license'],
    notes: 'Each province has separate escort certification requirements.',
  },
  AU: {
    required: ['nhvr_accreditation', 'insurance_certificate'],
    recommended: ['vehicle_registration'],
    notes: 'National Heavy Vehicle Regulator (NHVR) accreditation mandatory for all escort vehicles.',
  },
  GB: {
    required: ['esdal_registration', 'insurance_certificate'],
    recommended: ['vehicle_registration'],
    notes: 'ESDAL (Electronic Service Delivery for Abnormal Loads) registration required.',
  },
  DE: {
    required: ['insurance_certificate', 'vehicle_registration'],
    recommended: [],
    notes: 'BF3/BF4 heavy transport permit requirements apply.',
  },
  NL: {
    required: ['insurance_certificate'],
    recommended: [],
    notes: 'RDW vehicle registration required for escort operations.',
  },
  AE: {
    required: ['insurance_certificate'],
    recommended: [],
    notes: 'RTA/ADNOC/municipal permits vary by emirate.',
  },
  BR: {
    required: ['insurance_certificate'],
    recommended: [],
    notes: 'DNIT special transport authorization required for oversize loads.',
  },
  ZA: {
    required: ['insurance_certificate'],
    recommended: [],
    notes: 'Abnormal Load Permit required from provincial roads department.',
  },
  NZ: {
    required: ['insurance_certificate'],
    recommended: [],
    notes: 'NZTA overweight/overdimension permit required.',
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE CHECKER
// ═══════════════════════════════════════════════════════════════

export interface ComplianceResult {
  compliant: boolean;
  missing: CertificationType[];
  expired: CertificationType[];
  verified: CertificationType[];
  risk_level: 'low' | 'medium' | 'high';
  score: number;
}

export function checkCompliance(
  operatorCerts: CertificationRecord[],
  countryCode: string
): ComplianceResult {
  const rules = COMPLIANCE_RULES[countryCode];
  if (!rules) {
    return { compliant: true, missing: [], expired: [], verified: [], risk_level: 'medium', score: 50 };
  }

  const activeCerts = operatorCerts.filter(c => c.status === 'verified');
  const activeTypes = new Set(activeCerts.map(c => c.type));

  const missing = rules.required.filter(req => !activeTypes.has(req));
  const expired = operatorCerts
    .filter(c => c.expiration_date && new Date(c.expiration_date) < new Date())
    .map(c => c.type);
  const verified = activeCerts.map(c => c.type);

  const compliant = missing.length === 0 && expired.length === 0;
  let score = 100;
  score -= missing.length * 25;
  score -= expired.length * 15;
  score = Math.max(0, score);

  const risk_level = score >= 75 ? 'low' : score >= 40 ? 'medium' : 'high';

  return { compliant, missing, expired, verified, risk_level, score };
}

// ═══════════════════════════════════════════════════════════════
// AI CERTIFICATION VERIFICATION PIPELINE
// ═══════════════════════════════════════════════════════════════

export interface VerificationResult {
  valid: boolean;
  confidence: number;
  extracted: {
    holder_name?: string;
    cert_number?: string;
    issuing_authority?: string;
    issue_date?: string;
    expiration_date?: string;
    cert_type?: string;
    state_or_region?: string;
  };
  flags: string[];
}

/**
 * Multi-model AI verification pipeline.
 * Step 1: Gemini for OCR (best for document/image parsing)
 * Step 2: OpenAI for structured extraction (best for schema)
 * Step 3: Rule-based validation
 */
export async function verifyDocument(
  documentUrl: string,
  expectedType: CertificationType
): Promise<VerificationResult> {
  // Step 1: OCR extraction (would call Gemini Vision API)
  const rawText = await extractTextFromDocument(documentUrl);

  // Step 2: Structured parsing
  const structured = parseDocumentFields(rawText, expectedType);

  // Step 3: Validation rules
  const flags: string[] = [];
  let confidence = 0.5;

  if (structured.cert_number) confidence += 0.15;
  if (structured.issuing_authority) confidence += 0.15;
  if (structured.expiration_date) {
    confidence += 0.1;
    if (new Date(structured.expiration_date) < new Date()) {
      flags.push('EXPIRED');
      confidence -= 0.2;
    }
  }
  if (structured.holder_name) confidence += 0.1;

  return {
    valid: confidence >= 0.6 && flags.length === 0,
    confidence: Math.min(1, Math.max(0, confidence)),
    extracted: structured,
    flags,
  };
}

// Placeholder OCR — requires Gemini Vision API key in production
async function extractTextFromDocument(url: string): Promise<string> {
  // In production: call Gemini Vision API
  // const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent', {...})
  return `[OCR extraction would process: ${url}]`;
}

function parseDocumentFields(rawText: string, expectedType: CertificationType): VerificationResult['extracted'] {
  // In production: call OpenAI structured output API
  return {
    cert_type: expectedType,
  };
}

// ═══════════════════════════════════════════════════════════════
// LICENSE REGISTRY (searchable)
// ═══════════════════════════════════════════════════════════════

export function buildLicenseQuery(filters: {
  country?: string;
  type?: CertificationType;
  status?: string;
}): string {
  const conditions: string[] = [];
  if (filters.country) conditions.push(`issuing_country = '${filters.country}'`);
  if (filters.type) conditions.push(`type = '${filters.type}'`);
  if (filters.status) conditions.push(`status = '${filters.status}'`);
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}
