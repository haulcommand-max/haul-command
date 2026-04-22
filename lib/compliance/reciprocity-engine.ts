import { createClient } from '@/lib/supabase/server';

/* ═══════════════════════════════════════════════════════════════════
   RECIPROCITY ENGINE
   Determines if a pilot car operator certified in State A is legally
   permitted to escort oversize loads in State B.

   This is critical for cross-state corridors. If an operator is not
   reciprocally compliant, Haul Command prevents them from being
   dispatched on that segment to protect the motor carrier's liability.
   ═══════════════════════════════════════════════════════════════════ */

export type ComplianceStatus = 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';

export interface ReciprocityResult {
  status: ComplianceStatus;
  allowed_states: string[];
  blocked_states: string[];
  warnings: string[];
}

// Hardcoded core dataset for US Pilot Car Certification Reciprocity
// In production, this would be continually hydrated from the `regulation_pages` DB, 
// but this constant serves as the fast-path memory cache.
const RECIPROCITY_MATRIX: Record<string, string[]> = {
  'WA': ['UT', 'CO', 'FL', 'NC', 'OK'], // States WA accepts
  'UT': ['WA', 'CO', 'FL', 'NC', 'OK'],
  'CO': ['WA', 'UT', 'FL', 'NC', 'OK'],
  'FL': ['WA', 'UT', 'CO', 'NC', 'OK'],
  'NC': ['WA', 'UT', 'CO', 'FL', 'OK'],
  'OK': ['WA', 'UT', 'CO', 'FL', 'NC'],
  'NY': [], // NY accepts NO out-of-state certifications. Strict NY-only.
  'NV': ['UT', 'WA', 'CO'],
  'AZ': ['UT', 'WA', 'CO', 'FL', 'NC', 'OK'],
  'NM': ['UT', 'WA', 'CO', 'FL', 'NC', 'OK'],
  'VA': ['WA', 'UT', 'CO', 'FL', 'NC', 'OK'],
  'GA': ['WA', 'UT', 'CO', 'FL', 'NC', 'OK'],
  // States with no formal certification requirements (accepts generally anywhere)
  'TX': ['ALL'],
  'CA': ['ALL'], // CA has no specific pilot car cert, but requires specific defensive driving courses
  'WY': ['ALL'],
};

const NO_CERT_REQUIRED = ['TX', 'CA', 'WY', 'ID', 'MT', 'ND', 'SD', 'NE', 'KS', 'IA', 'MO', 'AR', 'MS', 'AL', 'SC', 'TN', 'KY', 'IL', 'IN', 'OH', 'MI', 'PA', 'MD', 'DE', 'NJ', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME', 'HI', 'AK'];

/**
 * Check if a specific certification is valid in a target state.
 */
export function isCertValidInState(operatorCertState: string, targetState: string): boolean {
  if (operatorCertState === targetState) return true;
  if (NO_CERT_REQUIRED.includes(targetState)) return true;
  
  const acceptedByTarget = RECIPROCITY_MATRIX[targetState];
  if (!acceptedByTarget) {
    // If we don't have strict data, fail-safe to false to prevent liability
    return false;
  }
  
  if (acceptedByTarget.includes('ALL')) return true;
  return acceptedByTarget.includes(operatorCertState);
}

/**
 * Evaluate an operator against an entire multi-state route.
 * @param operatorCerts Array of state abbreviations where operator holds valid certs (e.g., ['UT', 'NY'])
 * @param routeStates Array of state abbreviations the load will cross (e.g., ['TX', 'NM', 'AZ', 'NV'])
 */
export function evaluateRouteCompliance(operatorCerts: string[], routeStates: string[]): ReciprocityResult {
  const allowed_states: string[] = [];
  const blocked_states: string[] = [];
  const warnings: string[] = [];

  for (const state of routeStates) {
    let statePassed = false;
    for (const cert of operatorCerts) {
      if (isCertValidInState(cert, state)) {
        statePassed = true;
        break;
      }
    }

    if (statePassed) {
      allowed_states.push(state);
    } else {
      blocked_states.push(state);
      
      // Generate specific warning context
      if (state === 'NY') {
        warnings.push(`New York strictly requires a NY State Certified Escort. No reciprocity accepted.`);
      } else if (RECIPROCITY_MATRIX[state] && RECIPROCITY_MATRIX[state].length > 0) {
        warnings.push(`${state} requires certification from: ${RECIPROCITY_MATRIX[state].join(', ')} or native ${state} cert.`);
      } else {
        warnings.push(`Missing valid certification for ${state}.`);
      }
    }
  }

  let status: ComplianceStatus = 'COMPLIANT';
  if (blocked_states.length === routeStates.length) {
    status = 'NON_COMPLIANT';
  } else if (blocked_states.length > 0) {
    status = 'PARTIAL';
  }

  return {
    status,
    allowed_states,
    blocked_states,
    warnings
  };
}

/**
 * Server Action: Get compliant operators for a specific multi-state corridor
 * Filters the database directly by generating a reciprocity compliance map.
 */
export async function getCompliantOperatorsForCorridor(routeStates: string[], limit: number = 50) {
  const supabase = createClient();
  
  // Since SQL can't easily run our complex matrix, we fetch active operators in the region
  // and run them through our high-speed JS engine.
  // We'll fetch operators located in or frequently operating in ANY of the route states.
  
  const { data: operators, error } = await supabase
    .from('hc_global_operators')
    .select('id, full_name, state, certifications, trust_score, avg_response_minutes, availability_status')
    .in('state', routeStates) // Naive geographical net
    .limit(limit * 3); // Over-fetch to allow post-filtering

  if (error || !operators) return [];

  // Post-filter via Reciprocity Engine
  const compliantOperators = operators.map(op => {
    // Parse certifications. Fallback to home state if they have a 'State Certified' tag.
    const certs: string[] = [];
    if (op.certifications && Array.isArray(op.certifications)) {
      op.certifications.forEach(c => {
        // Simple extraction: e.g. "UT Certified" -> "UT"
        const match = c.match(/([A-Z]{2})\s+Certified/i);
        if (match) certs.push(match[1].toUpperCase());
      });
    }
    // Assume hometown certification if nothing explicit is found
    if (certs.length === 0 && op.state) {
      certs.push(op.state);
    }

    const { status, blocked_states } = evaluateRouteCompliance(certs, routeStates);
    return {
      ...op,
      compliance_status: status,
      blocked_states,
    };
  }).filter(op => op.compliance_status !== 'NON_COMPLIANT')
    .sort((a, b) => {
      // Sort fully compliant over partial
      if (a.compliance_status === 'COMPLIANT' && b.compliance_status !== 'COMPLIANT') return -1;
      if (b.compliance_status === 'COMPLIANT' && a.compliance_status !== 'COMPLIANT') return 1;
      // Sort by trust score
      return (b.trust_score || 0) - (a.trust_score || 0);
    });

  return compliantOperators.slice(0, limit);
}
