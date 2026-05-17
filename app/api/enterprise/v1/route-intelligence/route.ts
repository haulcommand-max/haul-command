import { NextRequest, NextResponse } from 'next/server';
import { evaluateRouteCompliance } from '@/lib/compliance/reciprocity-engine';
import { enterpriseGate } from '@/lib/enterprise/auth-middleware';

/* ═══════════════════════════════════════════════════════════════════
   ENTERPRISE DATA API: ROUTE INTELLIGENCE (v1)
   Provides algorithmic compliance checking, escort requirements, and
   corridor intelligence for Enterprise integrators (TMS / Brokers).
   Authentication via Bearer token representing an Enterprise account.
   ═══════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const gate = await enterpriseGate(req, 'operations_optimizer');
    if (gate.error) return gate.error;

    const payload = await req.json();
    const { 
      route_states, 
      operator_certifications,
      load_dimensions
    } = payload;

    if (!Array.isArray(route_states) || route_states.length === 0) {
      return NextResponse.json({ error: 'Valid "route_states" array required (e.g. ["TX", "NM", "AZ"])' }, { status: 400 });
    }

    // 2. Execute Reciprocity Engine Check
    const complianceProfile = evaluateRouteCompliance(
      operator_certifications || [],
      route_states
    );

    // 3. Draft minimum escort requirements via dimensions.
    // This is a conservative planning heuristic until jurisdiction rule rows are joined in.
    let escortRequirements = '1 Front, 1 Rear';
    let heightPoleRequired = false;
    let policeEscortRequired = false;

    if (load_dimensions) {
      const { width, height } = load_dimensions;
      if (width > 16) {
        policeEscortRequired = true;
      } else if (width < 12) {
        escortRequirements = '1 Front Only';
      }

      if (height > 14.5) {
        heightPoleRequired = true;
      }
    }

    // 4. Determine seeded restrictions across the corridor. This is not a live notice feed.
    const activeRestrictions = [];
    if (route_states.includes('CO')) {
      activeRestrictions.push({ state: 'CO', warning: 'Winter Chain Laws in Effect. All escorts require chains.' });
    }
    if (route_states.includes('NY')) {
      activeRestrictions.push({ state: 'NY', warning: 'Strict NY Certification Required. No Reciprocity.' });
    }

    // 5. Construct Enterprise Data Response
    const responseData = {
      intelligence_id: `hc_intel_${Date.now()}`,
      route_analysis: {
        corridor: route_states.join(' -> '),
        compliance: complianceProfile,
        requirements: {
          escorts_recommended: escortRequirements,
          height_pole_mandatory: heightPoleRequired,
          law_enforcement_mandatory: policeEscortRequired,
        },
        active_restrictions: activeRestrictions
      },
      source: {
        compliance: 'reciprocity_engine',
        escort_requirements: 'dimension_planning_heuristic',
        active_restrictions: 'seeded_static_rules',
        confidence_label: 'planning_estimate',
        disclaimer: 'RouteIntel output is not a permit, legal opinion, or authority approval. Confirm live restrictions, permits, escort requirements, and route clearances before dispatch.'
      },
      cached_at: new Date().toISOString(),
      enterprise: {
        api_key_id: gate.context?.apiKeyId,
        tier: gate.context?.tier,
        product: 'operations_optimizer'
      }
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
